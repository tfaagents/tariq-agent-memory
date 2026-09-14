#!/usr/bin/env node
// The TFA Agents dashboard, pressed as Tariq. Same buttons he has in the browser, same
// audit line ("by tariq@..."). Talks ONLY to the dashboard over HTTP on 127.0.0.1: this
// agent runs as its own macOS user and cannot read the workflow lane's files, by design.
//
//   node tools/tfa.mjs status          every agent, last run, what is waiting, connections
//   node tools/tfa.mjs waiting         the rows waiting for a person (receipts, invoices)
//   node tools/tfa.mjs runs [n]        the last n run-log lines (default 15)
//   node tools/tfa.mjs promises        what he said he would do, from the promise tracker
//   node tools/tfa.mjs brief           the digest and brief the agents built
//   node tools/tfa.mjs run <agent>     Run now
//   node tools/tfa.mjs approve <id> [note]
//   node tools/tfa.mjs send-back <id> <reason>
//   node tools/tfa.mjs request '<json>'      tell Jaiah the agent hit a wall (used by tools/requests.mjs)
//   node tools/tfa.mjs request-done <id>
//   node tools/tfa.mjs browser-login          put Tariq's dashboard session into the browser lane (dashboard screenshots)
//
// The passcode is read by THIS PROCESS from config/connections.json dashboard.passcodePath
// (a chmod 600 file in this user's home) and never printed.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DASH = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/connections.json'), 'utf8')).dashboard;
const BASE = process.env.TFA_DASHBOARD || DASH.baseUrl || 'http://127.0.0.1:4680';
const EMAIL = process.env.TARIQ_EMAIL || DASH.email;
const PASS_PATH = (DASH.passcodePath || '~/.tariq-dashboard/passcode').replace(/^~/, os.homedir());
const QUEUES = ['receipts-intake', 'invoice-split'];

const [, , cmd, ...args] = process.argv;
const one = (s, n = 120) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const ago = (iso) => { if (!iso) return 'never'; const m = Math.round((Date.now() - Date.parse(iso)) / 60000); return m < 2 ? 'just now' : m < 60 ? `${m} min ago` : m < 2160 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };

let cookie = null;
async function login() {
  if (cookie) return cookie;
  let pass;
  try { pass = fs.readFileSync(PASS_PATH, 'utf8').trim(); } catch (_) { throw new Error(`no dashboard passcode at ${PASS_PATH}; Jaiah puts Tariq's passcode there (chmod 600)`); }
  const r = await fetch(`${BASE}/api/login`, {
    method: 'POST', redirect: 'manual',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ email: EMAIL, passcode: pass }).toString(),
  });
  const m = /tfa_sess=([^;]+)/.exec(r.headers.get('set-cookie') || '');
  if (!m) throw new Error('dashboard login failed (is the dashboard running, is the passcode current?)');
  cookie = `tfa_sess=${m[1]}`;
  return cookie;
}
async function api(p, opts = {}) {
  const c = await login();
  const r = await fetch(`${BASE}${p}`, { ...opts, headers: { ...(opts.headers || {}), cookie: c, ...(opts.body ? { 'content-type': 'application/json' } : {}) } });
  const text = await r.text();
  let j; try { j = JSON.parse(text); } catch (_) { j = { raw: text }; }
  if (!r.ok && r.status !== 202) throw new Error(j.error || j.reason || `${r.status} from ${p}`);
  return j;
}
async function agentReport(name) {
  const a = await api(`/api/agent?name=${encodeURIComponent(name)}`);
  const last = (a.runs || [])[0] || null;
  return { report: a.report, at: last?.ts || null, agent: a.agent };
}
function itemLine(it) {
  const d = it.data || it.fields || {};
  return [it.id, it.status, it.kind || it.handler, it.person?.name || it.person?.email || '']
    .concat(['supplier', 'total', 'amount', 'date', 'job', 'paid', 'card', 'destination', 'reason'].filter((k) => d[k] != null).map((k) => `${k}=${one(d[k], 40)}`))
    .filter(Boolean).join(' | ');
}

