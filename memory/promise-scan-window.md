---
name: promise-scan-window
description: "How the promise scan works as at 2 Oct 2026 (whole fortnight read, mergeOpen carries open promises), the live rules for running it, and the open faults r-20260923-01, r-20261002-01 (near-duplicate carried promises) and r-20260927-01 (weekday-only scan, stale weekend briefs)"
metadata:
  node_type: memory
  type: project
  originSessionId: 92012670-eaa2-4ca6-a160-cb53ca56a9be
  modified: 2026-10-02T06:03:46.571Z
---

## How the scan works today (seen 2 Oct 2026)

- `node tools/promises.mjs candidates 14` reads the whole fortnight of his sent mail.
  `runner/lib/graph.mjs` `sentMail` pages (`max: 1000`); the old cap of 100 emails is gone
  (fixed 22 Sep, seen 23 Sep). Recent windows: 290 emails (23 Sep), 295 (24 Sep), 272
  (25 Sep), 248 (28 Sep), 224 (29 Sep), 231 (1 Oct), 269 (2 Oct, 18 Sep to 1 Oct).
- `save` runs through `tools/lib/promises-merge.mjs` `mergeOpen`: every previously open
  promise the new scan did not return is carried forward until `done` closes it or it
  expires (30 days past due, 45 days without a due date) (seen 23 Sep 2026).
- Proven 25 Sep 2026: the Stamford Capital promise (sent 10 Sep, due 30 Sep) sat outside
  the window and was carried anyway (`carried: 1`).
- 2 Oct 2026: 25 open, 5 new, 20 carried, 3 past their date (settled.mjs not yet run).
- Schedule: `/promises-scan` 06:15 weekdays only; `/morning-send` 06:30 daily (seen 2 Oct
  2026). The scheduled 06:15 scan saves `work/promises.json` fine (seen 28 Sep and 2 Oct).
- `work/promises.json` is git-ignored, so a save is not in the commit (seen 2 Oct 2026).
- `tools/` and `runner/` are Jaiah's. Never patch them to fix the scan; file a request.

## Live rules for running the scan

1. Report only promises NOT already in `work/promises.json`. Put nothing in
   `work/promise-findings.json` that is already on the list; let `mergeOpen` carry the rest
   untouched. No index to get wrong, no wording to re-fingerprint, so no new duplicate row
   (seen 25 Sep 2026).
2. Read the oldest candidate timestamp every scan and match each open promise to its source
   date before saving. Do not assume the window or the fix. One command, and it is what
   stopped four bad saves 18 to 21 Sep (seen 23 Sep 2026).
3. Never carry an index across scans: the list grows and every index shifts. If a promise
   already on the list must be cited, find today's index from its `sentAt` and `subject`,
   read that email's preview and confirm the promise is in it (seen 24 Sep 2026). If
   re-saving one, copy its wording from `promises.mjs list` verbatim (seen 23 Sep 2026).
