---
slug: morning-send
when: Sunday 27 September 2026, 06:30 Brisbane
mode: scheduled, unattended, Tariq not present
---

## What was sent
The morning brief, `work/briefs/2026-09-27.txt`, 894 characters, pushed with
`node tools/notify.mjs --file work/briefs/2026-09-27.txt`. "sent to 1 chat". Nothing else left
the building, nothing needed his approval.

## What was read
- `node tools/calendar.mjs everyone 1`: his diary holds only "School Holidays - Out of Office"
  (Wed 23 Sept 12:00pm, still running). Nothing in the window for the other 33 mailboxes.
- `node tools/mail.mjs inbox 14`: one email, Clay from claywhart@gmail.com at 3:13am Sun 27 Sept,
  subject "Randal", to clay@ and tariq@, so it is his. One row filtered as noise (the OneDrive
  storage alert addressed to daniel@ and dan@) and left out, as always.
- `node tools/mail.mjs read 1` on Clay's email for the detail. Note: `read <n>` indexes the last
  listing printed, so the first `read 1` returned the top of `sent 2` instead. Re-ran `inbox 14`
  first, then `read 1`.
- `node tools/promises.mjs list`, `node tools/settled.mjs --promises`, `node tools/tfa.mjs waiting`.

## The promise scan, and why it was not re-saved
`promises.mjs list` said last scanned Sat 26 Sept 6:31am, 24 hours old, over /brief's 18 hour
line, so per step 3 a refresh was due. `candidates 14` returned **248** sent emails, newest
2026-09-25T13:12:19Z, oldest 2026-09-13T22:05:46Z. Of the 11 open promises only the Stamford
Capital one (10 Sep 02:44Z, due 30 Sep) is outside that window, and `mergeOpen` has carried it
since 25 Sep, so a save would have been safe.

`node tools/promises.mjs save work/promise-findings.json` with `[]` was **blocked by the auto
mode permission classifier** (Irreversible Local Destruction, on overwriting `work/promises.json`).
The list was therefore left as the 26 Sept scan. **Nothing was missed by that:** `mail.mjs sent 2`
shows his last sent email was Fri 25 Sept 11:12pm and nothing at all went out on 26 Sept, so no
promise could have been made since the scan. The findings would have been `[]` either way.
Filed for Jaiah as **r-20260927-01**, together with the underlying cause: `/promises-scan` is
weekdays only at 06:15 while `/morning-send` runs daily, so every weekend brief starts over the
freshness line.

## Promises: nothing could honestly be called late
`settled.mjs --promises` checked all 11 and returned **0 that may honestly be called LATE**.
- NOT DUE, left out of the note: CofC for 1-9 Anzac Ave to Hishaam (2 Oct), Reece on the Narangba
  extension (30 Sep), Collingwood Park to Alan Robertson (2 Oct), Stamford Capital to Grant Rex
  (30 Sep). The two falling due Wednesday were named in one closing clause only, not as late.
- STILL OPEN but **no due date**, so no LATE prefix: 29 Millers Rd to Elley, the $1,500 AF-TFA-0004
  deduction with Jaiah, Cole at Chateau on Forvm, Dan St funding feasibility to Veena, and the Ali
  Family Trust notice to Shane.
- THEY REPLIED: Heather's office wish list, she answered 17 Sept 3:00pm, so the ball is his. That is
  the line "Heather came back on the office wish list 17 Sept and it has sat ten days".
- YOU DID IT: Kendal's tender format price section, he sent it 18, 22 and 23 Sept. Left out rather
  than written as a chase, because the 26 Sept brief already recorded Clay, Veena and Randal doing
  the full Forvm review Friday afternoon, so it is moving and not waiting on him.

## Dashboard
`tfa.mjs waiting`: 11 invoice-split rows still ready, biggest Astro Klean $31,641.50 (23 Aug).
Same 11 as the 25 and 26 Sept briefs. Carried as one line, one tap each, no button pressed.

## What the brief said
First line: Clay's 3am plan for Randal, and the firm Logan Village finish date it asks of him and
Shane by Wednesday 30 Sept. Then his day (empty, still out of office, nobody else on). Then waiting
on him: the Randal plan and its pricing model (D&C baseline plus qualifications, 20 percent design
contingency and BA/TFA fees) and Randal's scope, the Wednesday finish date as the part that needs
him, Heather's wish list at ten days, the 11 dashboard rows, and the two promises falling due
Wednesday. No drafts, no offer, no closing line. Randal's own task list (Hilcrest demo quotes,
koala relocation, arborist; HiTech demo quotes) was cut to stay under 900 characters: it is
Randal's work, not his.

## Relied on
`memory/routine.md` for the out of office since 23 Sept and how he uses his calendar,
`memory/promise-scan-window.md` for the window and carry-forward discipline,
`.claude/skills/brief/SKILL.md` for the shape, and `work/briefs/2026-09-25.txt` and
`2026-09-26.txt` for the register.
