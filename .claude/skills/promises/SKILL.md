---
name: promises
description: What Tariq told people he would do, from his own sent mail, checked against what he has since sent. "done N" closes one and it stays closed.
argument-hint: [none] or "done <n>"
---

`node tools/settled.mjs --promises` is the list, and it is the only one to report from. It
reads his own scan (`work/promises.json`, written by /promises-scan from his sent mail) and
then tests every line against what he has actually sent since, so each one comes back as
DONE, YOU DID IT, THEY REPLIED, STILL OPEN or NOT DUE.

Report them as they come, with who is waiting and the date he gave. Offer to write the
follow-up for any of them (use /draft-reply on the original email: `node tools/mail.mjs
search "<subject>"` finds it).

**Only STILL OPEN past its own date may ever be called late.** YOU DID IT means the chase is
on them, never on him. This is the rule in CLAUDE.md, "Before you say it, check it is still
true": on three mornings in September he was told he was late for documents he had resent
six minutes after promising them.

If $ARGUMENTS is "done <n>": run `node tools/promises.mjs done <n>`, numbering as
`node tools/promises.mjs list` shows it. It survives the next scan. Confirm in one line.

/promises-scan refreshes the list from the last fourteen days of sent mail, and runs on a
schedule before the morning brief. If `list` says the scan is old, say how old.
