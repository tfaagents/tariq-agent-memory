#!/usr/bin/env node
// OneDrive. Since 14 Sep 2026 (Jaiah) the scope is the whole of TFA: his entire OneDrive,
// and any staff member's with --user <address>. config/files.json still rules: allowedFolders
// ["*"] means the whole drive, a list of paths means only those; deniedNames are refused
// anywhere, in any drive, whatever the app's permission says. Reading is free; put, move and
// attach are on the ask list (Approve on Telegram). Paths are OneDrive paths from the root,
// like "TFA/Tenders/Template.docx". Add --user kendal@tfaconstructions.com.au to any command
// to work in her drive instead of his.
//
//   node tools/files.mjs folders                    the scope and the off-limits names
//   node tools/files.mjs list [folder]              what is in a folder (no folder = the drive root)
//   node tools/files.mjs get <path> [--to <local>]  download to work/inbox/ (or --to)
//   node tools/files.mjs put <local> <path>         upload or replace (up to 4 MB; refuses a blind overwrite)
//   node tools/files.mjs move <path> <folder>       move into another allowed folder
//   node tools/files.mjs attach <last|draft-id> <path>   attach a OneDrive file to one of his drafts
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, OWNER, requireConnection, graph } from './lib/connected.mjs';

const argv = process.argv.slice(2);
const ui = argv.findIndex((a) => a === '--user' || a === '--of');
const WHO = ui >= 0 ? String(argv.splice(ui, 2)[1] || '').toLowerCase() : OWNER;
if (!/^[^@\s]+@tfaconstructions\.com\.au$/i.test(WHO)) { console.log(`--user needs a TFA address, not "${WHO}"`); process.exit(3); }
const [cmd, ...args] = argv;
const whose = WHO === OWNER ? 'his' : `${WHO}'s`;
const drive = (p) => `/users/${encodeURIComponent(WHO)}/drive/root${p ? `:/${p.split('/').map(encodeURIComponent).join('/')}:` : ''}`;
const kb = (n) => `${Math.round((n || 0) / 1024)} KB`;
const MAX = 4 * 1024 * 1024;

// ---- the folder list ----
let CFG = { allowedFolders: [], deniedNames: [] };
try { CFG = { ...CFG, ...JSON.parse(fs.readFileSync(path.join(ROOT, 'config/files.json'), 'utf8')) }; } catch (_) {}
const norm = (p) => String(p || '').replace(/\\/g, '/').replace(/^\/+|\/+$/g, '').replace(/\/{2,}/g, '/');
const segs = (p) => norm(p).split('/').filter(Boolean);
const ALLOWED = (CFG.allowedFolders || []).map(norm).filter(Boolean);
const ALL = ALLOWED.includes('*');
const DENIED = new Set((CFG.deniedNames || []).map((s) => String(s).toLowerCase()));
const NOT_YET = 'No OneDrive folders are on the list yet. Tariq names the TFA folders he wants me in and Jaiah adds each one to config/files.json; until then nothing in his OneDrive is reachable.';

/** Is this OneDrive path inside a folder he has allowed, and free of denied names? */
function permitted(p) {
  const s = segs(p);
  if (s.some((x) => DENIED.has(x.toLowerCase()))) return { ok: false, why: `"${p}" is inside a folder he keeps off limits` };
  if (ALL) return { ok: true };
  if (!ALLOWED.length) return { ok: false, why: NOT_YET };
  const lower = s.map((x) => x.toLowerCase());
  const under = ALLOWED.some((a) => { const as = segs(a).map((x) => x.toLowerCase()); return as.length <= lower.length && as.every((x, i) => x === lower[i]); });
  return under ? { ok: true } : { ok: false, why: `"${p}" is not in a folder on his list (${ALLOWED.join(', ')}). If he wants it, it goes on Jaiah's list: node tools/requests.mjs add other "<his words>" "OneDrive folder <name> on the files list"` };
}
function mustPermit(p) { const r = permitted(p); if (!r.ok) { console.log(`Not allowed: ${r.why}`); process.exit(3); } }

