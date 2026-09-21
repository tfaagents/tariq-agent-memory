---
name: close-out-send
description: Unattended weekday 4:30pm run. Build the close-out exactly as /close-out does and push it to Tariq's Telegram with tools/notify.mjs, so the day is closed off before he leaves.
argument-hint: [none]
---

Run the steps in `.claude/skills/close-out/SKILL.md` (this morning's brief, what he sent,
promises, waiting, the job board, tomorrow's calendars, open requests) and write the
message in exactly the shape that skill gives: one short note, what happened today on the
first line, then what moved with its evidence, what is still open, tomorrow, "Tomorrow first"
with the three. No sections in capitals, no dashes, no drafts, no offer, no closing line. Plain text: no markdown, no bold markers, no em dashes (notify.mjs
makes the first line bold itself). Save it to
`work/close-outs/YYYY-MM-DD.txt`, then
`node tools/notify.mjs --file work/close-outs/YYYY-MM-DD.txt`.

If a tool fails, still send what you have and say in one line what could not be read.
Log the session with slug `close-out-send`.

Two rules that are particular to this run:

- **Nothing that needs his approval, and no drafts.** No chases sent, no calendar entries, no
  dashboard buttons, nothing written into his Outlook Drafts. A draft is offered in the chat
  when he is talking about an email, never by a scheduled run.
- **Do not send a second copy.** If he has already asked for the close-out in the chat
  today, `/close-out` answered him there. Check for `work/close-outs/YYYY-MM-DD.txt`,
  that exact name and nothing else: a file with a time in it
  (`2026-09-15-0940.txt`) is a hand run or a test and never suppresses the real send.
  Only the plain dated file means he has already had today's close-out.
