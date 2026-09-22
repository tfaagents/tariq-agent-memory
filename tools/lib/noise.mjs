// Inbox noise: rows that look like his problem and are not (config/noise.json). Pure
// matching, so `node --test` can prove the OneDrive rule without Graph.
import fs from 'node:fs';
import path from 'node:path';

const low = (s) => String(s || '').toLowerCase();

export function loadNoise(root) {
  try { return JSON.parse(fs.readFileSync(path.join(root, 'config/noise.json'), 'utf8')).rules || []; }
  catch (_) { return []; }
}

/** The rule's `why` when a row matches one, else null. A rule with neither `from` nor
 *  `subject` never matches (a bare notTo would hide every copy). */
export function noiseReason(row, rules) {
  for (const r of rules || []) {
    if (!r.from && !r.subject) continue;
    if (r.from && !low(row.from).includes(low(r.from))) continue;
    if (r.subject && !low(row.subject).includes(low(r.subject))) continue;
    if (r.notTo) {
      const to = (row.to || []).map(low);
      if (!to.length || to.includes(low(r.notTo))) continue;
    }
    return r.why || 'matches a noise rule';
  }
  return null;
}
