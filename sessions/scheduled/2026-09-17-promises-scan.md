---
job: Scheduled scan of Tariq's sent mail for promises he made
slug: promises-scan
type: report
started: 2026-09-17T06:15
ended: 2026-09-17T06:22
outcome: done
skill: promises-scan
---

## Asked
Scheduled run before the morning brief, Tariq not present. Do only what needs no approval.
Read what he has sent and pull out the commitments he made, so /promises, the brief and
the close-out have a list to work from.

## Did
- `node tools/promises.mjs candidates 14` returned 100 sent emails as JSON (indices 0-99),
  the newest 2026-09-16 19:55, the oldest 2026-09-10 21:20. Nothing else was opened.
- Judged each against the skill's rules and kept two.
- Wrote `work/promise-findings.json`, ran `node tools/promises.mjs save
  work/promise-findings.json`, which rebuilt `work/promises.json` with the real subjects,
  dates and links attached.

The two kept:
- i=54 Ask Shane whether the Ali Family Trust loan needs anything their end (to accounts,
  no date, high). His words: "I'll ask shane, don't think its needed their end."
- i=97 Come and sign the Teina Takimoana work experience paperwork (to Heather, due
  11 Sep, high). His words: "Yes, I'll come sign shortly."

## Why
Precision over recall, per the skill. The ninety-eight left out group into a few kinds:
calendar accepts and bare FW/FYI forwards carry nothing; asking someone else to do a thing
("just confirm with clay", "please proceed with payment", "could you please advise") is
their commitment, not his; explanations of fact to Tamara, Archie, Mahmood and Heather are
not promises; and "see attached" is done, not promised.

Two deliberate calls worth naming:
- i=89 and i=90, "bro why don't you download docs? I'll resend later today" to Alee and
  Abhinav on 11 Sep. Yesterday's scan kept both. They are left out today because the same
  candidate list shows he resent them six minutes later: i=85 and i=88 are the OneDrive
  folder shares at 01:28, and i=86, i=87 name the two folders. Keeping them would repeat
  the 15 Sep defect in memory/brief-late-defect.md, where he was told he was LATE on
  documents he had already sent.
- i=2, "I'll be picking you up today inshallah" to his son, is a real promise but personal,
  time-bound to yesterday and nothing the brief can act on. Left out on purpose.

Nothing was called late. `tools/settled.mjs --promises` is what tests these against his
sent folder, and the brief runs it.

## Checked
- `node tools/promises.mjs list` reads back both entries with the right recipients,
  subjects and links.
- Read `tools/promises.mjs` save and `runner/lib/graph.mjs` sentMail to confirm why
  yesterday's fifth promise is no longer on the list (see Left).
- `work/promise-closures.jsonl` does not exist, so nothing has ever been closed by hand:
  the drop is the cap, not a closure.

## Left
Yesterday's scan kept a fifth promise, circling back to Grant at Stamford Capital on Dan
St with the QS report, DA and valuation, due 30 Sep. It is gone from today's list, and
that is a defect, not progress: `graph.mjs sentMail` takes the newest 100 messages, and he
sends about 100 in six days, so "14 days" really reached back to 10 Sep. `save` then
rewrites `work/promises.json` from that window alone, so an older open promise disappears
without being done. Filed for Jaiah as r-20260917-01 with a plan (page past the cap; keep
promises from earlier scans until closed). tools/ and runner/ are his, so this agent does
not patch it. Until then the Stamford Capital promise is in yesterday's log,
sessions/scheduled/2026-09-16-promises-scan.md, and due 30 Sep.

## Links
- work/promise-findings.json, work/promises.json, work/promise-candidates.json
- sessions/scheduled/2026-09-16-promises-scan.md
- memory/brief-late-defect.md
