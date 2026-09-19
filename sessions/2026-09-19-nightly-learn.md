---
job: Unattended nightly learn for Sat 19 Sep, read the day and update memory
slug: nightly-learn
type: report
started: 2026-09-19T21:00
ended: 2026-09-19T21:09
outcome: done
skill: nightly-learn
---

## Asked
Scheduled run, Tariq not present. Do only what needs no approval. Read what he sent, what
was in his diary and what he said to this agent today, update memory, finish with three
lines. Never message him.

## Did
- `node tools/mail.mjs sent 1`: nothing found. `node tools/mail.mjs diary 1`: nothing on
  today. Saturday, and he did not touch his mail.
- Sessions dated today: `2026-09-19-morning-send.md` and `2026-09-19-jaiah-digest.md`,
  both scheduled runs, both `outcome: done`. Read both in full.
- `node tools/jobs.mjs list`: three jobs, all `done`, newest 15 Sep. Nothing opened today,
  so no words of his on Telegram to learn from.
- `work/build-list.md` and `requests.mjs list --build`: newest entry 14 Sep. Nothing added.
- `memory/rules.md`: no 19 Sep line, file last written 15 Sep. Nothing to reconcile against
  `tariq.md` "How he works", so no superseded marks.
- `raw/tfa-shared/`: every file still stamped 15 Sep 13:08, four days old. Nothing needed
  confirming or dating from it tonight, so it was not quoted.
- `node tools/tone.mjs review --days 3`: "No drafts waiting for review". No EDITED pairs,
  so no "## Corrections" entry in `memory/voice.md`.
- Checked today's two facts against memory before writing anything: `projects.md:112`
  already carries the 18 Sep 9:31am Dan St commitment to Veena cc Clay in his own words,
  `contacts.md:70` already has Grant Rex and Dhru Lodhia at Stamford Capital.
- Appended one dated paragraph to `memory/promise-scan-window.md`.

## Why
**Nothing was added to projects.md or contacts.md, and that is the correct outcome.** The
only project facts visible today came out of the 06:30 brief, which had already written
them to `memory/projects.md` this morning. Re-adding the Mitchell Brandtman RFI or the
Dan St conduit line would have made a second copy of a fact that is already on top of its
section, which the skill says not to do.

**One thing had changed in kind since yesterday and was written down: the promise list is
frozen on purpose.** `memory/promise-scan-window.md` already explained the 100 message cap
and the 19 Sep decision not to `save`. What today added is the standing state: the 17:30
digest re-stated `r-20260917-01` to Jaiah for the third day, now as "the scan cannot be
refreshed at all" rather than "it put a wrong brief on his phone". It went on the existing
file rather than into a new one, per the skill and the memory rules.

**The line that matters for Monday is the one about the second hand-carried promise.** The
18 Sep Dan St commitment to Veena and Clay has never been in `work/promises.json` and
cannot be put there without deleting the 14 Sep Ali Family Trust one. `settled.mjs
--promises` only sees the file, so anything working from the file alone will not know that
promise exists. That is written into the memory file now so the next brief reads it there
and not only in this log.

**Nothing was sent.** No mail, no Telegram, no approval needed at any step; every command
run tonight was a read except the one append to `memory/`.

## Checked
- `tail` on `memory/promise-scan-window.md` after the append: the paragraph is there and
  the file is intact.
- `memory/MEMORY.md` already carries a pointer to `promise-scan-window.md` under "How he
  wants things done", so no new pointer was needed and none was added.
- Both facts checked against `memory/projects.md` and `memory/contacts.md` with grep
  before deciding not to write them, rather than assumed to be absent.
- No em dash in anything written tonight.

## Left
- `work/promises.json` is still the 18 Sep scan, frozen on purpose. Jaiah owns
  `r-20260917-01`, now on its third day.
- Two promises live outside the file and must be carried by hand into Monday's brief: the
  14 Sep Ali Family Trust one to Shane, and the 18 Sep Dan St one to Veena and Clay.
- `raw/tfa-shared/` is four days stale. Jaiah's lane, flagged for the third day in today's
  digest, not fixable here.
- The PATTERN NOTICE from the session hook (jaiah-digest running around 17:00 on four
  different days, offer a daily schedule) is for Tariq and is not offered by an unattended
  run. It stands for the next time he is in the chat.

## Links
- sessions/2026-09-19-morning-send.md, sessions/2026-09-19-jaiah-digest.md
- memory/promise-scan-window.md (appended), memory/projects.md:104-115, memory/contacts.md:70
- work/digest/2026-09-19.md, work/briefs/2026-09-19.txt
