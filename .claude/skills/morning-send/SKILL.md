---
name: morning-send
description: Unattended weekday morning run. Build the brief exactly as /brief does and push it to Tariq's Telegram with tools/notify.mjs, so it is waiting when he picks up the phone.
argument-hint: [none]
---

Run the steps in `.claude/skills/brief/SKILL.md` (tfa brief, promises, waiting, and the
inbox if the digest is stale). Write the message as plain text: one line that is the
answer, then up to six short lines, then the one offer. No markdown, no bold markers, no
em dashes. Save it to `work/briefs/YYYY-MM-DD.txt`, then
`node tools/notify.mjs --file work/briefs/YYYY-MM-DD.txt`.

If a tool fails, still send what you have and say in one line what could not be read.
Log the session with slug `morning-send`.
