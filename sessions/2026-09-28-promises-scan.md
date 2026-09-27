# 2026-09-28 promises-scan (scheduled 06:15)

What: ran `node tools/promises.mjs candidates 14` (248 sent emails, 14-28 Sep), judged them,
wrote `work/promise-findings.json` (10 entries) and saved with `node tools/promises.mjs save`.
Result: 11 open promises, 1 carried from an earlier scan (Grant Rex / Stamford Capital, 10 Sep,
now outside the 14 day window).

Why: feeds the 06:30 morning brief and the close-out.

Relied on: the candidates list only, as the skill requires. No emails opened, nothing sent,
nothing drafted, no approval needed.

Note: the newest sent email in the window is 25 Sep 13:12 UTC, the same as at the 25 Sep scan,
so nothing new came from the weekend. The list is unchanged from the previous scan, re-confirmed
against the current window. Nothing called late here; only `tools/settled.mjs --promises` may do that.
