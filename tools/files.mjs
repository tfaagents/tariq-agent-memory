#!/usr/bin/env node
// Tariq's OneDrive. Reading is free; put, move and attach are on the ask list (Approve on
// Telegram). Paths are OneDrive paths from the root, like "Tenders/Template.docx".
//
//   node tools/files.mjs list [folder]              what is in a folder (root by default)
//   node tools/files.mjs get <path> [--to <local>]  download to work/inbox/ (or --to)
//   node tools/files.mjs put <local> <path>         upload or replace (files up to 4 MB here)
//   node tools/files.mjs move <path> <folder>       move into another folder
//   node tools/files.mjs attach <last|draft-id> <path>   attach a OneDrive file to one of his drafts
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, OWNER, requireConnection, graph } from './lib/connected.mjs';

const [, , cmd, ...args] = process.argv;
const drive = (p) => `/users/${encodeURIComponent(OWNER)}/drive/root${p ? `:/${p.split('/').map(encodeURIComponent).join('/')}:` : ''}`;
const kb = (n) => `${Math.round((n || 0) / 1024)} KB`;
const MAX = 4 * 1024 * 1024;

try {
  if (cmd === 'list') {
    requireConnection('read', 'listing OneDrive'); const g = await graph();
    const d = await g.api(`${drive(args[0] || '')}/children?$select=name,size,folder,lastModifiedDateTime&$top=100`);
    const rows = d.value || [];
    if (!rows.length) console.log('Empty folder.');
    rows.forEach((r) => console.log(`${r.folder ? '[folder] ' : ''}${r.name}${r.folder ? ` (${r.folder.childCount} items)` : ` ${kb(r.size)}`}  ${(r.lastModifiedDateTime || '').slice(0, 10)}`));
  } else if (cmd === 'get') {
    const p = args[0]; if (!p) throw new Error('usage: get <path> [--to <local>]');
    requireConnection('read', 'downloading a file'); const g = await graph();
    const ti = args.indexOf('--to');
    const out = ti >= 0 ? args[ti + 1] : path.join(ROOT, 'work/inbox', path.basename(p));
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, await g.raw(`${drive(p)}/content`));
    console.log(`Saved to ${out}`);
  } else if (cmd === 'put') {
    const [local, p] = args; if (!local || !p) throw new Error('usage: put <local> <path>');
    const buf = fs.readFileSync(local); if (buf.length > MAX) throw new Error('over 4 MB; needs an upload session, ask Jaiah');
    requireConnection('read', 'writing to OneDrive'); const g = await graph();
    const r = await g.api(`${drive(p)}/content`, { method: 'PUT', body: buf, headers: { 'content-type': 'application/octet-stream' } });
    console.log(`Uploaded ${r.name} (${kb(r.size)}) to ${p}`);
  } else if (cmd === 'move') {
    const [p, folder] = args; if (!p || !folder) throw new Error('usage: move <path> <folder>');
    requireConnection('read', 'moving a file'); const g = await graph();
    const r = await g.api(drive(p), { method: 'PATCH', body: JSON.stringify({ parentReference: { path: `/drive/root:/${folder}` } }) });
    console.log(`Moved ${r.name} to ${folder}/`);
  } else if (cmd === 'attach') {
    const [ref, p] = args; if (!ref || !p) throw new Error('usage: attach <last|draft-id> <path>');
    requireConnection('read', 'attaching a file'); const g = await graph();
    const id = ref === 'last' ? JSON.parse(fs.readFileSync(path.join(ROOT, 'work/last-draft.json'), 'utf8')).id : ref;
    const buf = await g.raw(`${drive(p)}/content`); if (buf.length > 3 * 1024 * 1024) throw new Error('over 3 MB; share a OneDrive link in the draft instead');
    await g.api(`/users/${encodeURIComponent(OWNER)}/messages/${encodeURIComponent(id)}/attachments`, { method: 'POST', body: JSON.stringify({
      '@odata.type': '#microsoft.graph.fileAttachment', name: path.basename(p), contentBytes: buf.toString('base64'),
    }) });
    console.log(`Attached ${path.basename(p)} (${kb(buf.length)}) to the draft. Nothing sent.`);
  } else { console.log('usage: list [folder] | get <path> [--to <local>] | put <local> <path> | move <path> <folder> | attach <last|draft-id> <path>'); process.exit(1); }
} catch (e) { console.error(String(e.message || e)); process.exit(1); }