// ---- the etag ledger ----
// WHY. `put` replaces a whole file. Tariq edits these same files himself, on his
// Desktop, and OneDrive syncs them; "Tariqs list of bot builds.docx" is one he says
// he keeps adding to. A blind PUT means whoever writes last wins and the other edit
// is gone with no error and nobody told. So every `get` records the version it
// downloaded, and `put` sends it back as if-match: if he touched the file in the
// meantime Graph refuses with 412 and we say so, instead of flattening his work.
const LEDGER = path.join(ROOT, 'work/onedrive-versions.json');
const ledgerKey = (who, p) => `${who}:${norm(p)}`;
function readLedger() { try { return JSON.parse(fs.readFileSync(LEDGER, 'utf8')); } catch (_) { return {}; } }
function rememberVersion(who, p, etag, local) {
  if (!etag) return;
  const all = readLedger();
  all[ledgerKey(who, p)] = { etag, local: local || null, at: new Date().toISOString() };
  fs.mkdirSync(path.dirname(LEDGER), { recursive: true });
  fs.writeFileSync(LEDGER, JSON.stringify(all, null, 2));
}
function knownVersion(who, p) { return readLedger()[ledgerKey(who, p)] || null; }

/** The item as OneDrive has it right now, or null when there is no such file. */
async function itemOrNull(g, p) {
  try { return await g.api(`${drive(p)}?$select=id,name,size,eTag,lastModifiedDateTime`); }
  catch (e) { if (e.status === 404) return null; throw e; }
}

