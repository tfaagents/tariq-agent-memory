---
name: draft-reply
description: Write a reply to an email in Tariq's voice, show it to him, and on his yes put it in his Outlook Drafts folder. Nothing sends.
argument-hint: <n from the last list> [what he wants the reply to say]
---

1. `node tools/mail.mjs read <n>` and read the whole thread text.
2. Read `memory/voice.md`, including the corrections at the bottom. Match his opening,
   his length, his closing. Australian construction, not corporate. No em dashes.
3. Use his instruction from $ARGUMENTS if he gave one. Never invent a fact, a date, a
   price or a commitment; write `[CONFIRM: what is missing]` in its place.
4. Show him the draft in the chat, plain, then ask: "Put it in your Drafts?"
5. Only when he says yes: write the body to `work/drafts/<n>.txt` and run
   `node tools/mail.mjs draft <n> --file work/drafts/<n>.txt`. That command triggers a
   permission prompt on his Telegram; he approves it there. Tell him it is in Drafts and
   that he presses send in Outlook.
6. If he answers with his own wording instead ("use: ..."), file that text instead of
   yours and add a correction entry to `memory/voice.md`: date, who to, what you
   suggested in one line, what he sent in one line, the lesson.
