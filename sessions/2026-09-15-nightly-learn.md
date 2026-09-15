---
job: Scheduled nightly learn, Tariq not present, nothing needing approval
slug: nightly-learn
type: report
started: 2026-09-15T21:00
ended: 2026-09-15T21:18
outcome: done
skill: nightly-learn
---

## Asked
"/nightly-learn. Scheduled run, Tariq is not present. Do only what needs no approval.
Finish with a three-line summary."

## Did
Read, in the skill's order:
- `node tools/mail.mjs sent 1`: 20 emails sent today, 11:55am to 4:06pm. Opened the six
  with words of his own that carried new facts (Clay on folder structures, Tamara and
  Archie at MB Planning, Mitchell Brandtman, and both Dan Street threads to Annabelle).
  Skipped the forwards with no words of his own and the one-liners ("yes maam", "sweet bro").
- `node tools/mail.mjs diary 1`: tomorrow only, two overlapping Wednesday entries
  (9-11am Weekly Projects Update, Clay; 10am Weekly Project Meeting, Daniel), both at
  198 Springwood Rd. Nothing new to learn from it.
- `ls sessions/` and read all six logs dated today: two close-outs (09:40 and 10:14),
  bot-builds-list, capabilities, close-out-send, onedrive-access-audit, security-review,
  staff-pay-ask.
- `node tools/jobs.mjs list`: three jobs, all done, none failed or blocked.
- `work/build-list.md`: nothing added today. Newest entries are 14 Sep.
- `memory/rules.md`: no rule dated today, so nothing in `tariq.md` needed marking superseded.
- `raw/tfa-shared/`: not present, nothing to confirm against.
- `node tools/tone.mjs review --days 3`: "No drafts waiting for review." No EDITED pairs,
  so **`memory/voice.md` was not touched**, per the skill.

Then wrote to memory:
- **`memory/projects.md`** (+6,559 chars): a 15 Sep block on **7-9 Dan Street** (arrears
  close to $65,000; Annabelle's accountant building opening balances so two tenants can be
  invoiced; the council-towing and nuisance angle as fresh grounds for a breach notice;
  Marc has engaged a lawyer; Melody Wong now the QS on the initial report with the DA
  lodged but not stamped; Thomas Stubbs saying an ASSMP is probably not needed). Forvm @
  Hillcrest moving to a pretender meeting under Tenders. Master Builders QLD engaged on
  **Daniel Tu** under Employment and legal. A 15 Sep block under Money and compliance
  (QBCC annual reporting due 31 Dec 2026, licence 1188724; the Energex answer to Osman
  Insurance; the NAB statement to Heather). A new section, **Folder structures and saving
  formats**. And the **MB Planning HI1476** land deal with its full DD history under Other
  threads.
- **`memory/contacts.md`** (+1,501 chars): Krystal Stokman and **Melody Wong** at Mitchell
  Brandtman; **MB Planning** as a firm with Tamara Katai and Archie McPhie; **Thomas
  Stubbs** at HPC Planning; **Ross Bennett** at Geotech. Plus the correction below.
- **`memory/tariq.md`**: three lines under "Rules in his own words" - foundations before
  scale in his own words, taking the problem to the owner (Clay) rather than the people who
  broke it, and that he does not know where his own task list lives.
- **`memory/rules.md`**: one rule under Files, 15 Sep, on adhering to the agreed folder
  layout and naming templates.

No new memory files were created, so `memory/MEMORY.md` needed no new pointer.

## Why
Nothing was done on his behalf. No draft, no email, no file in OneDrive, no calendar entry,
no dashboard button, no Telegram message. The run was read-only outside `memory/`, as the
arguments asked. `voice.md` above the Corrections heading was not touched because that is
`/tone-profile`'s to rebuild, and there were no corrections to add below it.

## Checked
- **A memory error was found and corrected.** `contacts.md` and `projects.md` both recorded
  HPC Planning's planner as "**Murray Murphay**". His own email of 11 Aug 2026 signs as
  **Murray Wright**, murray.w@hpcplanning.com.au. The old name is struck through in place
  and dated 15 Sep 2026 rather than deleted, per step 5 of the skill.
- **Two different Murrays were deliberately not merged.** Tariq's 3:56pm email to Tamara
  ("sorry I spoke to Murray whilst you were away") reads like an MB Planning colleague, but
  `mail.mjs search "Murray"` returns no MB Planning address for one. Recorded as not
  established, with an explicit "do not merge the two".
- **The site behind invoice HI1476 is not named** anywhere in the thread, including the
  original 24 July invoice from ourhiro.io. Recorded as unknown rather than guessed at.
- The Mitchell Brandtman proposal says "24 Industrial Units, Slacks Creek" where memory had
  a 23 unit complex for Dan Street. Both are in the file with the discrepancy flagged.
- `node tools/settled.mjs --promises`: 7 promises checked, **0 that may honestly be called
  LATE**. None of today's promises appear in it yet.

## Left
- **Two things that look like promises he made today and are not in the tracker.** To
  Annabelle Weir and Michael Mayes, 1:03pm: "I may be able to attain something from council
  in regards to the tenant specifically and the nuisance they are causing." To Clay, 4:06pm:
  "I have put this on our catch up agenda later this week." `/promises-scan` should pick
  both up before the morning brief.
- Balls now in other people's courts, worth a chase if they go quiet: Melody Wong and
  Krystal on what MB need for the initial report; Freddie and Mohammed on confirming the
  nudge to the Dan Street owners; Desari Lynam on the Daniel Tu engagement paperwork;
  Kendal on the WildTrak cover form, which he said at 3:56pm he does not believe was sent.
- Still open from today's other logs and not for this run: his yes on loading the 43 bot
  build ideas onto the Build List, his word on writing the ten security gaps up for Jaiah,
  and yes or no on drafting Heather the pay ask.

## Links
- memory/projects.md, memory/contacts.md, memory/tariq.md, memory/rules.md
- Emails: "Folder Structures and Saving", "RE: Invoice HI1476 - TFA Constructions Pty Ltd",
  "RE: Mitchell Brandtman | Fee Proposal X45717 - 24 Industrial Units, Slacks Creek",
  "RE: 7-9 Dan St Land Acquisition [TM-MATTER.FID1063023]",
  "RE: FW: Urgent: Outstanding Handover Documentation - 7-9 Dan Street",
  "RE: FW: Forvm @ Hillcrest - 92-94 Johnson Road (D&C Tender)", "Daniel Tu",
  "RE: QBCC Licence - Annual Reporting Due 31 Dec 2026", "RE: PROP CHECK TFA CONSTRUCTION"
