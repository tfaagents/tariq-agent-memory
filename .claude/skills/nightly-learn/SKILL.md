---
name: nightly-learn
description: Unattended, every evening. Read what Tariq sent, what was in his diary, and what he said to this agent on Telegram today, and update memory (people, projects, decisions, how he wants things done). Never messages him, never drafts.
argument-hint: [none]
---

Runs without Tariq present. Read only, memory writes only.

1. `node tools/mail.mjs sent 1` then `node tools/mail.mjs read <n>` for each email he
   sent today (skip forwards with no words of his own).
2. `node tools/mail.mjs diary 1`.
3. What he told this agent today counts the same as what he emailed. Read all four:
   - `ls sessions/` and read every session log dated today (the `## Asked` section is his
     words; `## Did` and `## Why` are what was done and what it relied on).
   - `node tools/jobs.mjs list` for jobs closed today: the `ask` is his words, the
     `result` is what came back. A job that failed or was blocked is a gap for the retro,
     not a fact.
   - `work/build-list.md`: anything added today is something he wants, in his words.
     Record it under `tariq.md` "What he wants built" with the date; the list itself stays
     the record, so one line each.
   - `memory/rules.md`: any rule added today is already where it belongs. Check that
     `tariq.md` "How he works" does not contradict it; if it does, the newer rule wins and
     the old line is marked superseded with today's date.
   - `raw/tfa-shared/` if it exists: last night's export from the workflow lane. Use it
     only to confirm or date a fact (a promise he made, a contact's role); it is read only
     and a fact taken from it says so.
4. From those, update `memory/`:
   - `projects.md`: any project, site, tender, claim or development mentioned (name,
     address, stage, who is on it, what is outstanding, the date you saw it). One
     section per project, newest fact on top, dates absolute.
   - `contacts.md`: any person or company he dealt with today (who they are to him,
     company, what they handle). Update an existing line rather than adding a second.
   - `tariq.md` "How he works": only if you saw a new preference or rule in his own
     words. Quote it. A preference he stated on Telegram is as good as one in an email.
   - `voice.md` "Corrections": nothing here; that is written only when he rewrites a draft.
5. Add one pointer per new file to `memory/MEMORY.md`. Never delete a memory; mark it
   superseded with the date instead (the monthly consolidation in /retro moves superseded
   lines to `memory/archive/`).
6. Finish with a three-line summary: emails read, Telegram jobs read, facts added, anything
   that looked like a promise he made today (so the morning brief can check the tracker
   caught it). Do not send anything.
