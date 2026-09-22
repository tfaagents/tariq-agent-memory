#!/usr/bin/env node
// Send one message to Tariq on Telegram, outside a live session. Used by scheduled
// runs (the morning brief, the Friday retro). It can only reach the chat ids on the
// bot's own allowlist, so it can never message anyone else.
//
//   node tools/notify.mjs "text"            or    echo "text" | node tools/notify.mjs
//   node tools/notify.mjs --file <path>        (--plain = no bold first line, no escaping)
import fs from 'node:fs';
import net from 'node:net';
// Node tries each address the DNS returns with a 250 ms budget by default ("happy
// eyeballs"). Brisbane to Telegram's data centre takes longer than that, so fetch reported
// ETIMEDOUT nine times on 11 Sep 2026 while curl and the bridge connected fine. Give it 5 s.
net.setDefaultAutoSelectFamilyAttemptTimeout(5000);
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
// Every argument used to be taken as the message body, so `--help` sent Tariq the literal
// word "--help" (06:32 on 14 Sep, again 06:42 on 15 Sep) and `--plain` with a piped
// message sent "--plain". Flags are read first now, and an unknown option stops the send
// instead of becoming it. A real message that starts with a dash ("- Alee, due 11 Sep")
// is not an option: an option is one word, a leading dash, then a letter.
const option = (a) => /^--?[A-Za-z][A-Za-z0-9-]*$/.test(a);
if (args.includes('--help') || args.includes('-h')) {
  console.log('node tools/notify.mjs "text"           send one message to Tariq');
  console.log('echo "text" | node tools/notify.mjs    the same, from stdin');
  console.log('node tools/notify.mjs --file <path>    send the contents of a file');
  console.log('  --plain                              no bold first line, no escaping');
  process.exit(0);
}

const DIR = process.env.TELEGRAM_STATE_DIR || path.join(process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude'), 'channels', 'telegram');
const env = fs.readFileSync(path.join(DIR, '.env'), 'utf8');
const token = /TELEGRAM_BOT_TOKEN=(\S+)/.exec(env)?.[1];
if (!token) { console.error('no bot token'); process.exit(1); }
const access = JSON.parse(fs.readFileSync(path.join(DIR, 'access.json'), 'utf8'));
const chats = access.allowFrom || [];
if (!chats.length) { console.error('nobody on the allowlist'); process.exit(1); }

let text;
const fi = args.indexOf('--file');
const body = args.filter((a, i) => a !== '--plain' && !(fi >= 0 && (i === fi || i === fi + 1)));
const unknown = body.find(option);
if (unknown) { console.error(`unknown option ${unknown}; nothing sent (--help for usage)`); process.exit(1); }
if (fi >= 0) text = fs.readFileSync(args[fi + 1], 'utf8');
else if (body.length) text = body.join(' ');
else text = fs.readFileSync(0, 'utf8');
text = String(text || '').trim();
if (!text) { console.error('empty message'); process.exit(1); }
if (text.includes('—')) { console.error('em dash in message; rewrite it'); process.exit(1); }

// Same look as the live session's replies: the first line bold, the rest plain, sent as
// MarkdownV2 with every special character escaped. --plain sends the text untouched. If
// Telegram rejects the markup the message goes again as plain text rather than not at all.
const plain = args.includes('--plain');
const esc = (t) => t.replace(/[_*\[\]()~`>#+\-=|{}.!\\]/g, (c) => '\\' + c);
// A line that is only capitals and spaces, 3 to 24 characters (TODAY, WAITING ON YOU), is a
// section header of the morning brief and goes bold as well.
const header = (l) => /^[A-Z][A-Z ]{2,23}$/.test(l);
const marked = (t) => t.split('\n').map((l, i) => (i === 0 || header(l)) && l.trim() ? `*${esc(l)}*` : esc(l)).join('\n');

async function send(chat_id, body) {
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id, disable_web_page_preview: true, ...body }),
  });
  return r.json();
}
const chunks = [];
for (let i = 0; i < text.length; i += 3500) chunks.push(text.slice(i, i + 3500));
for (const chat_id of chats) {
  for (const [i, chunk] of chunks.entries()) {
    let j = plain ? await send(chat_id, { text: chunk }) : await send(chat_id, { text: i === 0 ? marked(chunk) : esc(chunk), parse_mode: 'MarkdownV2' });
    if (!j.ok && !plain) j = await send(chat_id, { text: chunk });
    if (!j.ok) { console.error(`send failed: ${j.description}`); process.exit(1); }
  }
}
console.log(`sent to ${chats.length} chat${chats.length === 1 ? '' : 's'}`);
