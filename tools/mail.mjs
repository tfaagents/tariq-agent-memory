#!/usr/bin/env node
// Tariq's mail and diary, read through this repo's own Graph helper. Read-only except
// `draft`, which writes a reply DRAFT into his own Drafts folder and nothing else.
//
//   node tools/mail.mjs inbox [hours]            his inbox, newest first (default 24h)
//   node tools/mail.mjs search "<text>" [mailbox] free-text search, all TFA mailboxes
//   node tools/mail.mjs from <address> [mailbox]  everything from one sender
//   node tools/mail.mjs sent [days]              what he sent (default 14 days)
//   node tools/mail.mjs read <n|id>              one message in full (text)
//   node tools/mail.mjs diary [days]             his calendar (default 7 days)
//   node tools/mail.mjs draft <n|id> --file <path> | --text "<body>"
//   node tools/mail.mjs attachments <n|id>       what is attached: number, name, kind, size
//   node tools/mail.mjs attach <n|id> [k|name|all] [--to work/<dir>]
//                                                download to work/inbox/ (all but inline images
//                                                unless one is named); send with the reply tool
//
// Every list writes work/mail-index.json so `read 3` and `draft 3` resolve without the
// model ever handling a 150-character Graph id. The index is replaced by the next list.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OWNER = process.env.TARIQ_MAILBOX || 'tariq@tfaconstructions.com.au';
const INDEX = path.join(ROOT, 'work', 'mail-index.json');

// The Graph helper is vendored in this repo and reads config/connections.json here, with
// the cert in this user's own home. Nothing is read from the workflow lane.
const graph = await import(path.join(ROOT, 'runner/lib/graph.mjs'));
const { logDraft } = await import(path.join(ROOT, 'tools/lib/tone.mjs'));
const { loadNoise, noiseReason } = await import(path.join(ROOT, 'tools/lib/noise.mjs'));
const att = await import(path.join(ROOT, 'tools/lib/attachments.mjs'));

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
  const noise = [];
  rows.forEach((r, i) => {
    if (r.error) { console.log(`${i + 1}. ${r.mailbox}: could not read (${one(r.error, 80)})`); return; }
    if (r.noise) { noise.push([i + 1, r]); return; }   // listed at the end, number kept
    const box = showMailbox && r.mailbox && r.mailbox !== OWNER ? ` [${r.mailbox}]` : '';
    // An inbox row addressed to someone else is a copy. The To: line is the test that
    // separates his problem from an alert that merely landed in his box.
    const copy = r.from && r.to?.length && !r.to.map((t) => t.toLowerCase()).includes(OWNER) ? `  (copy, addressed to ${r.to.join(', ')})` : '';
    console.log(`${i + 1}. ${when(r.received || r.sent)}${box} ${r.from ? `from ${r.from}` : r.to ? `to ${r.to.join(', ')}` : ''}${copy}`);
    console.log(`   ${one(r.subject, 100)}${r.isRead === false ? '  (unread)' : ''}${r.hasAttachments ? '  (attachment)' : ''}`);
    if (r.preview) console.log(`   ${one(r.preview, 160)}`);
  });
  if (noise.length) {
    console.log(`\nFiltered as noise by config/noise.json (${noise.length}). Not his; never a line in the brief or the close-out. Still readable with "read <n>":`);
    for (const [n, r] of noise) console.log(`${n}. ${one(r.subject, 80)}, from ${r.from}${r.to?.length ? ` to ${r.to.join(', ')}` : ''}: ${r.noise}`);
  }
  console.log(`\n${rows.length - noise.length} shown${noise.length ? `, ${noise.length} filtered` : ''}. "read <n>" opens one, "draft <n>" writes a reply.`);
}

