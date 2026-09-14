---
job: Rebuild memory/voice.md from Tariq's sent mail (scheduled monthly run)
slug: tone-profile
type: report
started: 2026-09-14T23:15
ended: 2026-09-14T23:26
outcome: done
skill: tone-profile
---

## Asked
Scheduled run of /tone-profile, Tariq not present. Do only what needs no approval.

## Did
1. `node tools/tone.mjs stats`. Corpus was already fresh, harvested tonight 14 Sep 2026
   11:15pm: 263 emails over 540 days in work/voice/corpus.json. No harvest needed.
   Breakdown: staff 121, external 135, family 7.
2. `node tools/tone.mjs spread --n 30` for 31 verbatim samples across time and audience.
3. Two extra passes over work/voice/corpus.json (read only, node one-liners): recipient
   domains, to see whether a supplier and trade cohort exists; and phrase frequency counts
   for the words and phrases section, so every claim carries a number.
4. Rewrote memory/voice.md above "## Corrections". The Corrections heading and its two
   lines were preserved byte for byte (split with `tail -n +36`, reattached after).
   118 lines, no em dashes.

## Why
Nothing was done on Tariq's behalf outside this repo: no mail read beyond the existing
local corpus, no draft, no send, no calendar or file write, no approval needed. The profile
is a memory file, rebuilt because /tone-profile is the monthly job that keeps it honest
against his real sent mail rather than against impressions.

## Checked
- Every section is backed by a count from `tone.mjs stats` or a verbatim quote from the
  spread. Percentages come straight from the JSON, not estimated.
- Em dash count in the finished file: 0.
- Corrections section verified present and unchanged at the tail.
- Supplier and trade claim checked before writing: the corpus holds about 10 such emails
  (Osman Insurance, Approved Joinery, Rezicad, Jeckra, Frontline, Tracks IS, Pickles,
  Ready Media), so the section says the sample is thin instead of inventing a register.

## Left
Nothing. Corrections section is still the empty placeholder; it fills as he edits drafts
(tone.mjs edit in chat, tone.mjs review in the nightly learn).

## Links
- memory/voice.md
- work/voice/corpus.json (263 emails, local only, never leaves the machine)
- Previous profile: 31 Aug 2026, 25 of 247 emails, counts held in ~/tfa-agents/data/voice/
