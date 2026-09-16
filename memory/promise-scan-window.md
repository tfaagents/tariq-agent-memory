---
name: promise-scan-window
description: The promise scan silently loses older open promises: sentMail caps at 100 emails, so "14 days" reaches back about six, and save rewrites the whole list
metadata:
  type: project
---

`node tools/promises.mjs candidates 14` does not scan fourteen days of Tariq's sent mail.
`runner/lib/graph.mjs` `sentMail` takes `$top=100`, newest first, and he sends about a
hundred emails in six days. On 17 Sep 2026 the "14 day" list reached back only to 10 Sep.

`save` then rewrites `work/promises.json` from that window alone. A promise found by an
earlier scan, never done and never closed, simply disappears. It happened on 17 Sep: the
16 Sep scan's fifth promise, circling back to Grant at Stamford Capital on Dan St with the
QS report, DA and valuation, due 30 Sep, fell out of range and off the list.
`work/promise-closures.jsonl` did not exist, so nothing had been closed by hand.

**Why:** a promise that vanishes reads exactly like a promise that was kept, which is the
same class of lie as calling something LATE that he already did ([[brief-late-defect]]).
The list is what /brief, /close-out and /promises work from.

**How to apply:** after a scan, compare the kept promises against the previous
`sessions/scheduled/YYYY-MM-DD-promises-scan.md`. Anything in the old log that is not in
the new list and was not closed is still open: say so from the log, with its due date.
Do not patch `tools/` or `runner/` to fix it; they are Jaiah's. Filed as r-20260917-01
(page past the cap, and keep promises from earlier scans until done or settled).
