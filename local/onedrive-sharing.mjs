#!/usr/bin/env node
// Who, other than Tariq, can reach the files in one of his OneDrive folders.
// Read only. Built 15 Sep 2026 for his question "who else has been in my Documents folder".
//
// It answers TWO of the three things he asked, and is honest that it cannot answer the third:
//   - who a file is SHARED with (Graph /permissions on each item)
//   - who last CHANGED a file (lastModifiedBy)
//   - who has VIEWED a file: NOT available. That lives in the Microsoft 365 audit log
//     (Purview), which needs AuditLog.Read.All; the "Tariq Assistant" app does not have it.
//
//   node local/onedrive-sharing.mjs [folder]      default: Documents
import { requireConnection, graph, OWNER, ROOT } from '../tools/lib/connected.mjs';
import fs from 'node:fs';
import path from 'node:path';

const folder = process.argv[2] || 'Documents';

// Same off-limits names as tools/files.mjs, read from the same config. Never bypass it.
let DENIED = new Set();
try {
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/files.json'), 'utf8'));
  DENIED = new Set((cfg.deniedNames || []).map((s) => String(s).toLowerCase()));
} catch (_) {}
if (folder.split('/').some((s) => DENIED.has(s.toLowerCase()))) {
  console.log(`Not allowed: "${folder}" is inside a folder he keeps off limits`);
  process.exit(3);
}

requireConnection('read', 'reading OneDrive sharing');
const { api } = await graph();
const enc = (p) => p.split('/').map(encodeURIComponent).join('/');
const me = OWNER.toLowerCase();

const listing = await api(`/users/${encodeURIComponent(OWNER)}/drive/root:/${enc(folder)}:/children?$top=200&$select=id,name,folder,size,lastModifiedDateTime,lastModifiedBy,shared`);
const items = listing.value || [];
console.log(`${folder}: ${items.length} items in his OneDrive\n`);

const shared = [];
const changedByOthers = [];
let flaggedShared = 0;

for (const it of items) {
  const by = it.lastModifiedBy?.user?.email || it.lastModifiedBy?.user?.displayName || '';
  if (by && !String(by).toLowerCase().includes(me) && !/tariq/i.test(by)) {
    changedByOthers.push(`${it.name}  last changed by ${by}  ${String(it.lastModifiedDateTime).slice(0, 10)}`);
  }
  if (it.shared) flaggedShared++;
  let perms = { value: [] };
  try { perms = await api(`/users/${encodeURIComponent(OWNER)}/drive/items/${it.id}/permissions`); } catch (e) { console.log(`  (could not read permissions on ${it.name}: ${e.message})`); continue; }
  for (const p of perms.value || []) {
    const who = p.grantedToV2?.user?.email || p.grantedToV2?.user?.displayName
      || (p.grantedToIdentitiesV2 || []).map((g) => g.user?.email || g.user?.displayName).filter(Boolean).join(', ')
      || (p.link ? `link (${p.link.scope}, ${p.link.type})` : p.roles?.join('/') || 'unknown');
    if (String(who).toLowerCase().includes(me)) continue;         // himself
    if (p.inheritedFrom && !p.link) continue;                      // inherited owner entry
    shared.push(`${it.name}  ->  ${who}  [${(p.roles || []).join(', ')}]`);
  }
}

console.log(`Graph "shared" flag set on: ${flaggedShared} of ${items.length} items\n`);
console.log(shared.length ? `SHARED WITH SOMEONE OTHER THAN HIM (${shared.length}):\n${shared.join('\n')}`
  : 'SHARED WITH SOMEONE OTHER THAN HIM: none. Every item carries only his own owner permission.');
console.log('');
console.log(changedByOthers.length ? `LAST CHANGED BY SOMEONE ELSE (${changedByOthers.length}):\n${changedByOthers.join('\n')}`
  : 'LAST CHANGED BY SOMEONE ELSE: none. Every item was last written by him.');
console.log('');
console.log('NOT ANSWERED HERE: who has opened or viewed these files. That is the Microsoft 365 audit log, which this app cannot read.');
