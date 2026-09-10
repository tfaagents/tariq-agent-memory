---
name: nightly-learn
description: Unattended, every evening. Read what Tariq sent and what was in his diary today and update memory (people, projects, decisions, how he wants things done). Never messages him, never drafts.
argument-hint: [none]
---

Runs without Tariq present. Read only, memory writes only.

1. `node tools/mail.mjs sent 1` then `node tools/mail.mjs read <n>` for each email he
   sent today (skip forwards with no words of his own).
2. `node tools/mail.mjs diary 1`.
3. `ls sessions/` and read any session log written today.
4. From those, update `memory/`:
   - `projects.md`: any project, site, tender, claim or development mentioned (name,
     address, stage, who is on it, what is outstanding, the date you saw it). One
     section per project, newest fact on top, dates absolute.
   - `contacts.md`: any person or company he dealt with today (who they are to him,
     company, what they handle). Update an existing line rather than adding a second.
   - `tariq.md` "How he works": only if you saw a new preference or rule in his own
     words. Quote it.
   - `voice.md` "Corrections": nothing here; that is written only when he rewrites a draft.
5. Add one pointer per new file to `memory/MEMORY.md`. Never delete a memory; mark it
   superseded with the date instead.
6. Finish with a three-line summary: emails read, facts added, anything that looked
   like a promise he made today (so the morning brief can check the tracker caught it).
   Do not send anything.
