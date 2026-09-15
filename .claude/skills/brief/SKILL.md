---
name: brief
description: What needs Tariq today, in one message: email needing a reply, promises he made that are open or late, what is in the diary, what is waiting on the dashboard, and any loose end he started with this agent that the data shows was never followed up, with what the agent can do next
argument-hint: [none]
---

Build one short message for his phone. Read, in this order, and say how old each is:

1. `node tools/calendar.mjs everyone 1` (his diary first, then who at TFA is where today;
   if his line says "could not read", `node tools/mail.mjs diary 1` is the same calendar)
2. `node tools/tfa.mjs brief` (the workflow lane's overnight brief when it exists, and the
   inbox digest)
3. `node tools/settled.mjs --promises` (NOT `tfa.mjs promises`: the tracker cannot see
   fulfilment, so its LATE is a claim). Go by the verdicts. `DONE` never appears. `YOU DID
   IT` is a chase on them, written as "you sent X on <date>, nothing back", never as his
   late promise. `NOT DUE` is left out. Only `STILL OPEN` that is also past its due date
   gets the LATE prefix.
4. `node tools/tfa.mjs waiting` (rows waiting for a person on the dashboard)
5. If the digest is older than 20 hours, also `node tools/mail.mjs inbox 24`.
6. **Loose ends** (things he started with you that stalled). Read
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

Shape: sections, so he can read it on the phone in ten seconds. Plain text. The first
line is the date and the answer in one sentence (it is sent bold). Then sections, each a
header in CAPITALS on its own line, a blank line between sections, one fact per line with
a leading dash, the name first and the date or amount last, no line over 80 characters.
Leave a section out when it is empty. At most three lines in a section, except PROMISES,
which lists every late one and then up to two more. End with one line that is the one
offer, starting "I can". Under 1,500 characters in all. Never explain which tool could not
be read unless it changes what he should do; if it does, one line at the end, "Could not
read: <what>". Sections, in this order:

TODAY: his calendar entries with time and place, then anything dated today from mail,
then one line on who at TFA is out or on site if the calendars say so.
PROMISES: each late one first, prefixed LATE, then the next two due. A promise only
earns LATE on a STILL OPEN verdict from settled.mjs that is also past its date; if
nothing qualifies, the section carries what he is waiting on others for instead, or
is left out entirely. Never carry a promise the tool called DONE.
WAITING ON YOU: dashboard rows and people waiting on his signature, answer or approval.
INBOX: what needs his reply, from the digest or the inbox read.
LOOSE ENDS: as above, at most three.

Example of the whole message:

Tue 15 Sep: Dan Street at 10, Autoflow in the office, two promises late.

TODAY
- 10:00 Dan Street sales update, RWC CSR Rochedale South, with Grant Turner
- Autoflow on site: FLOW 01, 09 and 10 to review with Kendal, Heather and Clay
- Clay on site at Jimboomba all day (calendar)

PROMISES
- LATE Alee Fateh: resend the Narangba documents, due 11 Sep
- LATE Abhinav Choudhary: resend the Bokarina documents, due 11 Sep
- Grant Rex: circle back on Dan St, 30 Sep

WAITING ON YOU
- Heather: sign for the work experience student, with Clay

INBOX
- Hastings Deering invoice 2018869862, the first reminder bounced

LOOSE ENDS
- Scribe seats 5 and 6 unnamed, since 10 Sep

I can draft the chase to Alee now. Say yes.
