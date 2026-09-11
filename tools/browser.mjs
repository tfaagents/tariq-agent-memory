#!/usr/bin/env node
// The browser worker's hands: Chrome on this machine over the DevTools protocol, headless
// by default, its own profile, only the hosts in config/browser.json. Every call is logged
// to work/browser/<job>/steps.log so a run that worked can become a script later.
//
//   node tools/browser.mjs start [--headed]        launch Chrome (idempotent)
//   node tools/browser.mjs stop
//   node tools/browser.mjs job <id>                 file screenshots and steps under work/browser/<id>/
//   node tools/browser.mjs goto <url>               allowlisted hosts only; waits for load
//   node tools/browser.mjs url | text | links       where we are; visible text; visible links
//   node tools/browser.mjs forms                    every field: label, selector, type, value, options
//   node tools/browser.mjs type <sel> "<value>"     set a field (input, textarea, select by option text, checkbox true/false)
//   node tools/browser.mjs click <sel>              click anything that is NOT a submit-style button
//   node tools/browser.mjs submit <sel>             click a submit-style button (on the ask list: Tariq taps Approve)
//   node tools/browser.mjs upload <sel> <file>      put a file into a file input (ask list)
//   node tools/browser.mjs shot [name]              screenshot to work/browser/<job>/NN-name.png, prints the path
//   node tools/browser.mjs js "<expression>"        evaluate in the page (awaits promises)
// <sel> is a CSS selector, or text=<button or link text>, or label=<field label>.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CFG = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/browser.json'), 'utf8'));
const PORT = CFG.port || 9223;
const WORK = path.join(ROOT, 'work/browser');
const CURRENT = path.join(WORK, 'current-job');
const PIDFILE = path.join(WORK, 'chrome.pid');
const [, , cmd, ...args] = process.argv;

const jobDir = () => { let j = 'adhoc'; try { j = fs.readFileSync(CURRENT, 'utf8').trim() || 'adhoc'; } catch (_) {} const d = path.join(WORK, j); fs.mkdirSync(d, { recursive: true }); return d; };
const log = (line) => { try { fs.appendFileSync(path.join(jobDir(), 'steps.log'), `${new Date().toISOString()} ${line}\n`); } catch (_) {} };
const allowed = (u) => { let h; try { h = new URL(u).hostname.toLowerCase(); } catch (_) { return false; } if (!/^https?:$/.test(new URL(u).protocol)) return false; return (CFG.allowedHosts || []).some((a) => h === a || h.endsWith(`.${a}`)); };

async function targets() { const r = await fetch(`http://127.0.0.1:${PORT}/json/list`); return r.json(); }
async function alive() { try { await targets(); return true; } catch (_) { return false; } }

