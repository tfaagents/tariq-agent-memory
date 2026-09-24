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

## 23 Sep: the freeze is over, and a new, smaller version of the same bug

`candidates 14` returned **290** emails, 8 Sep to 22 Sep. Both halves of r-20260917-01 are
in the code: `graph.mjs sentMail` pages (`max: 1000`), and `tools/lib/promises-merge.mjs`
`mergeOpen` keeps every previously open promise the new scan did not return, until `done`
closes it or it expires (30 days past due, 45 days without one). Every open promise was
inside the window, so **`save` ran for the first time since 18 Sep**. Six promises on the
list, and the two that had been carried by hand for days are now in the file: the 18 Sep
Dan St funding feasibility one to Veena and Clay, and the Stamford Capital 30 Sep one that
fell off on 16 Sep and started this whole memory.

**The scan's useful output is the save again.** The carry-forward comparison against the
previous `sessions/scheduled/*-promises-scan.md` is now a check that should find nothing,
not the thing holding the list together. Still read the oldest candidate timestamp every
scan and still match each open promise to its source date before saving: the rule costs
one command and is what stopped four bad saves.

**The new bug, r-20260923-01.** `mergeOpen` keys a carried promise on
`id|fingerprint(promise)`, the wording, not the email. Rewording a promise from the same
email on a later scan carries the old wording across as a duplicate. It happened here: the
Kendal Forvm tender promise appeared twice.

**How to apply:** when re-saving a promise that is already on the list, copy its wording
from `promises.mjs list` verbatim. If a duplicate does appear, **do not run
`promises.mjs done` on it.** `isClosed` falls through to a `startsWith(<id>|)` prefix match
whenever that email carries only one promise, so closing the duplicate closes the real one
on the next scan, and the closure is logged `by: tariq` for something he never did.
Edit `work/promises.json` by hand: `work/` is this lane's to write, `tools/` is Jaiah's.

## 24 Sep: the duplicate is keyed on the message, not the wording, and yesterday's index lied

`candidates 14` returned **295** emails, 9 Sep 21:47Z to 23 Sep 12:33Z, whole fortnight,
third scan running. All six open promises were inside it, so the save was safe. Seven
promises now: the six carried, plus one new (23 Sep, Cole at Chateau, Forvm @ Hillcrest
D&C tender, "Will be in touch", no date).

**r-20260923-01 fired again and the 23 Sep workaround did not cover it.** The wording was
copied verbatim from `promises.mjs list` and Kendal's tender-format promise still came back
twice. The key is the message: the promise is in the 17 Sep 11:05am email
(`2026-09-17T01:05:45Z`), and I cited the 17 Sep 8:45am reply in the same thread
(`2026-09-17T22:45:54Z`, body "modnya") because **yesterday's log said i:114 and the list
had grown from 290 to 295, so every index had shifted.** Two ids, one promise, two rows;
both rows share a `conversationId`.

**How to apply:** never carry an index across scans. Match a promise already in
`work/promises.json` by its `sentAt` and `subject`, find today's index from those, then
read that email's preview and confirm the promise is actually in it before writing the
index down. Fix a duplicate by hand in `work/promises.json` as before, never with
`promises.mjs done`. r-20260923-01 now asks Jaiah to key the carry-forward on
`conversationId` plus the promise, keeping the newest wording and the earliest `sentAt`.

Also: the Stamford Capital promise (10 Sep 02:44Z, due 30 Sep) is about seven hours inside
today's boundary and falls out of the fourteen day window tomorrow. From the next scan on it
exists only because `mergeOpen` carries it. Worth watching that it actually does.

## 25 Sep: the Stamford promise fell out of the window and `mergeOpen` held it

`candidates 14` returned **272** emails, oldest `2026-09-10T21:10:01Z`. The Stamford Capital
promise (`2026-09-10T02:44:51Z`, due 30 Sep) was **outside** it, exactly as the 24 Sep note
predicted. `save` carried it anyway (`carried: 1`). This is the first time the carry-forward
has been load bearing since it was written, and it worked. Eleven open promises now, four new,
seven carried.

**The way to stop r-20260923-01 firing is to report only new promises.** Put nothing in
`work/promise-findings.json` that is already in `work/promises.json`; let `mergeOpen` carry the
rest untouched. No index to get wrong, no wording to re-fingerprint, so no duplicate row. The
23 Sep advice (copy the wording verbatim) and the 24 Sep advice (match by `sentAt` and subject,
never by index) are only needed for the case this avoids. The bug is still in the code.

**One thing to tell Jaiah before r-20260923-01 is keyed on `conversationId`:** two legitimate
promises can share one. The Forvm @ Hillcrest thread holds both "come back to Cole at Chateau"
and "enter the price section into Kendal's tender format", two people, two deliverables, one
conversation. `conversationId` plus the promise is safe; `conversationId` alone would collapse
them.
