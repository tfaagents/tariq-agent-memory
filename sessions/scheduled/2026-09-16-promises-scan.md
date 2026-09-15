---
job: Scheduled scan of Tariq's sent mail for promises he made
slug: promises-scan
type: report
started: 2026-09-16T06:15
ended: 2026-09-16T06:19
outcome: done
skill: promises-scan
---

## Asked
Scheduled run before the morning brief, Tariq not present. Read what he has sent in the
last fourteen days and pull out the commitments he made, so /promises, the brief and the
close-out have a list to work from.

## Did
- `node tools/promises.mjs candidates 14` returned 100 sent emails as JSON (indices 0-99).
- Judged each against the skill's rules. Nothing else was opened; no mailbox was read
  beyond that list.
- Wrote five entries to `work/promise-findings.json` and ran
  `node tools/promises.mjs save work/promise-findings.json`, which wrote
  `work/promises.json` with the real subjects, dates and links attached.

The five kept:
- i=34 Ask Shane about the Ali Family Trust interest rate notice (no date, high)
- i=69 Resend the Narangba documents to Alee (due 11 Sep, high)
- i=70 Resend the Bokarina documents to Abhinav (due 11 Sep, high)
- i=77 Come and sign the work experience paperwork for Heather (due 11 Sep, high)
- i=99 Circle back to Grant at Stamford Capital on Dan St with the QS report, DA and
  valuation (due 30 Sep, medium)

## Why
Precision over recall, per the skill. Ninety-five of the hundred were left out on purpose
and the reasons group into a few kinds: calendar accepts and bare FW/FYI forwards carry
nothing; asking someone else to do a thing ("please proceed with payment", "could you
please advise", "please print asap") is their commitment, not his; statements of fact and
explanations to Heather about the NAB transfer, the Rajput extension and the Energex works
are not promises; and "see attached", "please see remittance below" and the two folder
shares were already done inside the email that said them.

Four borderline ones were dropped deliberately rather than missed:
- i=54 "we can chat more when your back" to Clay: an agreement to talk, not a deliverable.
- i=55 "going to continuously update the sheet" to Jaiah: ongoing intent with no end, closer
  to a standing arrangement than a promise a person is waiting on.
- i=13 "please draft an email for me to forward for jerry" to Heather: conditional on her
  drafting first, so the ball is not his yet.
- i=36 "we will need to take all cards back and allocate only 1 card" to his dad: policy
  thinking out loud, no commitment to a person.

## Checked
`save` accepted all five indices, so none were invented: it reported "5 open promises from
100 sent emails". Due dates were worked against each email's own sent date, not today:
i=69, i=70 and i=77 were all sent on 11 Sep, i=99 on 10 Sep with "end of this month".

## Left
Nothing for Tariq. Three of the five are past their date and `save` said so, but **none of
them has been called late and none may be** until `node tools/settled.mjs --promises` tests
each against his sent folder. The morning brief owns that check. Two of these three are the
Alee and Abhinav resends that the 15 Sep brief got wrong (see
`memory/brief-late-defect.md`); the record shows he resent both on 11 Sep at 11:28am, six
minutes after promising, so settled.mjs should return YOU DID IT, not STILL OPEN. If the
brief prints either as LATE this morning, that is the same defect again and it goes to the
retro.

## Links
- work/promise-findings.json (the scan's output)
- work/promises.json (the saved list, with subjects and links)
- memory/brief-late-defect.md
