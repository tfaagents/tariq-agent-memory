#!/usr/bin/env node
// What Tariq said he would do, read from his own sent mail with his own app.
//
//   node tools/promises.mjs candidates [days]   the sent emails, as JSON, for /promises-scan
//   node tools/promises.mjs save <file.json>    the model's findings become work/promises.json
//   node tools/promises.mjs list [--json]       what is open now
//   node tools/promises.mjs done <n> [note]     close one; it never comes back on a rescan
//   node tools/promises.mjs reopen <n>          undo that
//
// WHY THIS IS HERE AND NOT IN THE WORKFLOW LANE. Until 15 Sep 2026 the promise list came
// from the team's agents through the dashboard: `tfa.mjs promises` asked the TFA Agents app
// to read Tariq's sent folder. That is his mail being read by the app the accounts flows
// use, and it is why the team's app needed his mailbox at all. The scan lives here now, on
// the Tariq Assistant app, so his lane needs nothing from the team's.
//
// WHY A SKILL DOES THE READING. The extraction is a judgement ("leave it with me" is a
// promise, "the slab was poured Tuesday" is not) and this agent is already a Claude session
// on a schedule. So `candidates` hands the emails over, the /promises-scan skill decides,
// and `save` puts the real subject, date and link back on each one. The model never writes
// a link or a date of its own: it returns an index, and an index that is not in the list it
// was given is dropped rather than rendered.
//
// SAVE MERGES, IT DOES NOT REPLACE (20 Sep 2026, wall r-20260917-01). The scan reads a
// fourteen-day window, paged now so it really is fourteen days; a promise older than that,
// or one the model did not return this time, is carried across from the previous file until
// `done` closes it or it is old enough that nobody is waiting (tools/lib/promises-merge.mjs).
// Before this, a promise that fell out of the window vanished, which reads like it was kept.
//
// CLOSURES ARE APPEND ONLY, keyed on the source message id plus a fingerprint of the words.
// Every scan is a full rescan, so anything not deliberately carried across comes back; the
// first version of this carried it across by matching the promise TEXT, which the model
// rewords slightly between runs, and promises closed on Monday reappeared on Tuesday. A
// tracker that resurrects what its owner has already closed is ignored inside a week.
import fs from 'node:fs';
import path from 'node:path';
import { OWNER, ROOT, requireConnection, graph } from './lib/connected.mjs';
import { mergeOpen } from './lib/promises-merge.mjs';

const WORK = path.join(ROOT, 'work');
const OPEN_FILE = path.join(WORK, 'promises.json');
const CANDIDATES = path.join(WORK, 'promise-candidates.json');
const CLOSURES = path.join(WORK, 'closures.jsonl');
const TZ = 'Australia/Brisbane';

const [, , cmd, ...args] = process.argv;
const write = (file, data) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(`${file}.tmp`, JSON.stringify(data, null, 1)); fs.renameSync(`${file}.tmp`, file); };
const read = (file, fallback = null) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { return fallback; } };
const one = (s, n) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };
const when = (iso) => (iso ? new Date(iso).toLocaleString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: TZ }) : '');

/** Lowercase alphanumerics, first eight words. Survives rewording that keeps the same words. */
export const fingerprint = (text) => String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').slice(0, 8).join(' ');

function closures() {
  const m = new Map();
  try {
    for (const line of fs.readFileSync(CLOSURES, 'utf8').trim().split('\n')) {
      try { const e = JSON.parse(line); m.set(`${e.sourceId}|${e.fp}`, e); } catch (_) { /* a torn line is not a closure */ }
    }
  } catch (_) { /* no file yet */ }
  return m;
}
function closeEntry(entry) {
  fs.mkdirSync(WORK, { recursive: true });
  fs.appendFileSync(CLOSURES, `${JSON.stringify(entry)}\n`);
}
/** Closed unless the same email carries several promises, where only an exact word match counts. */
function isClosed(p, sameEmail, shut = closures()) {
  const exact = shut.get(`${p.id}|${fingerprint(p.promise)}`);
  if (exact) return exact.state !== 'open';
  if (sameEmail > 1) return false;
  for (const [k, e] of shut) if (k.startsWith(`${p.id}|`) && e.state !== 'open') return true;
  return false;
}

