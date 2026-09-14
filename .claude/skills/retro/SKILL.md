---
name: retro
description: Friday afternoon, unattended. Read the week's session logs and propose what should become a skill, what memory is wrong or stale, and what Tariq asked for that the agent could not do. On the first Friday of the month, also consolidate memory. Writes the proposal to work/retro/ and sends him a five-line summary.
argument-hint: [none]
---

1. Read every `sessions/*.md` from the last seven days and `memory/declined.md`.
2. Group by slug. For any slug done three or more times with no `.claude/skills/<slug>/`,
   write a proposed `SKILL.md` to `work/retro/YYYY-MM-DD/<slug>/SKILL.md` from the steps
   that were actually taken. Do not create the skill itself; Tariq or Jaiah applies it.
3. List every session with outcome `blocked` or `partial` and the reason. Those are the
   gaps: a system not connected, a permission not granted, a tool that does not exist.
   Add what `node tools/requests.mjs list` shows was requested this week, what was built
   under `local/` or as a skill, and what he asked for twice; that list goes to Jaiah.
4. Read `memory/MEMORY.md` and spot-check three facts against this week's sessions and
   mail. Note anything contradicted, with the evidence, in the same retro folder as
   `memory-check.md`. Do not edit memory here, except in step 5.
5. **First Friday of the month only: the consolidation pass.** Memory grows by appending,
   so once a month it is rewritten to what is still true.
   - For each `memory/*.md` except `rules.md`, `capabilities.md` and `MEMORY.md`: rewrite
     the file to the facts that are still true today, each with the date it was last seen
     true. Move every superseded, duplicated or contradicted line to
     `memory/archive/YYYY-MM.md` under a heading naming the source file, with its original
     date, so nothing is lost and the history stays readable. Keep every file under about
     120 lines; if one cannot fit, split it by topic and point to the parts from MEMORY.md.
   - `rules.md` is the Decision Book: never rewrite or move an entry. A rule he has since
     reversed is struck through (`~~like this~~`) with the date and the rule that replaced
     it on the next line.
   - `capabilities.md` is mirrored from Jaiah's CRM; leave it alone.
   - `raw/` is never touched.
   - Rebuild `memory/MEMORY.md`: one line per file, grouped as it is now, under 200 lines,
     and a line at the bottom "Consolidated YYYY-MM-DD".
   - Write what moved to `work/retro/YYYY-MM-DD/consolidation.md` (file, lines before,
     lines after, how many archived) and put the same three numbers in the summary.
   - Commit: `git add memory && git commit -m "consolidate: YYYY-MM"` (the save hook pushes
     to the backup remote when the session ends).
6. Check `work/backup.log`: if the last line is a failed push, or the file is missing while
   a `backup` remote exists, the one thing to tell Jaiah is "memory backup is stale since
   <date>".
7. Send Tariq five lines with `node tools/notify.mjs`: jobs done this week, what could
   become a skill (ask yes or no), what blocked, one thing to tell Jaiah. Plain text, no
   formatting, no em dashes.
8. Log the session with slug `retro`.