try {
  if (cmd === 'status') {
    const o = await api('/api/overview');
    console.log(`TFA Agents at ${ago(o.at)}. Waiting for a person: ${o.needsYou}. Alerts last 24h: ${o.alerts24h}.`);
    if (o.connections) console.log(`Connections: ${one(JSON.stringify(o.connections), 300)}`);
    if (o.line) console.log(`WhatsApp line: ${one(JSON.stringify(o.line), 200)}`);
    for (const s of o.sectors || []) {
      console.log(`\n${s.label}`);
      for (const a of s.agents) {
        const last = a.last || a.lastRun || {};
        console.log(`- ${a.title || a.name} (${a.name})${a.enabled === false ? ' OFF' : ''}: ${last.result || last.status || 'no run yet'} ${last.ts || last.at ? ago(last.ts || last.at) : ''}${last.summary ? `, ${one(last.summary, 90)}` : ''}`);
      }
    }
  } else if (cmd === 'waiting') {
    let any = false;
    for (const agent of QUEUES) {
      let r; try { r = await api(`/api/items?agent=${agent}`); } catch (e) { console.log(`${agent}: ${e.message}`); continue; }
      const open = (r.items || []).filter((it) => ['ready', 'awaiting-details', 'received'].includes(it.status));
      if (!open.length) continue;
      any = true;
      console.log(`${agent}: ${open.length} waiting`);
      for (const it of open) console.log(`- ${itemLine(it)}`);
    }
    if (!any) console.log('Nothing is waiting for a person.');
  } else if (cmd === 'runs') {
    const n = Number(args[0] || 15);
    const r = await api(`/api/runs?limit=${n}`);
    for (const x of (r.runs || []).reverse()) console.log(`${ago(x.ts)}  ${x.agent}  ${x.result}${x.cost_usd ? `  $${x.cost_usd}` : ''}  ${one(x.summary, 110)}`);
  } else if (cmd === 'promises') {
    const { report, at } = await agentReport('promise-tracker');
    const open = (report?.open || []).filter((x) => x.status === 'open');
    console.log(`Promises Tariq made, still open (tracker ran ${ago(at)}):`);
    if (!open.length) console.log(report ? 'Nothing outstanding.' : 'The tracker has no report yet. Ask for it to be run from the dashboard.');
    open.forEach((x, i) => {
      const late = x.due && Date.parse(x.due) < Date.now();
      console.log(`${i + 1}. ${late ? 'LATE ' : ''}${one(x.promise, 120)}`);
      console.log(`   to ${x.to}${x.due ? `, due ${x.due}` : ', no date'}; from "${one(x.subject, 60)}"${x.link ? `\n   ${x.link}` : ''}`);
    });
    if (open.length) console.log('\nClosing one ("done") is done on the dashboard for now; say which and he can tick it there.');
  } else if (cmd === 'brief') {
    const b = await agentReport('morning-brief');
    const d = await agentReport('daily-inbox-digest');
    if (b.report) console.log(`Brief (${ago(b.at)}):\n${typeof b.report === 'string' ? b.report : (b.report.text || (b.report.lines || []).join('\n') || JSON.stringify(b.report, null, 1))}\n`);
    if (d.report) {
      console.log(`Inbox digest (${ago(d.at)}): ${d.report.headline || ''}`);
      (d.report.needsReply || []).forEach((it, i) => console.log(`  ${i + 1}. ${it.who || it.from}: ${one(it.what || it.subject, 110)}`));
      (d.report.timeSensitive || []).forEach((it) => console.log(`  dated: ${one(it.note || it.subject, 110)}`));
    }
    if (!b.report && !d.report) console.log('No brief or digest report yet.');
  } else if (cmd === 'run') {
    if (!args[0]) throw new Error('usage: run <agent-name>');
    const r = await api('/api/run', { method: 'POST', body: JSON.stringify({ agent: args[0] }) });
    console.log(r.ok ? `Started ${args[0]}. Check "runs" in a minute.` : `Not started: ${r.reason || r.error}`);
  } else if (cmd === 'approve' || cmd === 'send-back') {
    const id = args[0]; if (!id) throw new Error(`usage: ${cmd} <id> [reason]`);
    const reason = args.slice(1).join(' ');
    if (cmd === 'send-back' && !reason) throw new Error('send-back needs a reason the sender will read');
    let agent = null;
    for (const a of QUEUES) { try { const r = await api(`/api/items?agent=${a}`); if ((r.items || []).some((it) => it.id === id)) { agent = a; break; } } catch (_) {} }
    if (!agent) throw new Error(`no waiting item ${id}; run waiting first`);
    const r = await api('/api/items/decision', { method: 'POST', body: JSON.stringify({ agent, id, decision: cmd, reason }) });
    console.log(`${cmd === 'approve' ? 'Approved' : 'Sent back'}: ${itemLine(r.item || { id })}`);
  } else if (cmd === 'request') {
    let r; try { r = JSON.parse(args[0] || ''); } catch (_) { throw new Error('usage: request <json with id, kind, ask, missing>'); }
    const out = await api('/api/requests', { method: 'POST', body: JSON.stringify({ ...r, by: 'tariq-agent' }) });
    console.log(out.pinged ? `Jaiah pinged (${out.id})` : `logged on the dashboard (${out.id}), ping ${out.duplicate ? 'already sent for this id' : 'held (cooldown or no number)'}`);
  } else if (cmd === 'request-done') {
    if (!args[0]) throw new Error('usage: request-done <id>');
    await api('/api/requests/done', { method: 'POST', body: JSON.stringify({ id: args[0] }) });
    console.log(`${args[0]} closed on the dashboard`);
  } else if (cmd === 'browser-login') {
    // The browser lane's Chrome profile has nothing logged in. This logs in as Tariq here
    // (passcode never printed) and hands the session cookie to that Chrome over DevTools,
    // so the browser worker can open the dashboard and screenshot it for him.
    const c = await login();
    const value = c.split('=')[1];
    const bcfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/browser.json'), 'utf8'));
    const dash = (bcfg.dashboardUrl || BASE).replace(/\/+$/, '');
    let list; try { list = await (await fetch(`http://127.0.0.1:${bcfg.port || 9223}/json/list`)).json(); } catch (_) { throw new Error('the browser is not running: node tools/browser.mjs start'); }
    const page = list.find((t) => t.type === 'page'); if (!page) throw new Error('no page in the browser');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('could not reach the browser')); });
    const reply = await new Promise((res) => { ws.onmessage = (m) => res(JSON.parse(m.data)); ws.send(JSON.stringify({ id: 1, method: 'Network.setCookie', params: { name: 'tfa_sess', value, url: `${dash}/`, path: '/', httpOnly: true } })); });
    ws.close();
    if (!reply.result?.success) throw new Error('the browser refused the cookie');
    console.log(`Logged in as ${EMAIL} in the browser lane. Open ${dash}/ there.`);
  } else {
    console.log('usage: status | waiting | runs [n] | promises | brief | run <agent> | approve <id> [note] | send-back <id> <reason> | request <json> | request-done <id> | browser-login');
    process.exit(1);
  }
} catch (e) {
  console.error(String(e.message || e));
  process.exit(1);
}