async function start(headed) {
  if (await alive()) { console.log(`Chrome already up on port ${PORT}`); return; }
  fs.mkdirSync(WORK, { recursive: true });
  const profile = path.resolve(ROOT, CFG.profileDir || 'work/browser/profile');
  const flags = [`--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--window-size=1280,1600', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', 'about:blank'];
  if (!headed && CFG.headless !== false) flags.unshift('--headless=new');
  const child = spawn(CFG.chrome, flags, { detached: true, stdio: 'ignore' });
  child.unref();
  fs.writeFileSync(PIDFILE, String(child.pid));
  for (let i = 0; i < 40; i++) { if (await alive()) { console.log(`Chrome up on port ${PORT} (pid ${child.pid}, ${headed ? 'headed' : 'headless'})`); return; } await new Promise((r) => setTimeout(r, 250)); }
  throw new Error('Chrome did not come up in 10 s');
}
function stop() {
  try { process.kill(Number(fs.readFileSync(PIDFILE, 'utf8')), 'SIGTERM'); console.log('Chrome stopped'); } catch (_) { console.log('Chrome was not running'); }
  try { fs.unlinkSync(PIDFILE); } catch (_) {}
}

// One CDP session on the first page target.
async function session() {
  const list = await targets().catch(() => { throw new Error('Chrome is not running: node tools/browser.mjs start'); });
  const page = list.find((t) => t.type === 'page');
  if (!page) throw new Error('no page target');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('ws failed')); });
  let id = 0; const pending = new Map(); const events = [];
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } else if (d.method) events.push(d); };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, (d) => d.error ? rej(new Error(d.error.message)) : res(d.result)); ws.send(JSON.stringify({ id: i, method, params })); });
  const evaluate = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'page error'); return r.result.value; };
  const waitLoad = async (ms = 20000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (events.some((e) => e.method === 'Page.loadEventFired')) break; await new Promise((r) => setTimeout(r, 100)); } await new Promise((r) => setTimeout(r, 600)); events.length = 0; };
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 1600, deviceScaleFactor: 1, mobile: false });
  return { send, evaluate, waitLoad, close: () => ws.close() };
}

// Helpers injected into the page. text= and label= are how the model names things.
const HELPERS = `
window.__find = (sel) => {
  const norm = (s) => (s || '').replace(/\\s+/g, ' ').trim().toLowerCase();
  if (sel.startsWith('text=')) { const t = norm(sel.slice(5)); const els = [...document.querySelectorAll('button,a,input[type=submit],input[type=button],[role=button],label,summary,li,span,div')].filter(e => e.offsetParent !== null || e.tagName === 'A'); return els.find(e => norm(e.innerText || e.value) === t) || els.find(e => norm(e.innerText || e.value).includes(t)) || null; }
  if (sel.startsWith('label=')) { const t = norm(sel.slice(6)); const labs = [...document.querySelectorAll('label')]; const l = labs.find(x => norm(x.innerText) === t) || labs.find(x => norm(x.innerText).includes(t)); if (l) { if (l.control) return l.control; const f = l.getAttribute('for'); if (f && document.getElementById(f)) return document.getElementById(f); const c = l.querySelector('input,select,textarea'); if (c) return c; } const byAria = [...document.querySelectorAll('input,select,textarea')].find(e => norm(e.getAttribute('aria-label') || e.placeholder) === t || norm(e.getAttribute('aria-label') || e.placeholder).includes(t)); return byAria || null; }
  return document.querySelector(sel);
};
window.__isSubmit = (el) => { const t = ((el.innerText || el.value || '') + '').trim().toLowerCase(); const ty = (el.getAttribute('type') || '').toLowerCase(); if (ty === 'submit') return true; if (el.tagName === 'BUTTON' && !ty && el.form) return true; return /\\b(submit|pay|pay now|confirm|send|place order|lodge|apply|purchase|buy|checkout|sign|agree|accept|complete|finish)\\b/.test(t); };
window.__set = (el, v) => { el.scrollIntoView({ block: 'center' }); el.focus();
  if (el.tagName === 'SELECT') { const o = [...el.options].find(x => x.text.trim().toLowerCase() === String(v).trim().toLowerCase()) || [...el.options].find(x => x.value === v) || [...el.options].find(x => x.text.trim().toLowerCase().includes(String(v).trim().toLowerCase())); if (!o) throw new Error('no option ' + v + '; options: ' + [...el.options].map(x => x.text.trim()).join(' | ')); el.value = o.value; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return o.text.trim(); }
  if (el.type === 'checkbox' || el.type === 'radio') { const on = (v === true || /^(true|yes|on|1)$/i.test(String(v))); if (el.type === 'radio') el.click(); else if (el.checked !== on) el.click(); return el.checked; }
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; const d = Object.getOwnPropertyDescriptor(proto, 'value'); d.set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return el.value; };
window.__label = (el) => { const norm = (s) => (s || '').replace(/\\s+/g, ' ').trim(); if (el.id) { const l = document.querySelector('label[for="' + CSS.escape(el.id) + '"]'); if (l) return norm(l.innerText); } const p = el.closest('label'); if (p) return norm(p.innerText); return norm(el.getAttribute('aria-label') || el.placeholder || el.name || ''); };
window.__selector = (el) => { if (el.id) return '#' + CSS.escape(el.id); if (el.name) { const same = document.querySelectorAll('[name="' + CSS.escape(el.name) + '"]'); if (same.length === 1) return '[name="' + el.name + '"]'; if (el.value && el.type === 'radio') return '[name="' + el.name + '"][value="' + el.value + '"]'; } const all = [...document.querySelectorAll(el.tagName.toLowerCase())]; return el.tagName.toLowerCase() + ':nth-of-type(' + (all.indexOf(el) + 1) + ')'; };
true;`;

async function withPage(fn) { const s = await session(); try { await s.evaluate(HELPERS); return await fn(s); } finally { s.close(); } }
const q = (s) => JSON.stringify(String(s));

try {
  log(`${cmd} ${args.map((a) => JSON.stringify(a)).join(' ')}`);
  if (cmd === 'start') await start(args.includes('--headed'));
  else if (cmd === 'stop') stop();
  else if (cmd === 'job') { if (!args[0]) throw new Error('usage: job <id>'); fs.mkdirSync(WORK, { recursive: true }); fs.writeFileSync(CURRENT, args[0]); console.log(`browser work for ${args[0]} goes to work/browser/${args[0]}/`); }
  else if (cmd === 'goto') {
    const u = args[0]; if (!u) throw new Error('usage: goto <url>');
    if (!allowed(u)) throw new Error(`${u} is not on the allowed list (config/browser.json). Ask Jaiah to add the site.`);
    await withPage(async (s) => { await s.send('Page.navigate', { url: u }); await s.waitLoad(); const t = await s.evaluate('document.title + " | " + location.href'); console.log(t); });
  }
  else if (cmd === 'url') await withPage(async (s) => console.log(await s.evaluate('location.href')));
  else if (cmd === 'text') await withPage(async (s) => console.log((await s.evaluate('document.body.innerText')).replace(/\n{3,}/g, '\n\n').slice(0, 6000)));
  else if (cmd === 'links') await withPage(async (s) => { const rows = await s.evaluate(`[...document.querySelectorAll('a[href]')].filter(a => a.offsetParent !== null).slice(0, 80).map(a => (a.innerText || '').replace(/\\s+/g,' ').trim().slice(0, 60) + '  ->  ' + a.href)`); console.log(rows.join('\n') || 'no visible links'); });
  else if (cmd === 'forms') await withPage(async (s) => {
    const rows = await s.evaluate(`[...document.querySelectorAll('input,select,textarea')].filter(e => e.type !== 'hidden' && e.offsetParent !== null).map(e => ({ label: __label(e), selector: __selector(e), type: e.tagName === 'SELECT' ? 'select' : e.tagName === 'TEXTAREA' ? 'textarea' : (e.type || 'text'), value: e.type === 'checkbox' || e.type === 'radio' ? (e.checked ? 'checked' : '') : (e.value || ''), required: !!e.required, options: e.tagName === 'SELECT' ? [...e.options].map(o => o.text.trim()).slice(0, 30) : undefined }))`);
    const btns = await s.evaluate(`[...document.querySelectorAll('button,input[type=submit],input[type=button],[role=button]')].filter(e => e.offsetParent !== null).map(e => ({ text: (e.innerText || e.value || '').replace(/\\s+/g,' ').trim().slice(0, 40), selector: __selector(e), submit: __isSubmit(e) }))`);
    if (!rows.length) console.log('No visible fields.');
    rows.forEach((r) => console.log(`${r.label || '(no label)'}  [${r.type}${r.required ? ', required' : ''}]  ${r.selector}${r.value ? `  = ${JSON.stringify(r.value).slice(0, 60)}` : ''}${r.options ? `  options: ${r.options.join(' | ')}` : ''}`));
    if (btns.length) { console.log('\nButtons:'); btns.forEach((b) => console.log(`  ${b.text || '(no text)'}  ${b.selector}${b.submit ? '  (submit: needs Approve, use "submit")' : ''}`)); }
  });
  else if (cmd === 'type') {
    const [sel, value] = args; if (!sel || value === undefined) throw new Error('usage: type <sel> "<value>"');
    await withPage(async (s) => { const r = await s.evaluate(`(() => { const el = __find(${q(sel)}); if (!el) throw new Error('no field ' + ${q(sel)}); return { set: __set(el, ${q(value)}), label: __label(el) }; })()`); console.log(`${r.label || sel} = ${JSON.stringify(r.set)}`); });
  }
  else if (cmd === 'click' || cmd === 'submit') {
    const sel = args[0]; if (!sel) throw new Error(`usage: ${cmd} <sel>`);
    await withPage(async (s) => {
      const info = await s.evaluate(`(() => { const el = __find(${q(sel)}); if (!el) throw new Error('nothing matches ' + ${q(sel)}); return { submit: __isSubmit(el), text: ((el.innerText || el.value || '') + '').trim().slice(0, 60) }; })()`);
      if (cmd === 'click' && info.submit) throw new Error(`"${info.text || sel}" looks like a submit button. That step needs Tariq's Approve: node tools/browser.mjs submit ${JSON.stringify(sel)}`);
      if (cmd === 'submit') { const u = await s.evaluate('location.href'); if (!allowed(u)) throw new Error('current page is not on the allowed list'); }
      await s.evaluate(`(() => { const el = __find(${q(sel)}); el.scrollIntoView({ block: 'center' }); el.click(); return true; })()`);
      await s.waitLoad(cmd === 'submit' ? 20000 : 3000);
      console.log(`${cmd === 'submit' ? 'Submitted' : 'Clicked'} "${info.text || sel}". Now at: ${await s.evaluate('document.title + " | " + location.href')}`);
    });
  }
  else if (cmd === 'upload') {
    const [sel, file] = args; if (!sel || !file) throw new Error('usage: upload <sel> <file>');
    const abs = path.resolve(ROOT, file); if (!fs.existsSync(abs)) throw new Error(`no file ${abs}`);
    await withPage(async (s) => {
      const doc = await s.send('DOM.getDocument', { depth: 0 });
      const objId = (await s.send('Runtime.evaluate', { expression: `__find(${q(sel)})` })).result.objectId; if (!objId) throw new Error(`no file input ${sel}`);
      const node = await s.send('DOM.requestNode', { objectId: objId });
      await s.send('DOM.setFileInputFiles', { files: [abs], nodeId: node.nodeId });
      console.log(`Attached ${path.basename(abs)} to ${sel}`); void doc;
    });
  }
  else if (cmd === 'shot') {
    await withPage(async (s) => {
      const r = await s.send('Page.captureScreenshot', { format: 'png' });
      const dir = jobDir(); const n = fs.readdirSync(dir).filter((f) => f.endsWith('.png')).length + 1;
      const file = path.join(dir, `${String(n).padStart(2, '0')}-${(args[0] || 'page').replace(/[^a-z0-9-]+/gi, '-').toLowerCase()}.png`);
      fs.writeFileSync(file, Buffer.from(r.data, 'base64')); console.log(file);
    });
  }
  else if (cmd === 'js') { if (!args[0]) throw new Error('usage: js "<expression>"'); await withPage(async (s) => { const v = await s.evaluate(args[0]); console.log(typeof v === 'string' ? v : JSON.stringify(v, null, 1)); }); }
  else { console.log('usage: start [--headed] | stop | job <id> | goto <url> | url | text | links | forms | type <sel> "<value>" | click <sel> | submit <sel> | upload <sel> <file> | shot [name] | js "<expr>"'); process.exit(1); }
} catch (e) { console.error(String(e.message || e)); process.exit(1); }
