#!/usr/bin/env node
// The TFA Agents dashboard, pressed as Tariq. Same buttons he has in the browser,
// same audit line ("by tariq@..."). Talks to the dashboard on 127.0.0.1 only.
//
//   node tools/tfa.mjs status          every agent, last run, what is waiting, connections
//   node tools/tfa.mjs waiting         the rows waiting for a person (receipts, invoices)
//   node tools/tfa.mjs runs [n]        the last n run-log lines (default 15)
//   node tools/tfa.mjs promises        what he said he would do, from the promise tracker
//   node tools/tfa.mjs done <n>        close promise n (it stays closed through rescans)
//   node tools/tfa.mjs brief           the morning brief the agents built
//   node tools/tfa.mjs run <agent>     Run now
//   node tools/tfa.mjs approve <id> [note]
//   node tools/tfa.mjs send-back <id> <reason>
//
// The passcode is read by THIS PROCESS from the dashboard's own config and never printed.
import fs from 'node:fs';
import path from 'node:path';

const TFA = process.env.TFA_AGENTS || '/Users/tfaagents/tfa-agents';
const EMAIL = process.env.TARIQ_EMAIL || 'tariq@tfaconstructions.com.au';
const BASE = process.env.TFA_DASHBOARD || 'http://127.0.0.1:4680';
const QUEUES = { receipts: 'receipts-intake', 'invoice-split': 'invoice-split' };

const [, , cmd, ...args] = process.argv;
const one = (s, n = 120) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const ago = (iso) => { if (!iso) return 'never'; const m = Math.round((Date.now() - Date.parse(iso)) / 60000); return m < 2 ? 'just now' : m < 60 ? `${m} min ago` : m < 2160 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };

let cookie = null;
async function login() {
  if (cookie) return cookie;
  const codes = JSON.parse(fs.readFileSync(path.join(TFA, 'config/passcodes.json'), 'utf8'));
  const pass = codes[EMAIL];
  if (!pass) throw new Error(`no dashboard passcode for ${EMAIL}; Jaiah adds one on the mini`);
  const r = await fetch(`${BASE}/api/login`, {
    method: 'POST', redirect: 'manual',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ email: EMAIL, passcode: pass }).toString(),
  });
  const set = r.headers.get('set-cookie') || '';
  const m = /tfa_sess=([^;]+)/.exec(set);
  if (!m) throw new Error('dashboard login failed (is the dashboard running on the mini?)');
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
function readStore(section) {
  try { const all = JSON.parse(fs.readFileSync(path.join(TFA, 'dashboard/data/state.json'), 'utf8')); return { data: all[section]?.data ?? null, at: all[section]?.updatedAt || null }; }
  catch (_) { return { data: null, at: null }; }
}
function itemLine(it) {
  const d = it.data || it.fields || {};
  const bits = [it.id, it.status, it.kind || it.handler, it.person?.name || it.person?.email || '']
    .concat(['supplier', 'total', 'amount', 'date', 'job', 'paid', 'card', 'destination', 'reason'].filter((k) => d[k] != null).map((k) => `${k}=${one(d[k], 40)}`));
  return bits.filter(Boolean).join(' | ');
}

