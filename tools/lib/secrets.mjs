// Credentials for the browser lane. They live in a chmod 600 file in this user's HOME,
// never in the repo, never in memory/, never in a session log, never in argv.
//
// The model never sees a value: nothing here prints one, tools/secrets.mjs has no `get`
// command, and tools/browser.mjs takes the KEY and types the value straight into the page.
// Tariq's own roadmap asks for exactly this ("never store passwords in notes or memory"),
// and 1Password or Bitwarden CLI is the intended replacement for this file later: swap the
// body of get() and nothing else changes.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const STORE = process.env.TARIQ_SECRETS || path.join(os.homedir(), '.tariq-agent', 'secrets.json');

function load() {
  let raw;
  try { raw = fs.readFileSync(STORE, 'utf8'); }
  catch (e) {
    if (e.code === 'ENOENT') return {};
    throw new Error(`cannot read the credential store at ${STORE}: ${e.code}`);
  }
  const st = fs.statSync(STORE);
  if (st.mode & 0o077) throw new Error(`${STORE} is readable by other users. chmod 600 it before using it.`);
  try { return JSON.parse(raw); } catch (_) { throw new Error(`${STORE} is not valid JSON`); }
}

/** Key names only. Never values. Safe to print. */
export function keys() {
  const d = load();
  return Object.keys(d).flatMap((site) => Object.keys(d[site] || {}).map((f) => `${site}.${f}`)).sort();
}

/** "<site>.<field>" -> the value. Callers must never print or log what comes back. */
export function get(key) {
  const [site, field] = String(key).split('.');
  if (!site || !field) throw new Error('a key looks like "<site>.<field>", e.g. cardportal.password');
  const v = load()?.[site]?.[field];
  if (v === undefined) throw new Error(`no credential ${key}. Known keys: ${keys().join(', ') || 'none yet'}`);
  return String(v);
}

export function put(site, field, value) {
  const d = load();
  d[site] = d[site] || {};
  d[site][field] = value;
  fs.mkdirSync(path.dirname(STORE), { recursive: true });
  fs.writeFileSync(STORE, JSON.stringify(d, null, 2), { mode: 0o600 });
  fs.chmodSync(STORE, 0o600);
}

export function drop(site, field) {
  const d = load();
  if (!d[site]) return false;
  if (field) { if (!(field in d[site])) return false; delete d[site][field]; if (!Object.keys(d[site]).length) delete d[site]; }
  else delete d[site];
  fs.writeFileSync(STORE, JSON.stringify(d, null, 2), { mode: 0o600 });
  return true;
}