try {
  if (cmd === 'inbox') {
    const hours = Number(args[0] || 24);
    const rules = loadNoise(ROOT);
    const rows = (await graph.recentInbox(OWNER, hours)).map((m) => {
      const row = {
        id: m.id, mailbox: OWNER, subject: m.subject, from: m.from?.emailAddress?.address || null,
        to: (m.toRecipients || []).map((r) => r.emailAddress?.address).filter(Boolean),
        received: m.receivedDateTime, isRead: m.isRead, preview: m.bodyPreview, link: m.webLink,
        hasAttachments: Boolean(m.hasAttachments),
      };
      row.noise = noiseReason(row, rules);
      return row;
    });
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
    const rows = (await graph.sentMail(OWNER, { days, max: 100 })).map((m) => ({ ...m, mailbox: OWNER }));   // a screenful; the promise scan pages the whole window
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
    if (m.hasAttachments) {
      // Named here so the file is never "found but could not be handed over" again
      // (the ASIC extract, 21 Sep 2026): the download is one command away.
      // A failed listing must never look like "no attachments": say so and name the retry.
      const list = await graph.listAttachments(ref.mailbox, ref.id).catch((e) => { console.log(`\nAttached: could not list them (${one(e.message, 80)}). Try: node tools/mail.mjs attachments ${args[0]}`); return []; });
      const real = list.filter((a) => !a.isInline);
      const inline = list.length - real.length;
      if (real.length) {
        // Numbers are listing positions (inline images keep theirs), the same numbers
        // "attachments" prints and "attach <n> k" takes, so the model never picks the wrong one.
        console.log(`\nAttached (${real.length}${inline ? `, plus ${inline} inline image${inline > 1 ? 's' : ''} not listed` : ''}):`);
        list.forEach((a, i) => { if (!a.isInline) console.log(att.describe(a, i)); });
        console.log(`Download with: node tools/mail.mjs attach ${args[0]}${real.length > 1 ? ' [k|name]' : ''}`);
      }
    }
  } else if (cmd === 'attachments') {
    if (!args[0]) throw new Error('usage: attachments <n|id>');
    const ref = resolve(args[0]);
    const list = await graph.listAttachments(ref.mailbox, ref.id);
    const subj = ref.subject ? ` to "${one(ref.subject, 80)}"` : '';   // a raw id carries no subject
    if (!list.length) { console.log('No attachments on that email.'); }
    else {
      console.log(`Attached${subj} (${list.length}):`);
      list.forEach((a, i) => console.log(att.describe(a, i)));
      console.log(`\nDownload with: node tools/mail.mjs attach ${args[0]} [k|name|all]  (all = every one but inline images)`);
    }
  } else if (cmd === 'attach') {
    // Bytes land under work/ and nowhere else. The agent may not write tools/, config/,
    // hooks or settings (Edit is denied there); a download path is not a way around that.
    const ti = args.indexOf('--to');
    if (ti >= 0 && (args[ti + 1] === undefined || args[ti + 1].startsWith('--'))) throw new Error('--to needs a folder under work/ (the default is work/inbox/)');
    const rest = ti >= 0 ? args.filter((_, i) => i !== ti && i !== ti + 1) : args;
    if (!rest[0]) throw new Error('usage: attach <n|id> [k|name|all] [--to work/<dir>]');
    const dir = att.withinWork(ROOT, ti >= 0 ? args[ti + 1] : null);
    if (!dir) throw new Error('--to must be a folder under work/ (the default is work/inbox/)');
    const ref = resolve(rest[0]);
    const list = await graph.listAttachments(ref.mailbox, ref.id);
    const { picked, why } = att.pick(list, rest[1]);
    if (why) { console.log(why); if (list.length) list.forEach((a, i) => console.log(att.describe(a, i))); process.exit(picked.length ? 0 : 3); }
    fs.mkdirSync(dir, { recursive: true });
    const saved = [];
    for (const a of picked) {
      const stop = att.blocker(a);
      if (stop) { console.log(`${a.name || '(no name)'}: ${stop}.`); continue; }
      // An attached email comes back as MIME whatever it is called (Graph names it by the
      // forwarded subject, dots and all), so the suffix follows the type, not the name.
      const name = att.safeName(a.name, `attachment-${list.indexOf(a) + 1}`) + (a.type === 'item' && !/\.eml$/i.test(a.name || '') ? '.eml' : '');
      const out = att.uniquePath(dir, name, (p) => fs.existsSync(p));
      const bytes = await graph.attachmentContent(ref.mailbox, ref.id, a.id);
      if (!bytes.length) { console.log(`${a.name || '(no name)'}: came back empty from Graph, nothing saved.`); continue; }
      fs.writeFileSync(out, bytes, { flag: 'wx' });   // never over an existing file, never through a dangling link
      saved.push(out);
      console.log(`Saved ${att.kb(bytes.length)} to ${out}`);
    }
    const from = ref.subject ? `From "${one(ref.subject, 80)}"` : 'From that email';
    if (saved.length) console.log(`\n${from}${ref.mailbox !== OWNER ? ` in ${ref.mailbox}` : ''}. To hand it to him on Telegram, pass the path in the reply tool's files: [...]. A PDF or image can also be Read.`);
    else process.exit(3);
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
    const orig = await graph.getMessage(OWNER, ref.id).catch(() => null);
    const res = await graph.createReplyDraft(OWNER, ref.id, body.trim());
    fs.writeFileSync(path.join(ROOT, 'work', 'last-draft.json'), JSON.stringify({ id: res.id, replyTo: ref.id, subject: ref.subject || null, at: new Date().toISOString() }, null, 2));
    // Every draft is logged so the nightly review can find what he actually sent and learn
    // from the difference (tools/tone.mjs review).
    logDraft({ draftId: res.id, replyTo: ref.id, conversationId: orig?.conversationId || null, to: orig?.from?.emailAddress?.address || null, subject: ref.subject || orig?.subject || null, file: fi >= 0 ? args[fi + 1] : null, text: body.trim() });
    console.log(`Draft saved in Tariq's Drafts folder${res.link ? `: ${res.link}` : ''}. Nothing sent. To send it he taps Approve on: node tools/send.mjs go last`);
  } else {
    console.log('usage: inbox [hours] | search "<text>" [mailbox] | from <address> [mailbox] | sent [days] | read <n|id> | attachments <n|id> | attach <n|id> [k|name|all] [--to work/<dir>] | diary [days] | draft <n|id> --file <path>');
    process.exit(1);
  }
} catch (e) {
  console.error(String(e.message || e));
  process.exit(1);
}
