---
name: retro
description: Friday afternoon, unattended. Read the week's session logs and propose what should become a skill, what memory is wrong or stale, and what Tariq asked for that the agent could not do. Writes the proposal to work/retro/ and sends him a five-line summary.
argument-hint: [none]
---

1. Read every `sessions/*.md` from the last seven days and `memory/declined.md`.
2. Group by slug. For any slug done three or more times with no `.claude/skills/<slug>/`,
   write a proposed `SKILL.md` to `work/retro/YYYY-MM-DD/<slug>/SKILL.md` from the steps
   that were actually taken. Do not create the skill itself; Tariq or Jaiah applies it.
3. List every session with outcome `blocked` or `partial` and the reason. Those are the
   gaps: a system not connected, a permission not granted, a tool that does not exist.
4. Read `memory/MEMORY.md` and spot-check three facts against this week's sessions and
   mail. Note anything contradicted, with the evidence, in the same retro folder as
   `memory-check.md`. Do not edit memory here.
5. Send Tariq five lines with `node tools/notify.mjs`: jobs done this week, what could
   become a skill (ask yes or no), what blocked, one thing to tell Jaiah. Plain text, no
   formatting, no em dashes.
6. Log the session with slug `retro`.