try {
  if (cmd === 'folders') {
    if (ALL) console.log('Scope: the whole of TFA. His entire OneDrive, and any staff member\'s drive with --user <address> (node tools/people.mjs gives the address).');
    else if (!ALLOWED.length) console.log(NOT_YET);
    else { console.log('OneDrive folders on his list:'); ALLOWED.forEach((a) => console.log(`- ${a}`)); }
    if (DENIED.size) console.log(`Never, anywhere: ${[...DENIED].join(', ')}`);
  } else if (cmd === 'list') {
    if (!args[0] && !ALL) {
      if (!ALLOWED.length) { console.log(NOT_YET); process.exit(3); }
      console.log('Folders on his list (list <folder> to look inside):'); ALLOWED.forEach((a) => console.log(`[folder] ${a}`));
      process.exit(0);
    }
    if (args[0]) mustPermit(args[0]);
    requireConnection('read', 'listing OneDrive'); const g = await graph();
    const d = await g.api(`${drive(args[0])}/children?$select=name,size,folder,lastModifiedDateTime&$top=100`);
    console.log(`${whose} OneDrive${args[0] ? `, ${norm(args[0])}` : ' root'}:`);
    const rows = (d.value || []).filter((r) => !DENIED.has(String(r.name).toLowerCase()));
    if (!rows.length) console.log('Empty folder.');
    rows.forEach((r) => console.log(`${r.folder ? '[folder] ' : ''}${r.name}${r.folder ? ` (${r.folder.childCount} items)` : ` ${kb(r.size)}`}  ${(r.lastModifiedDateTime || '').slice(0, 10)}`));
  } else if (cmd === 'get') {
    const p = args[0]; if (!p) throw new Error('usage: get <path> [--to <local>]');
    mustPermit(p);
    requireConnection('read', 'downloading a file'); const g = await graph();
    const ti = args.indexOf('--to');
    const out = ti >= 0 ? args[ti + 1] : path.join(ROOT, 'work/inbox', path.basename(p));
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, await g.raw(`${drive(p)}/content`));
    // Record which version this copy came from, so a later `put` of the same path
    // can prove nobody edited it in between.
    const meta = await itemOrNull(g, p);
    rememberVersion(WHO, p, meta?.eTag, out);
    console.log(`Saved to ${out}`);
    if (meta?.lastModifiedDateTime) console.log(`That is the version last changed ${meta.lastModifiedDateTime.slice(0, 16).replace('T', ' ')}.`);
  } else if (cmd === 'put') {
    const force = args.includes('--force');
    const [local, p] = args.filter((a) => a !== '--force');
    if (!local || !p) throw new Error('usage: put <local> <path> [--force]');
    mustPermit(p);
    const buf = fs.readFileSync(local); if (buf.length > MAX) throw new Error('over 4 MB; needs an upload session, ask Jaiah');
    // 'read' names the APP, not the operation: Files.ReadWrite.All lives on the read
    // app ("Tariq Assistant"). There is no separate write app; the send app is mail only.
    requireConnection('read', 'writing to OneDrive'); const g = await graph();

    const existing = await itemOrNull(g, p);
    const known = knownVersion(WHO, p);
    const headers = { 'content-type': 'application/octet-stream' };
    if (existing && !force) {
      if (!known) {
        console.log(`Not allowed: "${p}" already exists and this agent never downloaded it, so there is no way to tell whether he has changed it since. Run "get ${p}" first, edit that copy, then put it back. To overwrite anyway: put <local> "${p}" --force`);
        process.exit(3);
      }
      headers['if-match'] = known.etag;
    }
    let r;
    try {
      r = await g.api(`${drive(p)}/content`, { method: 'PUT', body: buf, headers });
    } catch (e) {
      // 412 is the whole point of the guard: he edited it after we took our copy.
      if (e.status === 412) {
        console.log(`Stopped: "${p}" has changed in OneDrive since this copy was taken${known?.at ? ` (${known.at.slice(0, 16).replace('T', ' ')})` : ''}. His edit is still there and nothing was overwritten. Run "get ${p}" again, redo the change on the fresh copy, then put it back.`);
        process.exit(4);
      }
      throw e;
    }
    rememberVersion(WHO, p, r.eTag, local);
    console.log(`${existing ? 'Replaced' : 'Uploaded'} ${r.name} (${kb(r.size)}) at ${p}`);
  } else if (cmd === 'move') {
    const [p, folder] = args; if (!p || !folder) throw new Error('usage: move <path> <folder>');
    mustPermit(p); mustPermit(folder);
    requireConnection('read', 'moving a file'); const g = await graph();
    const r = await g.api(drive(p), { method: 'PATCH', body: JSON.stringify({ parentReference: { path: `/drive/root:/${norm(folder)}` } }) });
    console.log(`Moved ${r.name} to ${norm(folder)}/`);
  } else if (cmd === 'attach') {
    const [ref, p] = args; if (!ref || !p) throw new Error('usage: attach <last|draft-id> <path>');
    mustPermit(p);
    requireConnection('read', 'attaching a file'); const g = await graph();
    const id = ref === 'last' ? JSON.parse(fs.readFileSync(path.join(ROOT, 'work/last-draft.json'), 'utf8')).id : ref;
    const buf = await g.raw(`${drive(p)}/content`); if (buf.length > 3 * 1024 * 1024) throw new Error('over 3 MB; share a OneDrive link in the draft instead');
    await g.api(`/users/${encodeURIComponent(OWNER)}/messages/${encodeURIComponent(id)}/attachments`, { method: 'POST', body: JSON.stringify({
      '@odata.type': '#microsoft.graph.fileAttachment', name: path.basename(p), contentBytes: buf.toString('base64'),
    }) });
    console.log(`Attached ${path.basename(p)} (${kb(buf.length)}) to the draft. Nothing sent.`);
  } else { console.log('usage: folders | list [folder] | get <path> [--to <local>] | put <local> <path> [--force] | move <path> <folder> | attach <last|draft-id> <path>'); process.exit(1); }
} catch (e) { console.error(String(e.message || e)); process.exit(1); }
