---
name: brief
description: What needs Tariq today, as one short note for his phone: his diary, promises that are honestly late, what is waiting on him. No drafts, no offer.
argument-hint: [none]
---

Build one short message for his phone. Read, in this order, and say how old each is:

1. `node tools/calendar.mjs everyone 1` (his diary first, then who at TFA is where today;
   if his line says "could not read", `node tools/mail.mjs diary 1` is the same calendar)
2. `node tools/mail.mjs inbox 14` (what came in overnight, read with his own app). The
   workflow lane's overnight brief, `node tools/tfa.mjs brief`, is a second look only, and
   it goes when that lane stops reading his mail. Rows the tool prints under "Filtered as
   noise" are never a brief line, whatever the subject says (`config/noise.json`, Jaiah's
   file), and a row marked "copy, addressed to" someone else is theirs, not his.
3. **The promises, and refresh them first if they are stale.** `node tools/promises.mjs
   list` prints when it last scanned; if that is more than eighteen hours ago, run
   /promises-scan before anything else, because a brief built on a two day old scan misses
   what he promised yesterday. The schedule normally does this at 06:15, and this is the
   check that catches a morning it did not.
   Then `node tools/settled.mjs --promises` (never the raw scan or `tfa.mjs promises`:
   neither can see fulfilment, so their LATE is a claim). Go by the verdicts. `DONE` never appears. `YOU DID
   IT` is a chase on them, written as "you sent X on <date>, nothing back", never as his
   late promise. `NOT DUE` is left out. Only `STILL OPEN` that is also past its due date
   gets the LATE prefix.
4. `node tools/tfa.mjs waiting` (rows waiting for a person on the dashboard)
5. If the digest is older than 20 hours, also `node tools/mail.mjs inbox 24`.
6. **Loose ends** stay out of his brief. Anything blocked on Jaiah (a connection, a folder,
   a credential, a tool change) is already on the request list and reaches Jaiah in the 17:30
   digest. The one exception: something that needs a single word from him (a folder name, a
   yes or no) gets one line, once. Never repeat it the next morning; if it is still unanswered
   after that, it goes to the Friday retro.

Weigh all the sources. A promise past its date is usually the most urgent thing he has,
because someone is waiting and does not know it is late. Money with a date comes next, then
anything that blocks somebody else at TFA, then his own diary.

No drafts in the note. If something needs his reply, the line says so ("Abi's price has sat 11
days, needs a reply"); he asks for the draft in the chat if he wants it, and it is written then, in
his voice. Never "I can draft X, say yes": that ending ran four days straight and he answered none.

Shape: a short note for his phone, the way you would text a colleague, not a report. Plain
text, no markdown, no headers in capitals, no bullets, no em dashes, under 900 characters.
In this order:

- First line: the date and the one thing that matters most today, in one sentence
  (notify.mjs sends it bold).
- His day: one line per entry, time first, place and who, only what is real. If a TFA
  calendar says who is out or on site and it matters to him, one line.
- Waiting on him: each with the name first and the amount or date last. A promise carries
  LATE only on a STILL OPEN verdict from settled.mjs that is also past its date; YOU DID IT is
  written as "you sent X on <date>, nothing back"; DONE and NOT DUE are left out.
- No closing line. No offer. No question. The note ends when the facts end.

Never a line about a row `mail.mjs inbox` printed under "Filtered as noise", and never one
about an email marked "copy, addressed to" somebody else: those are not his. Never explain
which tool could not be read unless it changes what he should do; if it does, one line at
the end, "Could not read: <what>".

Example of the whole message:

Mon 21 Sep: Clay at 9, Aliyah's formal at 11, and RCH's $11,000 falls due today.

9:00 Clay catch-up, booked by Kendal. 11:00 Aliyah's formal, then Sanctuary Cove at 1.
2:00 ATO with Heather, the affiliates onto the portal. Heather has a 3pm reminder on the
$500k Chateaux loan to Rajput, extended to yesterday.

Waiting on you: RCH INV-0027, $11,000, due today, Heather has it. Shane's $42.50 Bunnings
receipt, one tap on the dashboard. You sent Alee the Narangba documents 11 Sep, nothing back.

