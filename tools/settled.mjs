#!/usr/bin/env node
// Has it already been settled? Checks a claim against the record BEFORE it is said out loud.
//
//   node tools/settled.mjs --promises                       every open promise from the tracker
//   node tools/settled.mjs --who <address> --since <date> [--about "<words>"]
//   node tools/settled.mjs --promises --json
//
// Why this exists. On 15 Sep 2026 the morning brief told Tariq he was LATE on two sets of
// documents for the third morning running. He had resent both on 11 Sep at 11:28am, six
// minutes after promising them, and one recipient had already replied "Got it, thanks!".
// The promise tracker has no fulfilment check: it dates a commitment and nothing ever
// closes it. So LATE from the tracker is a CLAIM, and this tool is how the claim is tested.
//
// The matching rule, which is the whole trick: a thing counts as sent if it went TO that
// address AFTER the promise, whatever its subject line. Requiring the subject to match
// would have missed the case above, because the resend went out as a OneDrive folder-share
// notification ("Tariq shared the folder ..."), not as a reply on the thread. --about is
// evidence, never a filter.
//
// Verdicts:
//   DONE           you did it on this thread and they answered. Do not mention it at all.
//   YOU DID IT     you did it on this thread, no answer yet. Chase THEM. Never call this late.
//   THEY REPLIED   they wrote on this thread and you have not. The ball is yours.
//   STILL OPEN     no sign of it on this thread. Only this one may be printed LATE.
//   NOT DUE        the date has not arrived.
//
// Two signals, and it needs BOTH. **When** is `sentAt` on the promise, the moment he made it,
// which is the only boundary that works for the promises the tracker gives no due date.
// **Whether it is the same conversation** is the subject, normalised (RE:/FW: stripped) and
// matched whole, by containment, or on two significant words. The second test exists because
// he mails accounts@ and heather@ all day: without it, "sent to them since" is true of almost
// every internal promise and the tool would clear things he has not done. A send to the right
// person on the wrong thread is never treated as fulfilment; it is reported as a note so the
// reader looks, and the promise stays open.
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OWNER = process.env.TARIQ_MAILBOX || 'tariq@tfaconstructions.com.au';
const graph = await import(path.join(ROOT, 'runner/lib/graph.mjs'));

const argv = process.argv.slice(2);
const flag = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
const has = (n) => argv.includes(n);
const TZ = 'Australia/Brisbane';
const when = (iso) => iso ? new Date(iso).toLocaleString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: TZ }) : '';
const DAY = 864e5;

if (has('--help') || !argv.length) {
  console.log('node tools/settled.mjs --promises [--json]');
  console.log('node tools/settled.mjs --who <address> --since <YYYY-MM-DD> [--about "<words>"]');
  process.exit(0);
}

// One fetch of his sent mail covers every promise, so the window is the oldest one needed.
async function sentSince(oldestISO) {
  const days = Math.min(90, Math.max(1, Math.ceil((Date.now() - Date.parse(oldestISO)) / DAY) + 1));
  return graph.sentMail(OWNER, { days, top: 250 });
}

const norm = (t) => String(t || '').replace(/^((re|fw|fwd|aw)\s*:\s*)+/i, '').toLowerCase()
  .replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const bigWords = (t) => new Set(norm(t).split(' ').filter((w) => w.length > 3));
// Same conversation? Whole match, containment, or two significant words in common. Deliberately
// generous: a thread drifts and gets renamed, and the cost of a miss is calling him late for
// something he did.
function sameThread(a, b) {
  const na = norm(a), nb = norm(b);
  if (!na || !nb) return false;
  if (na === nb || na.includes(nb) || nb.includes(na)) return true;
  const wa = bigWords(a), wb = bigWords(b);
  let shared = 0;
  for (const w of wa) if (wb.has(w)) shared++;
  return shared >= 2;
}

