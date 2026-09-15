---
job: confirm access to Tariq's list of bot builds
slug: bot-builds-list
started: 2026-09-15T04:45
finished: 2026-09-15T04:52
---

## What he asked
Voice note, 04:45: "Can you go to my desktop save files and it has Tariq's list of bot
builds and confirm that you have access to it." Preceded at 04:22 by "do you have a copy
of the list that we gave to Jaiah for building agents".

## What I did
- Answered the 04:22 note from `memory/agent-roadmap.md`: the 11 Sep email to Jaiah,
  agents 1 to 4, and said plainly that mail truncated it at 6,000 of 13,436 characters so
  agents 5 onwards have never been read.
- `node tools/files.mjs list Desktop` found `Tariqs list of bot builds.docx`, 20 KB,
  modified 15 Sep 2026.
- `files.mjs get` pulled it to `work/inbox/`, `textutil` read it out. 45 bullets, 43 real
  ideas.
- Confirmed access to him, named what is in the doc that is not in the Jaiah email, and
  flagged the two items that cross hard rules.
- Wrote `memory/bot-builds-doc.md` and indexed it.

## Why
- Confirming access by actually opening the file, not by seeing the filename, because
  "confirm you have access" is a question about reading it.
- Named storing logins/passwords and buying on his card as things I cannot do, per the
  hard rules in CLAUDE.md, rather than filing them as requests to Jaiah: those are
  decided against, not missing connections.
- Read only on his drive; nothing written there.

## What needs him
- Offered to load the 43 ideas onto his Build List so each gets a plan and reaches Jaiah.
  Waiting on his yes.
- Still open from the 04:22 answer: whether to pull the full 13,436 character email out of
  Outlook so agents 5 to 8 are actually read.
