#!/usr/bin/env node
// Mirror the capability log from Jaiah's CRM into memory/capabilities.md, the file the
// agent answers "what can you do" from. Runs on Jaiah's Mac, never on the mini.
//
//   node scripts/pull-capabilities.mjs            write memory/capabilities.md here
//   node scripts/pull-capabilities.mjs --ship     ... and put it on the mini, commit there
//   node scripts/pull-capabilities.mjs --from-json <file>   render from a JSON export instead
//
// Source of truth: table agent_capabilities on the TFA card (autoflow-crm migration 0029),
// read through the token function capabilities_info (0030) with the CRM's public anon key.
// Needs: autoflow-crm/.env.local (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
// and CRM_CAPABILITIES_TOKEN in this folder's .env (gitignored, never shipped). The token
// is a form_links row; delete the row in the CRM and this stops working, nothing else does.
//
// memory/ is excluded from scripts/ship.sh on purpose (the mini owns it), so --ship copies
// this one file with scp and commits on the mini, the same way any memory change travels.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'memory/capabilities.md');
const AGENT = 'tariq-agent';
const HOST = process.env.TARIQ_HOST || 'tfa-mini';
const args = process.argv.slice(2);
const ship = args.includes('--ship');
const fromJson = args.includes('--from-json') ? args[args.indexOf('--from-json') + 1] : null;

function envFile(p) {
  const out = {};
  try {
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch (_) { /* missing file: the caller reports which key is absent */ }
  return out;
}

async function fetchRows() {
  const crm = envFile(path.resolve(ROOT, '../../../autoflow-crm/.env.local'));
  const mine = envFile(path.join(ROOT, '.env'));
  const url = crm.NEXT_PUBLIC_SUPABASE_URL;
  const key = crm.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = mine.CRM_CAPABILITIES_TOKEN || process.env.CRM_CAPABILITIES_TOKEN;
  if (!url || !key) throw new Error('autoflow-crm/.env.local is missing NEXT_PUBLIC_SUPABASE_URL or the anon key');
  if (!token) throw new Error('CRM_CAPABILITIES_TOKEN is not set in tariq-agent/.env (the form_links row of kind capabilities on the TFA card)');
  const res = await fetch(`${url}/rest/v1/rpc/capabilities_info`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_token: token, p_agent: AGENT }),
  });
  if (!res.ok) throw new Error(`CRM answered ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  if (!data || !Array.isArray(data.capabilities)) throw new Error('token not recognised (no capabilities link on the card)');
  return { rows: data.capabilities, business: data.business_name, exportedAt: data.exported_at };
}

const STATUS = [
  ['live', 'Live: he can use these today'],
  ['built', 'Built, not switched on: the code is on the mini, waiting on something outside it'],
  ['parked', 'Parked: deliberately switched off'],
  ['planned', 'Planned: agreed, not started'],
];
const KIND = { channel: 'Channels', skill: 'Skills', tool: 'Tools', rule: 'Rules', connection: 'Connections', schedule: 'Schedules' };
const KIND_ORDER = ['channel', 'skill', 'tool', 'rule', 'connection', 'schedule'];
const day = (d) => (d ? new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Brisbane' }) : null);

function render({ rows, business, exportedAt }) {
  const lines = [];
  lines.push(`# What this agent can do (${rows.filter((r) => r.status === 'live').length} live of ${rows.length} logged)`);
  lines.push('');
  lines.push(`Mirrored from the Capabilities tab on the ${business || 'TFA Constructions'} card in Jaiah's CRM on ${day(exportedAt || Date.now())}.`);
  lines.push('That log is the truth about what is switched on; this file is a copy. Do not edit it here,');
  lines.push('tell Jaiah. Answer "what can you do" from the Live section, in his shape. Built and Parked');
  lines.push('are named only when he asks what is coming, always with what they are waiting on.');
  for (const [status, heading] of STATUS) {
    const group = rows.filter((r) => r.status === status);
    if (group.length === 0) continue;
    lines.push('', `## ${heading}`);
    for (const kind of KIND_ORDER) {
      const items = group.filter((r) => r.kind === kind).sort((a, b) => a.name.localeCompare(b.name));
      if (items.length === 0) continue;
      lines.push('', `### ${KIND[kind] || kind}`);
      for (const r of items) {
        const bits = [`**${r.name}**`];
        if (r.description) bits.push(r.description.trim().replace(/\.$/, '') + '.');
        if (r.how_to_use) bits.push(`He says: ${r.how_to_use}`);
        if (status !== 'live' && r.depends_on) bits.push(`Waiting on: ${r.depends_on}`);
        const tail = [];
        if (status === 'live' && r.went_live_at) tail.push(`live ${day(r.went_live_at)}`);
        if (status === 'live' && !r.verified) tail.push('not yet seen working');
        lines.push(`- ${bits.join(' ')}${tail.length ? ` (${tail.join(', ')})` : ''}`);
      }
    }
  }
  lines.push('', `Generated by scripts/pull-capabilities.mjs on ${new Date().toISOString().slice(0, 10)}.`);
  return lines.join('\n') + '\n';
}

const data = fromJson
  ? { rows: JSON.parse(fs.readFileSync(path.resolve(fromJson), 'utf8')).filter((r) => r.agent === AGENT), business: 'TFA Constructions', exportedAt: null }
  : await fetchRows();
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, render(data));
console.log(`wrote ${path.relative(ROOT, OUT)}: ${data.rows.length} rows, ${data.rows.filter((r) => r.status === 'live').length} live${fromJson ? ' (from JSON, not the CRM)' : ''}`);

if (ship) {
  const scp = spawnSync('scp', ['-q', OUT, `${HOST}:tariq-agent/memory/capabilities.md`], { encoding: 'utf8', timeout: 30000 });
  if (scp.status !== 0) { console.error(`scp failed: ${(scp.stderr || '').trim()} (is the Mac on the Tailscale profile that sees ${HOST}?)`); process.exit(1); }
  const commit = spawnSync('ssh', [HOST, 'cd tariq-agent && git add memory/capabilities.md && (git diff --cached --quiet || git commit -q -m "capabilities: mirror from CRM $(date +%F)") && git log --oneline -1'], { encoding: 'utf8', timeout: 30000 });
  console.log(commit.status === 0 ? `on the mini: ${commit.stdout.trim()}` : `on the mini but not committed: ${(commit.stderr || '').trim()}`);
}
