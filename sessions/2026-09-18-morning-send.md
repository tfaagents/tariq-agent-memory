---
job: Scheduled morning brief, pushed to his Telegram
slug: morning-send
type: report
started: 2026-09-18T06:30
ended: 2026-09-18T06:44
outcome: done
skill: morning-send
---

## Asked
Scheduled run, Tariq not present. Do only what needs no approval. Finish with a
three-line summary.

## Did
- `node tools/calendar.mjs everyone 1`: his two entries (9:30 Servos with Chris Fort,
  11:00 Jimboomba), plus Heather, Cheryl, Clay, Daniel and Mauricio.
- `node tools/promises.mjs list`: scanned 06:16 today, fresh, so no /promises-scan rerun.
- `node tools/settled.mjs --promises`: 3 checked, 0 LATE. Heather's office wish list and
  Kendal's Forvm tender both THEY REPLIED (ball his). Shane / Ali Family Trust STILL OPEN
  but no due date, so not late.
- `node tools/tfa.mjs waiting`: one row, Shane's Bunnings receipt 42.50, the yard.
- `node tools/mail.mjs inbox 14`: 25 emails, three needing him (Clay on Daniel's course,
  Accounts on the ABA files, Chris Wells on Reedy Creek).
- `node tools/requests.mjs list --open`: four open. Scribe seats and the tender template
  folder have been offered three mornings running (15, 16, 17 Sep) with no answer, so per
  the brief skill they were dropped from LOOSE ENDS for the retro to pick up.
- Wrote `work/briefs/2026-09-18.txt`, sent with `node tools/notify.mjs --file`.
- Then sent `work/briefs/2026-09-18-correction.txt`, see Why.

## Why
The brief printed "Nothing can honestly be called late this morning" and that was wrong.
Heather's promise to sign Teina Takimoana's work experience form, due 11 Sep, was on the
16 and 17 Sep boards as LATE and was never closed (`work/promise-closures.jsonl` still
does not exist). It is absent from today's list only because of the 100-message cap in
`memory/promise-scan-window.md`, whose rule is to carry forward anything in the previous
scan log that is not in the new list and was not closed. That check was run against
`sessions/scheduled/2026-09-17-promises-scan.md` only after the brief had gone, so a
correction was sent rather than left standing.
`settled.mjs --who ... --about "work experience"` returned YOU DID IT for it, which is the
second trap already recorded in `memory/brief-late-defect.md`: the 11 Sep 10:47am email it
counted as fulfilment is the email in which he made the promise. Not believed.
Nothing needed his tap: read-only tools and notify only.

## Checked
- Brief under 1,500 characters (1,149), no line over 80, no em dashes, no markdown.
- `notify.mjs` returned "sent to 1 chat" for both messages.
- Alee chase worded as a chase on him, not as Tariq's late promise, per
  `memory/brief-late-defect.md`.
- Grant Rex / Stamford Capital, due 30 Sep, left out as NOT DUE.

## Left
- The work experience form stays open until he says it is signed. Mail cannot settle it.
- Scribe seats (r-20260914-08) and the tender template folder (r-20260914-06) go to the
  retro, three mornings with no answer.
- The carry-forward check belongs before the brief is sent, not after. Added to
  `memory/promise-scan-window.md`.

## Links
- work/briefs/2026-09-18.txt
- work/briefs/2026-09-18-correction.txt
- sessions/scheduled/2026-09-18-0615-promises-scan.md