// Ids come back base64 from Graph and base64url from the tracker, so compare on the
// alphanumerics alone.
const sameId = (a, b) => !!a && !!b && String(a).replace(/[^A-Za-z0-9]/g, '') === String(b).replace(/[^A-Za-z0-9]/g, '');

async function verdictFor({ to, sinceISO, subject, sent, promiseId, convId, dueISO }) {
  const addr = String(to || '').toLowerCase().trim();
  if (!addr) return { verdict: 'NO ADDRESS', sends: [], replies: [], offThread: [] };
  if (dueISO && Date.parse(dueISO) > Date.now()) return { verdict: 'NOT DUE', sends: [], replies: [], offThread: [] };
  if (Date.parse(sinceISO) > Date.now()) return { verdict: 'NOT DUE', sends: [], replies: [], offThread: [] };
  // conversationId is exact. Subject overlap is a guess, and on 15 Sep 2026 it tied a
  // promise about Jordan Broadrick's pay audit to a mail about Nelson Frost's contract
  // because both said "apprenticeship". Use the thread id wherever Graph gives one.
  const onThread = (m) => (convId && m.conversationId) ? m.conversationId === convId : sameThread(m.subject, subject);

  // The email in which he MADE the promise must never count as him keeping it. It is sent
  // to the right person on the right thread at exactly the boundary, so without this every
  // promise reads as already done. Its id where the tracker gives one, and a one minute
  // grace at the boundary for the promises it does not.
  const boundary = Date.parse(sinceISO);
  const isThePromiseItself = (m) => sameId(m.id, promiseId) ||
    (Date.parse(m.sent) - boundary < 60_000 && onThread(m));
  const after = (d) => d && Date.parse(d) >= boundary;
  const toThem = sent
    .filter((m) => (m.to || []).some((a) => String(a).toLowerCase() === addr))
    .filter((m) => after(m.sent))
    .filter((m) => !isThePromiseItself(m))
    .sort((a, b) => Date.parse(b.sent) - Date.parse(a.sent));
  const sends = toThem.filter(onThread);
  const offThread = toThem.filter((m) => !onThread(m));

  let fromThem = [];
  try {
    fromThem = (await graph.searchFrom(addr, OWNER)).filter((m) => after(m.received))
      .sort((a, b) => Date.parse(b.received) - Date.parse(a.received));
  } catch (e) { fromThem = []; }
  const replies = fromThem.filter(onThread);

  const lastSend = sends[0] ? Date.parse(sends[0].sent) : 0;
  const lastReply = replies[0] ? Date.parse(replies[0].received) : 0;
  let verdict;
  if (lastSend && lastReply && lastReply >= lastSend) verdict = 'DONE';
  else if (lastSend) verdict = 'YOU DID IT';
  else if (lastReply) verdict = 'THEY REPLIED';
  else verdict = 'STILL OPEN';
  return { verdict, sends: sends.slice(0, 3), replies: replies.slice(0, 2), offThread: offThread.slice(0, 2) };
}