4. A duplicate row: never `promises.mjs done` it. `isClosed` falls through to a
   `startsWith(<id>|)` prefix match when that email carries one promise, so closing the
   duplicate closes the real one on the next scan, logged `by: tariq` for something he never
   did. Fix it by hand in `work/promises.json` (`work/` is this lane's) (seen 23 Sep 2026).
   In the brief, count a near-duplicate pair once (seen 2 Oct 2026).
5. A vanished promise reads exactly like a kept one. Anything in the previous scan's log,
   absent from the new list and not in `work/promise-closures.jsonl`, is still open and
   carries its original due date. With `mergeOpen` this check should now find nothing, but
   it stays step 3 of /brief, before the message is written (seen 23 Sep 2026).
6. Nothing is called LATE by the scan. `settled.mjs --promises` decides. A promise that
   skipped that check (carried by hand, restored from a log) gets `settled.mjs --who
   <address> --since <promise date> --about "<words>"` on its own before it is printed LATE.
   "It cannot be proven either way" is a reason to run the check, not to call it late
   (seen 18 Sep 2026). See [[brief-late-defect]].
7. Weekend (Saturday or Sunday brief): the list is 24 or 48 hours old by design. Do the
   window read, then `mail.mjs sent 2`. If nothing was sent since the scan's `at`, the list
   is complete, findings are `[]`, no save is needed; say so in the log and build the brief
   from the existing list. A stale timestamp is never a reason to force a rewrite, and
   `settled.mjs --promises` still runs before any "nothing is late" line (seen 27 Sep 2026).
8. If a save ever would delete a live promise (a window shorter than the oldest open
   promise), do not save: read the new sent mail by hand and carry new promises in the
   brief and the log. A stale list that is complete beats a fresh one missing something
   (seen 19 Sep 2026; not needed since 23 Sep).

## Live faults (as at 2 Oct 2026, from `node tools/requests.mjs list`)

- **r-20260923-01, open: one promise carried as two rows.** `mergeOpen` keys a carried
  promise on `id|fingerprint(promise)`, the wording and the message id, not the thread.
  Reworded, or cited from another email in the same thread, it comes back twice. Hit 23 Sep
  (Kendal's Forvm tender format) and 24 Sep (same promise, cited from the 17 Sep 8:45am
  reply in the thread instead of the 11:05am email). Ask: key on `conversationId` plus the
  promise, keeping the newest wording and the earliest `sentAt`. Never `conversationId`
  alone: the Forvm @ Hillcrest thread holds two real promises to two people ("come back to
  Cole at Chateau" and "enter the price section into Kendal's tender format") (seen 25 Sep).
- **r-20261002-01, open: 6 promises doubled on 2 Oct.** Near-duplicate pairs on the carried
  list: Reece/Narangba, Cole/Forvm, Alan/Collingwood, Hishaam/CofC, Jaiah/AF-TFA-0004, Dan St
  feasibility. Plan: dedupe carried items by `conversationId` and recipient (seen 2 Oct 2026).
- **r-20260927-01, open: the weekend brief runs on a stale scan.** `/promises-scan` is
  weekdays only, `/morning-send` daily, so Saturday's brief is about 24 hours stale and
  Sunday's about 48. Inside the Sunday 27 Sep `/morning-send`, `promises.mjs save` (with
  `[]`) was refused by the auto mode permission classifier (Irreversible Local Destruction,
  overwriting `work/promises.json`); nothing was lost. Narrowed 28 Sep: the 06:15 scans save
  fine, so the write is not blocked in general. Ask: make `/promises-scan` daily (seen 28 Sep).
- **r-20260922-01, open: the 06:15 scan did not fire on Tue 22 Sep** (no log, list still
  18 Sep). The 06:30 brief caught it by hand; a brief should not be what catches a dead
  schedule. The 17:30 digest missed that day too (seen 22 Sep 2026).
- **r-20260917-01, open pending close:** the cap and the carry-forward are both in the code;
  its plan now reads "close it, subject to r-20260923-01" (seen 25 Sep 2026).

## Why the rules exist (one line each; full log in work/retro/2026-10-02/archive-parts/)

- 17 Sep: a 100-email cap and a save that rewrote the list dropped the Stamford Capital
  promise (Grant, Dan St QS report, DA and valuation, due 30 Sep). Rules 2 and 5.
- 18 Sep: Heather's work experience form fell off the list and the 06:30 brief said
  "Nothing can honestly be called late this morning"; corrected at 06:44. Rule 5.
- 18 Sep: the 06:44 correction then called that form LATE without a check; `settled.mjs
  --who` showed he replied 11 Sep 10:47am and the placement started 14 Sep. Retracted. Rule 6.
- 19 to 22 Sep: four scans left unsaved because a save would have deleted the 14 Sep Ali
  Family Trust promise to Shane; two promises carried by hand. Rule 8.
- 23 and 24 Sep: the Forvm duplicate, the second time from an index that had shifted
  between scans. Rules 1, 3 and 4.
- 27 Sep: Sunday brief, scan 24 hours old, save refused by the classifier, nothing sent
  26 Sep so nothing missed. Rule 7.
