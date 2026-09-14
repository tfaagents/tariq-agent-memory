#!/usr/bin/env node
// The wall list. Every time the agent cannot do something because a connection, a site,
// a credential, a tool or an install is missing, it goes here, and Jaiah is pinged through
// the TFA dashboard (a WhatsApp DM to him). Things the agent built itself to get past a
// wall are logged here too, so Jaiah can harden them. Never a place for things the rules
// forbid (staff pay, passwords, money): those are answered, not requested.
//
//   node tools/requests.mjs add <kind> "<what Tariq asked>" "<what is missing>"
//        kind = connection | site | credential | tool | install | other | built | build
//        (built = "I got past it myself", and <what is missing> = what you built)
//        (build = Tariq's Build List: something he wants built; <what is missing> = what it
//         would do, one line. No ping to Jaiah, he pulls the list whenever.)
//   node tools/requests.mjs list [--open] [--build]
//   node tools/requests.mjs done <id> ["<note>"]
//
// State: work/requests.json (survives restarts), readable copies in work/requests.md (walls)
// and work/build-list.md (Tariq's Build List).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'work/requests.json');
const MD = path.join(ROOT, 'work/requests.md');
const BUILD_MD = path.join(ROOT, 'work/build-list.md');
const KINDS = ['connection', 'site', 'credential', 'tool', 'install', 'other', 'built', 'build'];
const TZ = 'Australia/Brisbane';
const stamp = () => new Date().toLocaleString('sv-SE', { timeZone: TZ }).replace(' ', 'T').slice(0, 16);
const load = () => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (_) { return { requests: [] }; } };
const save = (d) => { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(d, null, 2)); };
const one = (s, n = 300) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

const [cmd, ...rest] = process.argv.slice(2);
const d = load();

function ping(r) {
  const out = spawnSync(process.execPath, [path.join(ROOT, 'tools/tfa.mjs'), 'request', JSON.stringify(r)], { encoding: 'utf8', timeout: 20000 });
  const text = `${out.stdout || ''}${out.stderr || ''}`.trim();
  return { ok: out.status === 0, text: text.split('\n')[0] || '' };
}

switch (cmd) {
  case 'add': {
    const [kind, ask, missing] = rest;
    if (!KINDS.includes(kind) || !ask || !missing) { console.error(`usage: add <${KINDS.join('|')}> "<what he asked>" "<what is missing, or what you built>"`); process.exit(1); }
    const day = stamp().slice(0, 10).replace(/-/g, '');
    const n = d.requests.filter((r) => r.id.startsWith(`r-${day}-`)).length + 1;
    const r = { id: `r-${day}-${String(n).padStart(2, '0')}`, kind, ask: one(ask), missing: one(missing), status: kind === 'built' ? 'built' : kind === 'build' ? 'build' : 'open', opened: stamp(), closed: null, note: null, pinged: false };
    if (kind === 'build') {
      // Tariq's Build List: his own words, kept in order, never deduped away silently.
      const same = d.requests.find((x) => x.kind === 'build' && x.status === 'build' && x.ask.toLowerCase() === r.ask.toLowerCase());
      if (same) { console.log(`${same.id} is already on his build list (${same.opened})`); break; }
      const p = ping(r);
      r.pinged = p.ok;
      d.requests.unshift(r); d.requests = d.requests.slice(0, 200); save(d);
      if (!fs.existsSync(BUILD_MD)) fs.writeFileSync(BUILD_MD, "# Tariq's Build List\n\nWhat he has asked for, in his words, as he says it to his agent. Jaiah pulls this whenever.\n");
      fs.appendFileSync(BUILD_MD, `\n- ${r.opened.replace('T', ' ')} ${r.id}: ${r.ask}\n  What it would do: ${r.missing}\n`);
      console.log(`${r.id} on his build list${p.ok ? ', and on the dashboard' : ' (dashboard not reached, the file has it)'}.`);
      break;
    }
    const dup = d.requests.find((x) => x.status === 'open' && x.kind === r.kind && x.missing.toLowerCase() === r.missing.toLowerCase());
    if (dup) { console.log(`${dup.id} is already open for the same thing (${dup.opened}); nothing new sent, tell him it is on Jaiah's list`); break; }
    const p = ping(r);
    r.pinged = p.ok;
    d.requests.unshift(r); d.requests = d.requests.slice(0, 200); save(d);
    const line = `\n## ${r.opened.replace('T', ' ')} ${r.id} [${r.kind}]${r.status === 'built' ? ' built by the agent' : ''}\nAsked: ${r.ask}\n${r.kind === 'built' ? 'Built' : 'Missing'}: ${r.missing}\n${p.ok ? 'Jaiah pinged through the dashboard.' : `Ping did not go (${p.text || 'dashboard unreachable'}); Jaiah reads this file at the retro.`}\n`;
    fs.appendFileSync(MD, line);
    console.log(`${r.id} saved. ${p.ok ? 'Jaiah pinged.' : `Jaiah not pinged (${p.text || 'dashboard unreachable'}); it is on the list for the retro.`}`);
    break;
  }
  case 'list': {
    const open = rest.includes('--open');
    const build = rest.includes('--build');
    const rows = d.requests.filter((r) => build ? r.kind === 'build' : (!open || r.status === 'open') && r.kind !== 'build');
    if (!rows.length) { console.log(build ? 'his build list is empty' : open ? 'nothing open' : 'no requests'); break; }
    for (const r of rows) console.log(`${r.id} ${r.status.padEnd(5)} ${r.kind.padEnd(10)} ${r.opened}  ${r.ask}  |  ${r.missing}${r.note ? `  |  ${r.note}` : ''}`);
    break;
  }
  case 'done': {
    const r = d.requests.find((x) => x.id === rest[0]);
    if (!r) { console.error(`no request ${rest[0]}`); process.exit(1); }
    r.status = 'done'; r.closed = stamp(); r.note = one(rest.slice(1).join(' ')) || null; save(d);
    spawnSync(process.execPath, [path.join(ROOT, 'tools/tfa.mjs'), 'request-done', r.id], { encoding: 'utf8', timeout: 20000 });
    fs.appendFileSync(MD, `\n${r.closed.replace('T', ' ')} ${r.id} done${r.note ? `: ${r.note}` : ''}\n`);
    console.log(`${r.id} done`);
    break;
  }
  default:
    console.log('usage: add <kind> "<ask>" "<missing>" | list [--open|--build] | done <id> [note]');
    process.exit(cmd ? 1 : 0);
}
