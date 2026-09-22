// Merging a fresh promise scan into the saved list. Pure, so `node --test` can prove it
// without Graph.
//
// Why: until 20 Sep 2026 `promises.mjs save` REPLACED work/promises.json with whatever the
// latest fourteen-day scan found. A promise made fifteen days ago, never done and never
// closed, simply vanished, and a promise that vanishes reads exactly like a promise that was
// kept (the Stamford Capital 30 Sep promise fell off on 16 Sep; Heather's work experience form
// on 18 Sep). Wall r-20260917-01. So `save` now keeps every previously open promise that the
// new scan did not return, until it is closed with `done`, or old enough that nobody can still
// be waiting on it.
const DAY = 864e5;

export const keyOf = (p, fingerprint) => `${p.id}|${fingerprint(p.promise)}`;

/** Old enough to stop carrying: 30 days past its due date, or 45 days after he made it when
 *  it never had one (three scan windows; long enough for /promises, the brief and the close-out
 *  to have shown it many times). */
export function expired(p, now = Date.now()) {
  if (p.due) return Date.parse(`${p.due}T23:59:59+10:00`) + 30 * DAY < now;
  return p.sentAt ? Date.parse(p.sentAt) + 45 * DAY < now : false;
}

/**
 * previous: the `open` array from the last saved file (any status).
 * fresh: this scan's promises, already marked open/done against the closures file.
 * Returns the list to save and how many were carried across from earlier scans.
 */
export function mergeOpen(previous, fresh, { fingerprint, isClosed = () => false, now = Date.now() } = {}) {
  const seen = new Set(fresh.map((p) => keyOf(p, fingerprint)));
  const carried = [];
  for (const p of previous || []) {
    if (p.status !== 'open') continue;
    const k = keyOf(p, fingerprint);
    if (seen.has(k)) continue;
    if (isClosed(p)) continue;
    if (expired(p, now)) continue;
    carried.push({ ...p, carried: (p.carried || 0) + 1 });
    seen.add(k);
  }
  return { open: [...fresh, ...carried], carried: carried.length };
}
