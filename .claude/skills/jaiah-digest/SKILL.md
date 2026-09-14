---
name: jaiah-digest
description: Unattended, every day at 17:30. Everything this agent caught since the last digest that needs Jaiah (things Tariq wants built, walls, things the agent built itself, offers Tariq declined, jobs that blocked), each with a plan, sent to Jaiah on WhatsApp through the dashboard and filed there. Never messages Tariq.
argument-hint: [none]
---

Runs without anyone present. Reads this folder, writes plans back into the request list,
sends one message to Jaiah through the dashboard. Nothing to Tariq.

1. **Since when.** Read `work/digest-state.json` (`{"last": "YYYY-MM-DDTHH:MM"}`). If missing,
   use seven days ago. Everything below is "since last".
2. **Collect.**
   - `node tools/requests.mjs list --json --since <last>`: build asks (kind `build`), walls
     (open, kinds connection/site/credential/tool/install/other), things built by me (kind
     `built`), declined offers (kind `declined`), and anything closed since last.
   - `sessions/*.md` dated since last with `outcome: blocked` or `outcome: partial`: the
     `## Asked` line and the `## Left` reason. Skip ones that already have a request filed.
   - `node tools/jobs.mjs list`: jobs with status `failed` closed since last, with the reason.
   - `memory/declined.md`: lines added since last that have no `declined` request yet
     (file them now with `node tools/requests.mjs add declined "<the offer>" "<his reason or 'no reason given'>"`).
   - Housekeeping, one line each, only if true: last line of `work/backup.log` is a failed push;
     `memory/capabilities.md` older than 14 days; `raw/tfa-shared/README.md` older than 2 days.
3. **A plan for every item that has none.** For each build ask, wall, self-build and blocked
   job, write a plan in this exact shape (plain text, no em dashes, under 60 words):
   `What: <what it would do for him>. Uses: <tools/connections already live>. Missing: <the
   one thing, or "nothing">. Self-build: <yes, I can do it under local/ or a skill | no, needs
   Jaiah because ...>. First step: <one concrete step>. Size: <S|M|L>.`
   Judge "live" from `memory/capabilities.md`, never from what exists in `tools/`. Save it:
   `node tools/requests.mjs plan <id> "<plan>"`. Blocked jobs with no request get one filed
   first (`add <kind> ...` with the plan as the fourth argument).
4. **Write the digest** to `work/digest/YYYY-MM-DD.md`, plain text, under 2,800 characters,
   in this order, each section only if it has items, one item per line as
   `<id> <ask, his words> | Plan: <plan>`:
   ```
   Tariq's agent, daily digest <D Mon>
   <one headline line: N new asks, N walls open, N built, N declined, N blocked>

   BUILD ASKS (Tariq's Build List)
   WALLS (need Jaiah)
   BUILT BY THE AGENT (harden these)
   DECLINED BY TARIQ
   BLOCKED JOBS
   HOUSEKEEPING
   Full list: dashboard > Requests from Tariq's agent. To answer one, give its id and go,
   no or later to your Claude session (a WhatsApp reply here is not read yet).
   ```
   If nothing at all is new, the whole digest is two lines: the title and "Nothing new since
   <last>. <N> open walls, <N> on the Build List." Send it anyway; a quiet day should still
   be seen.
5. **Send and file.** `node tools/tfa.mjs digest --file work/digest/YYYY-MM-DD.md`. The
   dashboard DMs Jaiah on WhatsApp and keeps the digest on the Requests page. If the
   dashboard is unreachable, keep the file; the next run resends everything since the old
   watermark, so do NOT advance the watermark on failure.
6. On success write `work/digest-state.json` with now. Log the session with slug
   `jaiah-digest`, three lines: items sent, plans written, anything that failed.
