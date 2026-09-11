#!/usr/bin/env node
// The job board: every message from Tariq is a job with an id, a status and the id of the
// Telegram progress message that shows it. Lives in work/jobs.json so it survives
// compaction and the 5am restart. The main session is the only writer.
//
//   node tools/jobs.mjs open "<his words>"            -> prints the new id (j-YYYYMMDD-NN)
//   node tools/jobs.mjs msg <id> <telegram_message_id>  remembers which message to edit
//   node tools/jobs.mjs step <id> "<one line>"          appends a progress line
//   node tools/jobs.mjs done <id> ["<one line>"]        closes it
//   node tools/jobs.mjs fail <id> "<plain reason>"      closes it as failed
//   node tools/jobs.mjs list [--open]                   open jobs first, newest first
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'work/jobs.json');
const KEEP = 60;
const TZ = 'Australia/Brisbane';

const stamp = () => new Date().toLocaleString('sv-SE', { timeZone: TZ }).replace(' ', 'T').slice(0, 16);
const load = () => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (_) { return { jobs: [] }; } };
const save = (d) => { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(d, null, 2)); };
const find = (d, id) => { const j = d.jobs.find((x) => x.id === id); if (!j) { console.error(`no job ${id}`); process.exit(1); } return j; };

const [cmd, ...rest] = process.argv.slice(2);
const d = load();
switch (cmd) {
  case 'open': {
    const ask = rest.join(' ').trim(); if (!ask) { console.error('open needs his words'); process.exit(1); }
    const day = stamp().slice(0, 10).replace(/-/g, '');
    const n = d.jobs.filter((j) => j.id.startsWith(`j-${day}-`)).length + 1;
    const job = { id: `j-${day}-${String(n).padStart(2, '0')}`, ask, status: 'open', opened: stamp(), message_id: null, steps: [], closed: null, result: null };
    d.jobs.unshift(job); d.jobs = d.jobs.slice(0, KEEP); save(d); console.log(job.id); break;
  }
  case 'msg': { const j = find(d, rest[0]); j.message_id = rest[1] || null; save(d); console.log(`${j.id} message ${j.message_id}`); break; }
  case 'step': { const j = find(d, rest[0]); j.steps.push(`${stamp().slice(11)} ${rest.slice(1).join(' ')}`); save(d); console.log(`${j.id} ${j.steps.length} steps`); break; }
  case 'done': case 'fail': {
    const j = find(d, rest[0]); j.status = cmd === 'done' ? 'done' : 'failed'; j.closed = stamp(); j.result = rest.slice(1).join(' ') || null; save(d); console.log(`${j.id} ${j.status}`); break;
  }
  case 'list': {
    const open = d.jobs.filter((j) => j.status === 'open');
    const rows = rest.includes('--open') ? open : [...open, ...d.jobs.filter((j) => j.status !== 'open').slice(0, 10)];
    if (!rows.length) { console.log('no jobs'); break; }
    for (const j of rows) {
      const last = j.steps.length ? ` | last: ${j.steps[j.steps.length - 1]}` : '';
      console.log(`${j.id} [${j.status}] ${j.opened} "${j.ask}"${j.message_id ? ` msg ${j.message_id}` : ''}${last}${j.result ? ` | ${j.result}` : ''}`);
    }
    break;
  }
  default: console.error('usage: jobs.mjs open|msg|step|done|fail|list'); process.exit(1);
}
