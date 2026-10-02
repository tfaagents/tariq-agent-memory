---
job: tone-profile
slug: tone-profile
type: report
started: 2026-10-02 16:02
ended: 2026-10-02 16:40
outcome: memory/voice.md rebuilt above "## Corrections" from 7,033 sent emails (2 Apr 2025 to 2 Oct 2026); corrections section unchanged
skill: tone-profile
---

## Did
- First pass: `node tools/tone.mjs harvest` stopped at its default 400-message cap (only 15 Sep to 2 Oct 2026, 237 emails). Profile rebuilt from that, then superseded.
- Re-harvest on the coordinator's instruction: `harvest --days 548 --max 6000` hit the cap at 6,000 (back to 25 Nov 2025 only); re-ran with `--max 15000`: 10,528 scanned, 7,033 usable, 2 Apr 2025 to 2 Oct 2026 (staff 2,242, external 4,513, family 278). No errors, no throttling; each run took about 4 minutes.
- Ran `tone.mjs stats` and `tone.mjs spread --n 30`, rewrote memory/voice.md above "## Corrections" (132 lines). Everything from "## Corrections" down is byte for byte as before.
- Counts from stats. Where stats has no field (phrase rates, sign-off by month, "Dear", "I trust you", Instagram block) the count was taken directly from work/voice/corpus.json. Quotes verbatim from the 30-email spread; observations from the 18-day pass kept only where the full corpus still holds them, labelled "since mid Sep 2026" or dated.

## Why
- Monthly scheduled /tone-profile run. Unattended: nothing sent, no approval needed, not committed (the parent commits).

## Left
- `tone.mjs harvest` defaults to 400 messages, which covers about 18 days of his Sent Items, not 18 months. The monthly schedule should pass `--days 548 --max 15000` (or the default should change in tools/, which is Jaiah's).
- The 14 Sep profile was also short-window: its 94% "Kind Regards" reflected only post-May 2026 mail.
