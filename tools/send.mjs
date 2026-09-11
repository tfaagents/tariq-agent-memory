#!/usr/bin/env node
// Send one of Tariq's OWN drafts, as tariq@, through the send app. This is the only path
// out of the building for email, and `go` is on the ask list: the Telegram Approve prompt
// on his phone is the gate. Nothing here composes; a draft must already exist (from
// tools/mail.mjs draft, or written by him in Outlook) so what he approves is what leaves.
//
//   node tools/send.mjs preview <last|draft-id>   what would leave: to, cc, subject, first lines, attachments
//   node tools/send.mjs go <last|draft-id>        send it (Approve on Telegram first); receipt in work/sent.log
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, OWNER, requireConnection, graph } from './lib/connected.mjs';

const [, , cmd, ref] = process.argv;
const one = (s, n = 160) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);

function resolveDraft(r) {
  if (!r) throw new Error('usage: send.mjs preview|go <last|draft-id>');
  if (r === 'last') {
    const f = path.join(ROOT, 'work/last-draft.json');
    if (!fs.existsSync(f)) throw new Error('no draft on record; run "node tools/mail.mjs draft <n> --file <path>" first');
    return JSON.parse(fs.readFileSync(f, 'utf8')).id;
  }
  return r;
}

async function describe(g, id) {
  const m = await g.api(`/users/${encodeURIComponent(OWNER)}/messages/${encodeURIComponent(id)}?$select=id,subject,toRecipients,ccRecipients,bodyPreview,hasAttachments,isDraft`);
  if (!m.isDraft) throw new Error('that message is not a draft; only drafts can be sent from here');
  const names = (xs) => (xs || []).map((x) => x.emailAddress?.address).filter(Boolean);
  let attachments = [];
  if (m.hasAttachments) {
    const a = await g.api(`/users/${encodeURIComponent(OWNER)}/messages/${encodeURIComponent(id)}/attachments?$select=name,size`);
    attachments = (a.value || []).map((x) => `${x.name} (${Math.round((x.size || 0) / 1024)} KB)`);
  }
  return { id: m.id, to: names(m.toRecipients), cc: names(m.ccRecipients), subject: m.subject, preview: one(m.bodyPreview, 300), attachments };
}

function show(d) {
  console.log(`To: ${d.to.join(', ') || '(nobody)'}${d.cc.length ? `\nCc: ${d.cc.join(', ')}` : ''}`);
  console.log(`Subject: ${d.subject || '(no subject)'}`);
  console.log(`Starts: ${d.preview}`);
  console.log(`Attachments: ${d.attachments.length ? d.attachments.join('; ') : 'none'}`);
}

try {
  if (cmd !== 'preview' && cmd !== 'go') { console.log('usage: send.mjs preview|go <last|draft-id>'); process.exit(1); }
  const id = resolveDraft(ref);
  requireConnection('read', 'reading the draft');
  const g = await graph();
  const d = await describe(g, id);
  show(d);
  if (cmd === 'preview') { console.log('\nNot sent. "node tools/send.mjs go last" sends it after his Approve.'); process.exit(0); }
  if (!d.to.length) throw new Error('the draft has no recipient');
  const send = requireConnection('send', 'sending as tariq@');
  await g.client(send.app).api(`/users/${encodeURIComponent(OWNER)}/messages/${encodeURIComponent(d.id)}/send`, { method: 'POST' });
  const line = `${new Date().toISOString()} sent to ${d.to.join(', ')}${d.cc.length ? ` cc ${d.cc.join(', ')}` : ''} | ${d.subject} | ${d.attachments.length} attachment(s)`;
  fs.mkdirSync(path.join(ROOT, 'work'), { recursive: true });
  fs.appendFileSync(path.join(ROOT, 'work/sent.log'), line + '\n');
  try { fs.unlinkSync(path.join(ROOT, 'work/last-draft.json')); } catch (_) {}
  console.log(`\nSent as ${OWNER}. Receipt in work/sent.log.`);
} catch (e) { console.error(String(e.message || e)); process.exit(1); }
