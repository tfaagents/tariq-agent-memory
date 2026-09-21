---
name: morning-send
description: Unattended weekday morning run. Build the brief exactly as /brief does and push it to Tariq's Telegram with tools/notify.mjs, so it is waiting when he picks up the phone.
argument-hint: [none]
---

Run the steps in `.claude/skills/brief/SKILL.md` (calendars, the inbox, promises, waiting)
and write the message in exactly the shape that skill gives: one short note, the date and the
one thing that matters on the first line, then his day, what is waiting on him. No sections in
capitals, no dashes, no drafts, no offer, no closing line. Plain text: no markdown, no bold
markers, no em dashes (notify.mjs makes the first line bold itself). Save the note to
`work/briefs/YYYY-MM-DD.txt`,
then `node tools/notify.mjs --file work/briefs/YYYY-MM-DD.txt`.

If a tool fails, still send what you have and say in one line what could not be read.
Log the session with slug `morning-send`.
