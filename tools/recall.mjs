#!/usr/bin/env node
// Recall: one search over everything the agent has written down or seen, with the file
// and line for each hit, so "I don't have that" is never said before looking.
//
//   node tools/recall.mjs "<query>" [--since 30d] [--in memory|sessions|raw|mail|shared|all] [--max 40]
//
// Every word in the query must appear on the line (case-insensitive, any order). Searched:
//   memory/**/*.md          what it knows (and memory/capabilities.md, memory/rules.md)
//   sessions/**/*.md        one log per finished job (newest first)
//   raw/**/*.md|*.txt       source material, never rewritten (and raw/tfa-shared/, the
//                           read-only export from the workflow lane)
//   work/mail-index.json    subject / from / date of the last mail listings
//   work/build-list.md      Tariq's Build List
//   work/requests.md        the wall list
//   work/jobs.json          the job board (what he asked, what was done)
// --since limits by the date in the file name (sessions) or the file's mtime (everything
// else). Output: `path:line: text`, grouped by area, newest first, capped at --max.
// Read only. Never prints a secret: config/, .claude/, .env and node_modules are skipped.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = { since: null, in: 'all', max: 40 };
const words = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--since') opt.since = args[++i];
  else if (a === '--in') opt.in = args[++i];
  else if (a === '--max') opt.max = Number(args[++i]) || 40;
  else words.push(...a.split(/\s+/));
}
const terms = words.map((w) => w.toLowerCase()).filter(Boolean);
if (terms.length === 0) {
  console.error('usage: node tools/recall.mjs "<query>" [--since 30d] [--in memory|sessions|raw|mail|shared|all] [--max 40]');
  process.exit(1);
}

const cutoff = (() => {
  if (!opt.since) return null;
  const m = /^(\d+)([dwm])$/.exec(opt.since);
  if (!m) return null;
  const n = Number(m[1]) * (m[2] === 'd' ? 1 : m[2] === 'w' ? 7 : 30);
  return Date.now() - n * 86400000;
})();

const AREAS = {
  memory: { dir: 'memory', ext: ['.md'] },
  sessions: { dir: 'sessions', ext: ['.md'] },
  raw: { dir: 'raw', ext: ['.md', '.txt'] },
  shared: { dir: 'raw/tfa-shared', ext: ['.md', '.json'] },
  mail: { files: ['work/mail-index.json'] },
  work: { files: ['work/build-list.md', 'work/requests.md', 'work/jobs.json'] },
};
const pick = opt.in === 'all' ? Object.keys(AREAS) : [opt.in];

function walk(dir, exts, out = []) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return out; }
  for (const e of entries) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    // statSync follows symlinks: raw/tfa-shared is a link into the workflow lane's export.
    let isDir = false;
    try { isDir = fs.statSync(p).isDirectory(); } catch (_) { continue; }
    if (isDir) walk(p, exts, out);
    else if (exts.includes(path.extname(e.name).toLowerCase())) out.push(p);
  }
  return out;
}

function fileDate(p) {
  const m = /(\d{4}-\d{2}-\d{2})/.exec(path.basename(p));
  if (m) return new Date(m[1]).getTime();
  try { return fs.statSync(p).mtimeMs; } catch (_) { return 0; }
}

function matches(line) {
  const l = line.toLowerCase();
  return terms.every((t) => l.includes(t));
}

// JSON files (mail index, job board) are searched as one line per record, so a hit shows
// the whole subject/from/date or the whole job rather than a fragment of a key.
function jsonLines(p) {
  let data;
  try { data = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (_) { return []; }
  const records = Array.isArray(data) ? data : Array.isArray(data.jobs) ? data.jobs : Array.isArray(data.items) ? data.items : Array.isArray(data.messages) ? data.messages : Object.values(data).find(Array.isArray) || [];
  return records.map((r, i) => ({ n: i + 1, text: JSON.stringify(r).replace(/\s+/g, ' ').slice(0, 300) }));
}

function textLines(p) {
  let text;
  try { text = fs.readFileSync(p, 'utf8'); } catch (_) { return []; }
  return text.split('\n').map((t, i) => ({ n: i + 1, text: t.trim() }));
}

const hits = [];
for (const area of pick) {
  const spec = AREAS[area];
  if (!spec) { console.error(`unknown area ${area}`); process.exit(1); }
  const files = spec.dir ? walk(path.join(ROOT, spec.dir), spec.ext) : spec.files.map((f) => path.join(ROOT, f));
  for (const p of files) {
    if (area === 'raw' && p.includes(`${path.sep}tfa-shared${path.sep}`) && pick.includes('shared')) continue; // shared has its own area
    const when = fileDate(p);
    if (cutoff && when < cutoff) continue;
    const lines = p.endsWith('.json') ? jsonLines(p) : textLines(p);
    for (const { n, text } of lines) {
      if (text && matches(text)) hits.push({ area, file: path.relative(ROOT, p), n, text: text.slice(0, 220), when });
    }
  }
}

hits.sort((a, b) => b.when - a.when);
const shown = hits.slice(0, opt.max);
if (shown.length === 0) {
  console.log(`nothing for "${terms.join(' ')}"${opt.since ? ` since ${opt.since}` : ''} in ${pick.join(', ')}. Try fewer words, or --since off, or mail.mjs search for the live mailbox.`);
  process.exit(0);
}
let last = null;
for (const h of shown) {
  if (h.area !== last) { console.log(`\n== ${h.area}`); last = h.area; }
  console.log(`${h.file}:${h.n}: ${h.text}`);
}
if (hits.length > shown.length) console.log(`\n${hits.length - shown.length} more; narrow the words or raise --max.`);
