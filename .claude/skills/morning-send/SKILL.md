---
name: morning-send
description: Unattended weekday morning run. Build the brief exactly as /brief does and push it to Tariq's Telegram with tools/notify.mjs, so it is waiting when he picks up the phone.
argument-hint: [none]
---

Run the steps in `.claude/skills/brief/SKILL.md` (calendars, tfa brief, promises, waiting,
the inbox if the digest is stale, loose ends) and write the message in exactly the shape
that skill gives: date and answer on the first line, sections with CAPITAL headers, one
fact per line with a dash, one "I can" offer at the end. Plain text: no markdown, no bold
markers, no em dashes (notify.mjs makes the first line and the headers bold itself). Save
it to `work/briefs/YYYY-MM-DD.txt`, then
`node tools/notify.mjs --file work/briefs/YYYY-MM-DD.txt`.

If a tool fails, still send what you have and say in one line what could not be read.
Log the session with slug `morning-send`.
