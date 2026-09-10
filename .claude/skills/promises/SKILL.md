---
name: promises
description: What Tariq told people he would do, from his own sent mail, late ones first. "done N" closes one and it stays closed.
argument-hint: [none] or "done <n>"
---

`node tools/tfa.mjs promises` lists them, late first, numbered. Report them as they come,
with who is waiting and the date he gave. Offer to write the follow-up for any of them
(use /draft-reply on the original email: `node tools/mail.mjs search "<subject>"` finds it).

If $ARGUMENTS is "done <n>": run `node tools/tfa.mjs done <n>`. It records a decision that
survives the next scan. Confirm in one line.

The tracker runs at 6:00am from the last 14 days of sent mail. If it has not run today,
say how old the list is.
