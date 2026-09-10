---
name: tender-template
description: Turn an estimator's price breakdown (PDF by email or a file he sends) into a draft TFA tender submission on the TFA template, for Tariq to check
argument-hint: <n from the inbox list, or a file path in work/inbox/>
---

Status 10 Sep 2026: the TFA tender submission template is Kendal's and its OneDrive
location is not connected yet. Until `raw/tender-template/` holds the template and
`memory/` records the rules, this skill produces a structured draft in `work/tenders/`,
not a finished document.

1. Get the estimate: `node tools/mail.mjs read <n>` for an email, or read the file he sent.
   If the estimate is a PDF attachment on the email, say so; attachments are not reachable
   through the mail tool yet, so ask him to send the PDF to the chat.
2. Extract every line: item, quantity, rate, amount, exclusions, assumptions, validity.
   Keep the estimator's numbers exactly. Never round, never fill a gap.
3. Lay it out in the TFA order once known (from `raw/tender-template/`); until then:
   project, client, scope summary, price breakdown table as a plain list, inclusions,
   exclusions, assumptions, validity, TFA sign-off block.
4. Save `work/tenders/YYYY-MM-DD-<project>.md`, send him the summary and the totals, and
   ask what to change. Log the session with slug `tender-template`.
