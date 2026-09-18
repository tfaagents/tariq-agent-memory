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

## 18 Sep: it bit the brief, and the check ran too late

The 06:16 scan kept three promises, all from 13-17 Sep. Heather's work experience form
(due 11 Sep, LATE on the 16 and 17 Sep boards, never closed) was gone. `settled.mjs
--promises` can only check what is on the list, so it reported "0 of them may honestly be
called LATE", and the 06:30 brief printed "Nothing can honestly be called late this
morning". A correction had to follow at 06:44.

**How to apply, sharpened:** the carry-forward comparison against the previous
`sessions/scheduled/*-promises-scan.md` is step 3 of /brief, before the message is
written, not a check afterwards. Anything in the old log, absent from the new list and not
in `work/promise-closures.jsonl`, is still open and carries its original due date.

## 18 Sep, the other half: carry it forward, then still check it

The 06:44 correction carried Heather's work experience form back on and called it LATE,
due 11 Sep, "seven days on", on the grounds that a signature cannot be proven from mail.
At the close-out `node tools/settled.mjs --who heather@tfaconstructions.com.au --since
2026-09-11 --about "Teina Takimoana work experience form"` returned **YOU DID IT**: he
replied on that exact thread on 11 Sep at 10:47am, twenty minutes after Heather wrote it,
and the placement started on Monday 14 Sep (Clay forwarded it to Daniel that morning).
It was never late. The close-out retracted it.

**How to apply:** a promise restored by the carry-forward comparison has skipped the
fulfilment check, because `settled.mjs --promises` only sees what is on the list. Before
it is printed LATE, run `settled.mjs --who <address> --since <promise date> --about
"<words>"` on it on its own. "It cannot be proven either way" is not a reason to call it
late; it is a reason to run the check. Over-correcting after [[brief-late-defect]] spends
LATE just as cheaply as the original mistake did.
