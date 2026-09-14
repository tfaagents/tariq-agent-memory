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
3. `node tools/tfa.mjs promises` (open and late, late first).
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

**FIRST THREE** is the part he will judge it on. Pick the three things most worth
starting tomorrow morning, in order, each with the reason in four words or fewer. Weigh:
a late promise where someone is waiting and does not know it is late; money with a date;
anything that blocks somebody else at TFA; then his own diary. Not three chores. If two
of the three are the same as this morning's brief, that is the honest answer and it says
so ("still from this morning").

Shape: exactly the brief's shape, so the two read as a pair. Plain text, no markdown, no
em dashes. First line is the date and the answer in one sentence (it is sent bold). Then
sections, CAPITAL header on its own line, blank line between, one fact per line with a
leading dash, name first, date or amount last, no line over 80 characters. Leave an empty
section out. At most three lines a section, except STILL OPEN, which lists every late one
then up to two more. End with one line starting "I can". Under 1,500 characters.

Sections, in this order:

DONE: what moved today, with the evidence in the line ("sent 2:14pm", "approved on the
dashboard"). At most three, the ones that matter to him, not the easiest three.
STILL OPEN: late promises first, prefixed LATE, then what is waiting on him.
TOMORROW: his calendar with time and place, then one line on who is out or on site.
FIRST THREE: numbered 1, 2, 3, each with the four-word reason.

Example of the whole message:

Tue 15 Sep: Alee chased and the ABA paid, Abhinav still open, two on site tomorrow.

DONE
- Alee Fateh: Narangba documents resent, sent 2:14pm
- Utility Mapping ABA: approved on the dashboard, 3:02pm
- Dan Street: sales update held, 10am

STILL OPEN
- LATE Abhinav Choudhary: Bokarina documents, due 11 Sep, confirmed Saturday
- Scribe seats 5 and 6: still needs your answer, since 10 Sep

TOMORROW
- 07:00 Site walk, Jimboomba, with Clay
- Heather in the office, Shane at the yard

FIRST THREE
1. Abhinav Bokarina documents, someone is waiting
2. Kendal Monday.com key, blocks the build
3. Scribe seats, money each month

I can draft the Abhinav note now. Say yes.
