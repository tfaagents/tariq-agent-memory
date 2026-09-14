---
name: draft-reply
description: Write a reply to an email in Tariq's voice, show it to him, and on his yes put it in his Outlook Drafts folder. Nothing sends. Every change he makes to a draft is recorded and learned from.
argument-hint: <n from the last list> [what he wants the reply to say]
---

1. `node tools/mail.mjs read <n>` and read the whole thread text.
2. Learn how HE would write this one, in this order:
   - `memory/voice.md`: the profile (openings, closings, length, register by audience) and
     the Corrections at the bottom. A correction beats the profile when they disagree.
   - `node tools/tone.mjs like "<subject and the gist>" --to <their address>`: his three
     past replies most like this one, verbatim, the same person first. Match their length,
     opening and closing; take his phrases, never their facts.
   - `node tools/tone.mjs edits`: the last three times he changed a draft, what was written
     against what he sent. Do not repeat anything listed there.
   Pick the register: staff, external (client, consultant, supplier) or family. Australian
   construction, not corporate. No em dashes.
3. Use his instruction from $ARGUMENTS if he gave one. Never invent a fact, a date, a
   price or a commitment; write `[CONFIRM: what is missing]` in its place.
4. Save what you are about to show him to `work/drafts/<n>.suggested.txt`, then show him
   the draft in the chat, plain, and ask: "Put it in your Drafts?"
5. Only when he says yes: write the final body to `work/drafts/<n>.txt` and run
   `node tools/mail.mjs draft <n> --file work/drafts/<n>.txt`. That command triggers a
   permission prompt on his Telegram; he approves it there. Tell him it is in Drafts and
   that he presses send in Outlook. The draft is logged; the nightly learn checks what he
   actually sent.
6. Every tweak is training. If he changes anything before the yes ("shorter", "don't say
   that", "use: ..."), file HIS version in step 5, then
   `node tools/tone.mjs edit --suggested work/drafts/<n>.suggested.txt --final work/drafts/<n>.txt --to <address> --subject "<subject>" --source chat`
   and add one entry under "## Corrections" in `memory/voice.md`: date, who to, what was
   suggested in one line, what he sent in one line, the lesson as a rule he would agree
   with. Same lesson already there: add the date to it, not a twin.
