---
name: brief
description: What needs Tariq today, in one message: email needing a reply, promises he made that are open or late, what is in the diary, what is waiting on the dashboard
argument-hint: [none]
---

Build one short message for his phone. Read, in this order, and say how old each is:

1. `node tools/tfa.mjs brief` (the agents' overnight brief, digest and today's diary)
2. `node tools/tfa.mjs promises` (late ones first)
3. `node tools/tfa.mjs waiting` (rows waiting for a person on the dashboard)
4. If the digest is older than 20 hours, also `node tools/mail.mjs inbox 24`.

Weigh all three sources. A promise past its date is usually the most urgent thing he has,
because someone is waiting and does not know it is late.

Shape: one bold line that is the answer, then up to six bullets, each one fact with the
name, amount or date that matters. End with one specific offer you can do ("Want me to
draft a reply to number 2?"). Nothing else.