try {
  if (cmd === 'candidates') {
    const days = Number(args[0] || 14);
    requireConnection('read', 'reading his sent mail');
    const g = await graph();
    const sent = await g.sentMail(OWNER, { days, max: 1000 });   // paged: the whole window, not the newest 100
    // Kept on disk so `save` can put the real subject, date and link back on each promise
    // without trusting the model to repeat them.
    write(CANDIDATES, { at: new Date().toISOString(), days, messages: sent });
    const input = sent.map((m, i) => ({ i, to: m.to.join(', '), subject: m.subject || '(no subject)', sent: m.sent, preview: one(m.preview, 400) }));
    console.log(JSON.stringify(input, null, 1));
    if (!input.length) console.error(`Nothing sent in ${days} days, so there is nothing to read.`);
  } else if (cmd === 'save') {
    const file = args[0];
    if (!file) throw new Error('usage: save <file.json> (the array you returned from /promises-scan)');
    const found = read(file);
    const items = Array.isArray(found) ? found : (found?.promises || []);
    const cand = read(CANDIDATES);
    if (!cand) throw new Error('run `node tools/promises.mjs candidates` first: the email list it saves is what the indexes point at');
    const msgs = cand.messages || [];
    const open = items.map((p) => {
      const m = msgs[Number(p.i)];
      if (!m) return null;   // an index the list never had is dropped, never rendered
      return {
        id: m.id, conversationId: m.conversationId || null,
        promise: String(p.promise || '').slice(0, 300),
        to: m.to.join(', '),
        due: /^\d{4}-\d{2}-\d{2}$/.test(String(p.due || '')) ? p.due : null,
        confidence: ['high', 'medium', 'low'].includes(p.confidence) ? p.confidence : 'medium',
        subject: m.subject || '(no subject)',
        sentAt: m.sent,
        link: m.link || null,
        status: 'open',
      };
    }).filter(Boolean);
    const perEmail = open.reduce((m, p) => m.set(p.id, (m.get(p.id) || 0) + 1), new Map());
    const merged = open.map((p) => (isClosed(p, perEmail.get(p.id) || 1) ? { ...p, status: 'done' } : p));
    const previous = read(OPEN_FILE, { open: [] });
    const { open: all, carried } = mergeOpen(previous.open, merged, { fingerprint, isClosed: (p) => isClosed(p, 1) });
    const still = all.filter((p) => p.status === 'open');
    write(OPEN_FILE, { at: new Date().toISOString(), scannedDays: cand.days, messageCount: msgs.length, open: all });
    const overdue = still.filter((p) => p.due && Date.parse(`${p.due}T23:59:59+10:00`) < Date.now());
    console.log(`${still.length} open promise${still.length === 1 ? '' : 's'} from ${msgs.length} sent emails${carried ? `, ${carried} carried from earlier scans` : ''}${overdue.length ? `, ${overdue.length} past its date` : ''}. Saved to work/promises.json.`);
    console.log('Say none of them are late until tools/settled.mjs has checked: the scan cannot see whether he already did it.');
  } else if (cmd === 'list') {
    const data = read(OPEN_FILE);
    if (!data) { console.log('No scan yet. Run /promises-scan, or `node tools/promises.mjs candidates` then save.'); process.exit(0); }
    const open = (data.open || []).filter((p) => p.status === 'open');
    if (args.includes('--json')) { console.log(JSON.stringify({ at: data.at, open }, null, 1)); process.exit(0); }
    console.log(`Promises Tariq made, still open (scanned ${when(data.at)}):`);
    if (!open.length) console.log('Nothing outstanding.');
    open.forEach((p, i) => {
      console.log(`${i + 1}. ${one(p.promise, 120)}${p.carried ? '  (from an earlier scan, still open)' : ''}`);
      console.log(`   to ${p.to}${p.due ? `, due ${p.due}` : ', no date'}; from "${one(p.subject, 60)}"${p.link ? `\n   ${p.link}` : ''}`);
    });
    if (open.length) console.log('\nNone of these is late until tools/settled.mjs says STILL OPEN past its date. Close one with: node tools/promises.mjs done <n>');
  } else if (cmd === 'done' || cmd === 'reopen') {
    const data = read(OPEN_FILE);
    const open = (data?.open || []).filter((p) => p.status === 'open');
    const n = Number(args[0]);
    const p = open[n - 1];
    if (!p) throw new Error(`there is no promise ${args[0] || ''}: run list first`);
    closeEntry({ at: new Date().toISOString(), sourceId: p.id, fp: fingerprint(p.promise), state: cmd === 'done' ? 'done' : 'open', promise: one(p.promise, 200), by: 'tariq', note: args.slice(1).join(' ') || null });
    console.log(cmd === 'done' ? `Closed: ${one(p.promise, 100)}. It will not come back on the next scan.` : `Reopened: ${one(p.promise, 100)}.`);
  } else {
    console.log('usage: candidates [days] | save <file.json> | list [--json] | done <n> [note] | reopen <n>');
    process.exit(1);
  }
} catch (e) {
  console.error(String(e.message || e));
  process.exit(1);
}
