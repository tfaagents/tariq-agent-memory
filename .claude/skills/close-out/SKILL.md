---
name: close-out
description: The other end of the morning brief. What actually moved today, what is still open, what tomorrow looks like, and the first three things to pick up, built from evidence rather than from what was planned
argument-hint: [none]
---

The morning brief says what needs him. This says what happened to it. The whole point is
the comparison: he was told five things at 6:30, and by 4:30 some moved and some did not.

Read, in this order, and say how old each is:

1. `work/briefs/YYYY-MM-DD.txt` (today's brief). This is the list to close out against.
   If there is no brief for today, say so in one line and build the close-out from the
   rest anyway.
2. `node tools/mail.mjs sent 10` (what he actually sent today). This is the strongest
   evidence that something moved, and it is where promises made today come from.
3. `node tools/settled.mjs --promises`, never `tfa.mjs promises` on its own: the tracker
   has no fulfilment check, so its LATE is a claim to be tested. A `DONE` verdict is also
   the best evidence you have for the DONE section below. `YOU DID IT` belongs under STILL
   OPEN as a chase on them, never as something he owes.
4. `node tools/tfa.mjs waiting` (rows still waiting for a person on the dashboard).
5. `node tools/jobs.mjs list` and today's `sessions/*.md` (what this agent did for him
   today, only the ones he would recognise as his).
6. `node tools/calendar.mjs everyone 2` and take TOMORROW's entries: his first, then who
   at TFA is out or on site.
7. `node tools/requests.mjs list --open` (what is still waiting on an answer from him).

**Only call something done when the data says so.** A sent email, a promise the tracker
has closed, an approval on the dashboard, a job board entry that finished. Never a run
summary and never "we discussed it": on 14 Sep this agent reported "still seven open"
from its own log while the promise report was returning null, and that is the failure
this skill is most likely to repeat. If a source is empty or will not read, say that in
one line at the end ("Could not read: ...") and leave the section out rather than
guessing at it.

Say plainly when nothing moved. A close-out that reports progress every day is worthless
to him by Friday.

**Tomorrow first** is the part he will judge it on. Pick the three things most worth starting
tomorrow morning, in order, each with the reason in four words or fewer. Weigh: a late
promise where someone is waiting and does not know it is late; money with a date; anything
that blocks somebody else at TFA; then his own diary. Not three chores. If two of the three
are the same as this morning's brief, that is the honest answer and it says so ("still from
this morning").

**Then do the obvious next thing before you write**, exactly as the brief does: a reply he
would approve anyway gets drafted now into his Outlook Drafts (`node tools/mail.mjs draft <n>
--file <path>`, his voice, `[CONFIRM: ...]` for anything not in writing). Nothing sends. The
close-out says the draft is there, never that you could write one.

Shape: the brief's shape, so the two read as a pair. A short note, plain text, no markdown,
no headers in capitals, no bullets, no em dashes, under 900 characters. In this order:

- First line: the date and what actually happened today in one sentence (sent bold).
- What moved, with the evidence in the line ("sent 2:14pm", "approved on the dashboard,
  3:02pm"). At most three, the ones that matter to him. If nothing moved, say so plainly.
- Still open: a LATE promise only on a STILL OPEN verdict past its date; YOU DID IT as a chase
  on them; then what is waiting on him.
- Tomorrow: his calendar with time and place, and who is out or on site if it matters.
- "Tomorrow first:" then the three, numbered in one line each, with the four-word reason.
- "Drafts ready in Outlook:" and what they are, if any.
- No closing line. No offer. No question.

Anything blocked on Jaiah stays out; it reaches him in the 17:30 digest. Never a line from
the inbox's "Filtered as noise" block or an email marked "copy, addressed to" someone else.

Example of the whole message:

Tue 15 Sep: Alee chased and the ABA paid, Abhinav still open, two on site tomorrow.

Moved: Alee got the Narangba documents again, sent 2:14pm. Utility Mapping ABA approved on
the dashboard, 3:02pm. Dan Street sales update held at 10.

Still open: LATE Abhinav, Bokarina documents, due 11 Sep. Scribe seats 5 and 6, since 10 Sep,
one word from you on who holds them.

Tomorrow: 7:00 site walk at Jimboomba with Clay. Heather in the office, Shane at the yard.

Tomorrow first: 1. Abhinav's documents, someone is waiting. 2. Kendal's Monday.com key, blocks
the build. 3. Scribe seats, money each month.

Drafts ready in Outlook: Abhinav, the Bokarina documents.
