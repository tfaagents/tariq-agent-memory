#!/usr/bin/env node
// Send one message to Tariq on Telegram, outside a live session. Used by scheduled
// runs (the morning brief, the Friday retro). It can only reach the chat ids on the
// bot's own allowlist, so it can never message anyone else.
//
//   node tools/notify.mjs "text"            or    echo "text" | node tools/notify.mjs
//   node tools/notify.mjs --file <path>
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DIR = process.env.TELEGRAM_STATE_DIR || path.join(process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude'), 'channels', 'telegram');
const env = fs.readFileSync(path.join(DIR, '.env'), 'utf8');
const token = /TELEGRAM_BOT_TOKEN=(\S+)/.exec(env)?.[1];
if (!token) { console.error('no bot token'); process.exit(1); }
const access = JSON.parse(fs.readFileSync(path.join(DIR, 'access.json'), 'utf8'));
const chats = access.allowFrom || [];
if (!chats.length) { console.error('nobody on the allowlist'); process.exit(1); }

const args = process.argv.slice(2);
let text;
const fi = args.indexOf('--file');
if (fi >= 0) text = fs.readFileSync(args[fi + 1], 'utf8');
else if (args.length) text = args.join(' ');
else text = fs.readFileSync(0, 'utf8');
text = String(text || '').trim();
if (!text) { console.error('empty message'); process.exit(1); }
if (text.includes('—')) { console.error('em dash in message; rewrite it'); process.exit(1); }

const chunks = [];
for (let i = 0; i < text.length; i += 3800) chunks.push(text.slice(i, i + 3800));
for (const chat_id of chats) {
  for (const chunk of chunks) {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id, text: chunk, disable_web_page_preview: true }),
    });
    const j = await r.json();
    if (!j.ok) { console.error(`send failed: ${j.description}`); process.exit(1); }
  }
}
console.log(`sent to ${chats.length} chat${chats.length === 1 ? '' : 's'}`);