const out = [];
let promiseSource = null;   // which list the promises came from, said in the output
if (has('--promises')) {
  // His own scan first (tools/promises.mjs, his app, since 15 Sep 2026). The team lane's
  // tracker through the dashboard is the fallback, and goes when that lane stops reading
  // his mailbox at all.
  let data;
  for (const [label, argv] of [['his own scan', ['tools/promises.mjs', 'list', '--json']], ['the workflow lane tracker', ['tools/tfa.mjs', 'promises', '--json']]]) {
    try {
      const raw = execFileSync('node', [path.join(ROOT, argv[0]), ...argv.slice(1)], { encoding: 'utf8' });
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.open)) { data = parsed; promiseSource = label; break; }
    } catch (_) { /* try the next one */ }
  }
  if (!data) {
    console.error('could not read a promise list: run /promises-scan, or `node tools/promises.mjs candidates` then save.');
    process.exit(1);
  }
  const open = data.open || [];
  if (!open.length) { console.log('No open promises to check.'); process.exit(0); }
  // sentAt is when he MADE the promise, which is the only boundary that works for the ones
  // the tracker gives no due date. Due date second, a three week lookback last.
  const sinceOf = (p) => p.sentAt ? new Date(p.sentAt).toISOString()
    : p.due ? new Date(`${p.due}T00:00:00+10:00`).toISOString()
    : new Date(Date.now() - 21 * DAY).toISOString();
  const oldest = open.map(sinceOf).filter((x) => Date.parse(x) <= Date.now()).sort()[0] || new Date(Date.now() - 21 * DAY).toISOString();
  const sent = await sentSince(oldest);
  for (const p of open) {
    let convId = null;
    try { convId = (await graph.getMessage(OWNER, p.id))?.conversationId || null; } catch (e) { convId = null; }
    const r = await verdictFor({
      to: p.to, sinceISO: sinceOf(p), subject: p.subject, sent, promiseId: p.id, convId,
      dueISO: p.due ? new Date(`${p.due}T23:59:59+10:00`).toISOString() : null,
    });
    const late = p.due && Date.parse(`${p.due}T23:59:59+10:00`) < Date.now();
    out.push({ ...r, promise: p.promise, to: p.to, due: p.due || null, subject: p.subject, madeAt: p.sentAt || null, trackerSaysLate: !!late });
  }
} else {
  const to = flag('--who');
  const since = flag('--since');
  if (!to || !since) { console.error('usage: --who <address> --since <YYYY-MM-DD>'); process.exit(1); }
  const sinceISO = /T/.test(since) ? new Date(since).toISOString() : new Date(`${since}T00:00:00+10:00`).toISOString();
  const sent = await sentSince(Date.parse(sinceISO) > Date.now() ? new Date(Date.now() - DAY).toISOString() : sinceISO);
  const r = await verdictFor({ to, sinceISO, subject: flag('--about') || '', sent, promiseId: null, convId: null, dueISO: null });
  out.push({ ...r, promise: flag('--about') || '(claim)', to, due: since, subject: flag('--about') || '', madeAt: sinceISO, trackerSaysLate: false });
}

if (has('--json')) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }

const SAY = {
  DONE: 'done and acknowledged, do not mention it',
  'YOU DID IT': 'you did it, chase THEM, never call this late',
  'THEY REPLIED': 'they answered, the ball is yours',
  'STILL OPEN': 'no sign of it on this thread, this one may be called late',
  'NOT DUE': 'not due yet',
  'NO ADDRESS': 'no address on the promise, check it by hand',
};
if (promiseSource) console.log(`Checked against his sent folder. Promise list from ${promiseSource}.`);
let callable = 0;
out.forEach((r, i) => {
  const late = r.verdict === 'STILL OPEN' && r.trackerSaysLate;
  console.log(`${i + 1}. ${r.verdict}${late ? ' + PAST DUE' : ''}  (${SAY[r.verdict] || ''})`);
  console.log(`   "${String(r.promise).slice(0, 100)}" to ${r.to}${r.due ? `, due ${r.due}` : ', no date'}`);
  if (r.madeAt) console.log(`   promised: ${when(r.madeAt)}  on "${String(r.subject).slice(0, 60)}"`);
  for (const s of r.sends) console.log(`   you sent: ${when(s.sent)}  ${String(s.subject).slice(0, 70)}`);
  for (const m of r.replies) console.log(`   they wrote: ${when(m.received)}  ${String(m.subject).slice(0, 70)}`);
  if (!r.sends.length && r.offThread.length) {
    console.log(`   note: you have written to them since, but not on this thread (${String(r.offThread[0].subject).slice(0, 50)}). Read before calling it late.`);
  }
  if (late) callable++;
});
console.log(`\n${out.length} checked. ${callable} of them may honestly be called LATE.`);
console.log('Anything marked DONE must not appear at all. YOU DID IT is a chase on them, never a late promise of his.');
