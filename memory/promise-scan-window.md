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

## 19 Sep: when the scan is stale, not saving is sometimes the right move

The 06:30 brief found the last scan 24 hours old, over /brief's 18 hour line, so the skill
said refresh. `candidates 14` came back with 100 messages reaching only to 15 Sep, and the
14 Sep Ali Family Trust promise, open and never closed, was outside that window. `save`
only takes indexes into the candidate list, so there is no way to carry an older promise
through it: running the refresh would have deleted a live promise to comply with a
freshness rule.

The scan was left alone and the new mail read by hand instead. Only one promise had been
made since (18 Sep, to Veena and Clay: "I will complete the funding feasibility submission
and contract" for Dan St), and it went into the brief and the session log rather than into
`work/promises.json`.

**How to apply:** before running `promises.mjs save`, check that every promise currently
open in `work/promises.json` has its source email inside the candidate window. If one does
not, do not save. Read the new sent mail by hand, carry any new promise in the brief and
the session log, and say in the log that the list was deliberately not rewritten. A stale
list that is complete beats a fresh list that is missing something. Until r-20260917-01 is
fixed this will keep happening: he sends about 100 emails in six days, so the window is
almost always shorter than the oldest open promise.

**19 Sep, the freeze is now a standing state, and Jaiah has it for the third day.** The
17:30 digest re-stated r-20260917-01 to Jaiah in its changed form: it has gone from "it
put a wrong brief on his phone" (18 Sep) to "the scan cannot be refreshed at all". So
until he pages past the cap, `work/promises.json` stays the 18 Sep scan on purpose.
Two promises are being carried by hand outside it, both from the session logs, not the
list: the 14 Sep Ali Family Trust one to Shane (in the file, would be deleted by a save)
and the 18 Sep Dan St one to Veena and Clay (never in the file at all). A brief or a
close-out that works only from `work/promises.json` will miss the second one.

**20 Sep: third morning frozen, and the brief handled it without a correction.** The scan
was 48 hours old at 06:30, over /brief's 18 hour line, and was again left alone: the 14 Sep
Ali Family Trust promise is still outside the candidate window. `mail.mjs sent 2` showed
nothing sent at all on Sat 19 Sep, so no promise was missed by not refreshing. Both hand
carried promises (Ali Family Trust to Shane, Dan St to Veena and Clay) went into the brief
from the session logs, and `settled.mjs --who` was run on the Dan St one on its own before
it was printed, per the sharpened rule above. No correction was needed this time.

**21 Sep: fourth frozen scan, and the window shrank again.** `candidates 14` reached back
only to 15 Sep 11:55am Brisbane, so the 14 Sep Ali Family Trust promise was outside it for
the third scan running and the list was again left alone. Of 100 sent emails only two
carried a promise and both were already known (i:46 Heather's office wish list, already
promise 1; i:13 the 18 Sep Dan St one to Veena and Clay, still hand carried and still not
in the file). Nothing was sent 19, 20 or early 21 Sep, so nothing was missed by not
refreshing. r-20260917-01's plan now reads fifth day blocking.

**The shape this has settled into:** the scan's useful output is no longer the save, it is
the window boundary and the carry-forward check. Read the oldest candidate timestamp off
the JSON, match every open promise in `work/promises.json` to its source date, and if one
falls outside, log it and stop. The brief then works from four promises, three in the file
and one only in the logs.

## 22 Sep: the cap appears to be lifted

At 06:35 `node tools/promises.mjs candidates 14` returned **258** sent emails, newest
21 Sep 4:43pm Brisbane, oldest **2026-09-07T21:56:48Z**. Every scan from 17 to 21 Sep got
exactly 100, reaching back about six days. Fourteen days now means fourteen days, so the
14 Sep Ali Family Trust promise to Shane, the one thing that has frozen the list for four
scans running, sits inside the window, and so does the 18 Sep Dan St one to Veena and Clay.
A save would no longer delete a live promise.

The list was still left frozen for the 06:30 brief: a first save after a four day freeze
belongs in /promises-scan with its full discipline, not in the brief, and the second half
of r-20260917-01 (save keeping earlier promises until done or settled, regardless of the
window) has not been confirmed. The request's plan was rewritten to say the cap looks
lifted and to ask Jaiah to confirm.

**How to apply:** read the oldest candidate timestamp every scan, do not assume either the
cap or the fix. When Jaiah confirms, the next /promises-scan can run `save` for the first
time since 18 Sep, and both hand-carried promises stop being hand-carried. Until then the
carry-forward comparison and `settled.mjs` on each hand-carried promise stay as they are.

Also on 22 Sep: the 06:15 promises-scan did not fire at all (no session log, and
`work/promises.json` still read the 18 Sep scan). The 06:30 brief caught it and did the
work by hand. Filed as r-20260922-01. A brief should not be what catches a dead schedule.
