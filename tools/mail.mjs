#!/usr/bin/env node
// Tariq's mail and diary, read through the TFA agents' Graph helper. Read-only except
// `draft`, which writes a reply DRAFT into his own Drafts folder and nothing else.
//
//   node tools/mail.mjs inbox [hours]            his inbox, newest first (default 24h)
//   node tools/mail.mjs search "<text>" [mailbox] free-text search, all TFA mailboxes
//   node tools/mail.mjs from <address> [mailbox]  everything from one sender
//   node tools/mail.mjs sent [days]              what he sent (default 14 days)
//   node tools/mail.mjs read <n|id>              one message in full (text)
//   node tools/mail.mjs diary [days]             his calendar (default 7 days)
//   node tools/mail.mjs draft <n|id> --file <path> | --text "<body>"
//
// Every list writes work/mail-index.json so `read 3` and `draft 3` resolve without the
// model ever handling a 150-character Graph id. The index is replaced by the next list.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const TFA = process.env.TFA_AGENTS || '/Users/tfaagents/tfa-agents';
const OWNER = process.env.TARIQ_MAILBOX || 'tariq@tfaconstructions.com.au';
const INDEX = path.join(ROOT, 'work', 'mail-index.json');

const graph = await import(path.join(TFA, 'runner/lib/graph.mjs'));

const [, , cmd, ...args] = process.argv;
const TZ = 'Australia/Brisbane';
const when = (iso) => iso ? new Date(iso).toLocaleString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: TZ }) : '';
const one = (s, n = 140) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);

function saveIndex(rows) {
  fs.mkdirSync(path.dirname(INDEX), { recursive: true });
  const idx = {};
  rows.forEach((r, i) => { idx[i + 1] = { id: r.id, mailbox: r.mailbox || OWNER, subject: r.subject, from: r.from || null }; });
  fs.writeFileSync(INDEX, JSON.stringify(idx, null, 2));
}
function resolve(ref) {
  if (/^\d+$/.test(ref)) {
    let idx = {};
    try { idx = JSON.parse(fs.readFileSync(INDEX, 'utf8')); } catch (_) {}
    const hit = idx[ref];
    if (!hit) throw new Error(`no email ${ref} in the last list. Run inbox, search or from first.`);
    return hit;
  }
  return { id: ref, mailbox: OWNER };
}
function printList(rows, { showMailbox = false } = {}) {
  if (!rows.length) { console.log('Nothing found.'); return; }
  rows.forEach((r, i) => {
    if (r.error) { console.log(`${i + 1}. ${r.mailbox}: could not read (${one(r.error, 80)})`); return; }
    const box = showMailbox && r.mailbox && r.mailbox !== OWNER ? ` [${r.mailbox}]` : '';
    console.log(`${i + 1}. ${when(r.received || r.sent)}${box} ${r.from ? `from ${r.from}` : r.to ? `to ${r.to.join(', ')}` : ''}`);
    console.log(`   ${one(r.subject, 100)}${r.isRead === false ? '  (unread)' : ''}`);
    if (r.preview) console.log(`   ${one(r.preview, 160)}`);
  });
  console.log(`\n${rows.length} shown. "read <n>" opens one, "draft <n>" writes a reply.`);
}

try {
  if (cmd === 'inbox') {
    const hours = Number(args[0] || 24);
    const rows = (await graph.recentInbox(OWNER, hours)).map((m) => ({
      id: m.id, mailbox: OWNER, subject: m.subject, from: m.from?.emailAddress?.address || null,
      received: m.receivedDateTime, isRead: m.isRead, preview: m.bodyPreview, link: m.webLink,
    }));
    saveIndex(rows); console.log(`Inbox, last ${hours} hours (Brisbane time):`); printList(rows);
  } else if (cmd === 'search') {
    if (!args[0]) throw new Error('usage: search "<text>" [mailbox]');
    const rows = await graph.searchMail(args[0], { mailbox: args[1] || null });
    saveIndex(rows); printList(rows, { showMailbox: true });
  } else if (cmd === 'from') {
    if (!args[0]) throw new Error('usage: from <address> [mailbox]');
    const rows = await graph.searchMail(args[0], { mailbox: args[1] || null });
    const mine = rows.filter((r) => r.error || String(r.from || '').toLowerCase() === args[0].toLowerCase());
    saveIndex(mine); printList(mine, { showMailbox: true });
  } else if (cmd === 'sent') {
    const days = Number(args[0] || 14);
    const rows = (await graph.sentMail(OWNER, { days })).map((m) => ({ ...m, mailbox: OWNER }));
    saveIndex(rows); console.log(`Sent, last ${days} days:`); printList(rows);
  } else if (cmd === 'read') {
    if (!args[0]) throw new Error('usage: read <n|id>');
    const ref = resolve(args[0]);
    const m = await graph.getMessage(ref.mailbox, ref.id);
    const body = String(m.body?.content || '').replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
    console.log(`From: ${m.from?.emailAddress?.name || ''} <${m.from?.emailAddress?.address || ''}>`);
    console.log(`To: ${(m.toRecipients || []).map((r) => r.emailAddress?.address).join(', ')}`);
    if (m.ccRecipients?.length) console.log(`Cc: ${m.ccRecipients.map((r) => r.emailAddress?.address).join(', ')}`);
    console.log(`Date: ${when(m.receivedDateTime)}\nSubject: ${m.subject}\nOpen in Outlook: ${m.webLink}\n`);
    console.log(body.length > 6000 ? `${body.slice(0, 6000)}\n\n[cut at 6000 characters of ${body.length}]` : body);
  } else if (cmd === 'diary') {
    const days = Number(args[0] || 7);
    const events = await graph.calendarView(OWNER, { toISO: new Date(Date.now() + days * 864e5).toISOString() });
    if (!events.length) { console.log(days > 1 ? `Nothing in the next ${days} days.` : 'Nothing on today.'); }
    for (const e of events) {
      const d = e.allDay ? `${new Date(e.start).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ })} all day` : when(e.start);
      console.log(`- ${d}  ${one(e.subject, 80)}${e.location ? `  (${one(e.location, 50)})` : ''}${e.organizer ? `  by ${e.organizer}` : ''}`);
    }
  } else if (cmd === 'draft') {
    if (!args[0]) throw new Error('usage: draft <n|id> --file <path> | --text "<body>"');
    const ref = resolve(args[0]);
    if (ref.mailbox !== OWNER) throw new Error('drafts go only into Tariq\'s own mailbox; that email is in another mailbox');
    let body = null;
    const fi = args.indexOf('--file'), ti = args.indexOf('--text');
    if (fi >= 0) body = fs.readFileSync(args[fi + 1], 'utf8');
    else if (ti >= 0) body = args[ti + 1];
    if (!body || !body.trim()) throw new Error('empty draft body');
    if (/—/.test(body)) throw new Error('the draft contains an em dash; rewrite it without one');
    const res = await graph.createReplyDraft(OWNER, ref.id, body.trim());
    console.log(`Draft saved in Tariq's Drafts folder${res.link ? `: ${res.link}` : ''}. Nothing sent; he presses send in Outlook.`);
  } else {
    console.log('usage: inbox [hours] | search "<text>" [mailbox] | from <address> [mailbox] | sent [days] | read <n|id> | diary [days] | draft <n|id> --file <path>');
    process.exit(1);
  }
} catch (e) {
  console.error(String(e.message || e));
  process.exit(1);
}
