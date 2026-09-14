---
name: brief
description: What needs Tariq today, in one message: email needing a reply, promises he made that are open or late, what is in the diary, what is waiting on the dashboard, and any loose end he started with this agent that the data shows was never followed up, with what the agent can do next
argument-hint: [none]
---

Build one short message for his phone. Read, in this order, and say how old each is:

1. `node tools/tfa.mjs brief` (the agents' overnight brief, digest and today's diary)
2. `node tools/tfa.mjs promises` (late ones first)
3. `node tools/tfa.mjs waiting` (rows waiting for a person on the dashboard)
4. If the digest is older than 20 hours, also `node tools/mail.mjs inbox 24`.
5. **Loose ends** (things he started with you that stalled). Read
   `node tools/requests.mjs list --open` and `node tools/requests.mjs list --build`, and
   `sessions/*.md` from the last 14 days with `outcome: partial` or `outcome: blocked`.
   For each, check the data before you call it a loose end: `node tools/recall.mjs "<two
   words>" --since 14d` and, if it was about mail, `node tools/mail.mjs search "<word>"`
   for anything newer than the session. If someone has since followed up (a reply from
   Kendal, the seat list arrived, the wall was closed), it is not a loose end; close the
   request (`node tools/requests.mjs done <id> "<what happened>"`) and leave it out. Keep
   at most three, oldest first. Each is ONE bullet in this shape:
   `Loose end: <what, 4 to 8 words>, since <D Mon>. I can: <one concrete next step you can
   do now with what is live>.`
   Example: `Loose end: Scribe seats 5 and 6 unnamed, since 10 Sep. I can: draft Kendal a
   note asking for the seat list and the annual cost.`
   Never repeat a loose end he has said no to (check `memory/declined.md` and the request's
   note); after three mornings without an answer, drop it to the Friday retro instead.

Weigh all the sources. A promise past its date is usually the most urgent thing he has,
because someone is waiting and does not know it is late. A loose end sits after promises
and today's diary, before anything merely informative.

Shape: one bold line that is the answer, then up to six bullets, each one fact with the
name, amount or date that matters. End with one specific offer you can do; when there is a
loose end, the offer is its "I can" step ("Say yes and I draft the Scribe note to Kendal").
Nothing else.