try {
  if (cmd === 'status') {
    const o = await api('/api/overview');
    console.log(`TFA Agents at ${ago(o.at)}. Waiting for a person: ${o.needsYou}. Alerts last 24h: ${o.alerts24h}.`);
    if (o.connections) console.log(`Connections: ${typeof o.connections === 'object' ? one(JSON.stringify(o.connections), 300) : o.connections}`);
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
    for (const agent of Object.values(QUEUES)) {
      let r; try { r = await api(`/api/items?agent=${agent}`); } catch (e) { console.log(`${agent}: ${e.message}`); continue; }
      const open = (r.items || []).filter((it) => it.status === 'ready' || it.status === 'awaiting-details' || it.status === 'received');
      if (!open.length) continue;
      any = true;
      console.log(`${agent}: ${open.length} waiting`);
      for (const it of open) console.log(`- ${itemLine(it)}`);
    }
    if (!any) console.log('Nothing is waiting for a person.');
  } else if (cmd === 'runs') {
    const n = Number(args[0] || 15);
    const lines = fs.readFileSync(path.join(TFA, 'logs/runs.jsonl'), 'utf8').trim().split('\n').slice(-n);
    for (const l of lines) { try { const r = JSON.parse(l); console.log(`${ago(r.ts)}  ${r.agent}  ${r.result}${r.cost_usd ? `  $${r.cost_usd}` : ''}  ${one(r.summary, 110)}`); } catch (_) {} }
  } else if (cmd === 'promises') {
    const { data, at } = readStore('promises');
    const open = (data?.open || []).filter((x) => x.status === 'open');
    console.log(`Promises Tariq made, still open (tracker ran ${ago(at)}):`);
    if (!open.length) console.log('Nothing outstanding.');
    open.forEach((x, i) => {
      const late = x.due && Date.parse(x.due) < Date.now();
      console.log(`${i + 1}. ${late ? 'LATE ' : ''}${one(x.promise, 120)}`);
      console.log(`   to ${x.to}${x.due ? `, due ${x.due}` : ', no date'}; from "${one(x.subject, 60)}"${x.link ? `\n   ${x.link}` : ''}`);
    });
  } else if (cmd === 'done') {
    const n = Number(args[0]);
    const store = await import(path.join(TFA, 'runner/lib/store.mjs'));
    const closures = await import(path.join(TFA, 'runner/lib/closures.mjs'));
    const p = store.read('promises');
    const open = (p?.open || []).filter((x) => x.status === 'open');
    const target = open[n - 1];
    if (!target) throw new Error(`there is no promise ${n}; run promises first`);
    closures.close(target, { by: 'tariq-agent' });
    const all = (p.open || []).map((x) => (x.id === target.id && x.promise === target.promise ? { ...x, status: 'done' } : x));
    store.write('promises', { ...p, open: all }, { agent: 'tariq-agent' });
    console.log(`Closed: ${target.promise}. It stays closed through the next scan.`);
  } else if (cmd === 'brief') {
    const b = readStore('brief'), d = readStore('digest'), c = readStore('calendar');
    if (b.data) console.log(`Brief (${ago(b.at)}):\n${typeof b.data === 'string' ? b.data : (b.data.text || b.data.lines?.join('\n') || JSON.stringify(b.data, null, 1))}\n`);
    if (d.data) { console.log(`Inbox digest (${ago(d.at)}): ${d.data.headline}`); (d.data.needsReply || []).forEach((it, i) => console.log(`  ${i + 1}. ${it.who || it.from}: ${one(it.what || it.subject, 110)}`)); (d.data.timeSensitive || []).forEach((it) => console.log(`  dated: ${one(it.note || it.subject, 110)}`)); }
    if (c.data?.today?.length) console.log(`Diary today (${ago(c.at)}): ${c.data.today.map((e) => `${e.time} ${one(e.subject, 50)}`).join('; ')}`);
  } else if (cmd === 'run') {
    if (!args[0]) throw new Error('usage: run <agent-name>');
    const r = await api('/api/run', { method: 'POST', body: JSON.stringify({ agent: args[0] }) });
    console.log(r.ok ? `Started ${args[0]}. Check "runs" in a minute.` : `Not started: ${r.reason || r.error}`);
  } else if (cmd === 'approve' || cmd === 'send-back') {
    const id = args[0]; if (!id) throw new Error(`usage: ${cmd} <id> [reason]`);
    const reason = args.slice(1).join(' ');
    if (cmd === 'send-back' && !reason) throw new Error('send-back needs a reason the sender will read');
    let agent = null;
    for (const a of Object.values(QUEUES)) { try { const r = await api(`/api/items?agent=${a}`); if ((r.items || []).some((it) => it.id === id)) { agent = a; break; } } catch (_) {} }
    if (!agent) throw new Error(`no waiting item ${id}; run waiting first`);
    const r = await api('/api/items/decision', { method: 'POST', body: JSON.stringify({ agent, id, decision: cmd, reason }) });
    console.log(`${cmd === 'approve' ? 'Approved' : 'Sent back'}: ${itemLine(r.item || { id })}`);
  } else {
    console.log('usage: status | waiting | runs [n] | promises | done <n> | brief | run <agent> | approve <id> [note] | send-back <id> <reason>');
    process.exit(1);
  }
} catch (e) {
  console.error(String(e.message || e));
  process.exit(1);
}
