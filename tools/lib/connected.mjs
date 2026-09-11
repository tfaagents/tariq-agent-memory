// Is Microsoft 365 connected on this machine, and which app? Every tool that talks to
// Graph asks this FIRST, so the answer when it is not is one plain line instead of a
// stack trace. "read" = the Tariq Assistant app (mail, calendar, files); "send" = the
// Tariq Assistant Send app (Mail.Send on tariq@ only). Plan: config/connections.json.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const OWNER = process.env.TARIQ_MAILBOX || 'tariq@tfaconstructions.com.au';
const expand = (p) => String(p || '').replace(/^~/, os.homedir());

export function connection(which = 'read') {
  let cfg;
  try { cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/connections.json'), 'utf8'))['m365-graph']; }
  catch (_) { return { ok: false, why: 'the Microsoft 365 connection config (config/connections.json) is not on this machine' }; }
  const send = which === 'send';
  const id = send ? cfg.sendClientId : cfg.clientId;
  const keyPath = expand(send ? cfg.sendKeyPath : cfg.keyPath);
  const certPath = expand(send ? cfg.sendCertPath : cfg.certPath);
  if (!id || /to confirm/i.test(id)) return { ok: false, cfg, why: `the "${send ? 'Tariq Assistant Send' : 'Tariq Assistant'}" app is not registered in Entra yet` };
  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) return { ok: false, cfg, why: `its certificate is not at ${keyPath}` };
  return { ok: true, cfg, app: { clientId: id, keyPath, certPath } };
}

/** Print the one-line answer and exit 2 when not connected; return the connection otherwise. */
export function requireConnection(which, doing) {
  const c = connection(which);
  if (c.ok) return c;
  console.log(`Not connected yet: ${doing} needs ${c.why}. Tell Tariq in one line that Jaiah has not connected this part yet, and offer what you can do instead (a draft in a file, a note in memory). Jaiah: the permission plan is in config/connections.json.`);
  process.exit(2);
}

/** The vendored Graph helper, imported only after the connection check passed. */
export async function graph() { return import(path.join(ROOT, 'runner/lib/graph.mjs')); }
