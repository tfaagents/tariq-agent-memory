---
name: capabilities
description: What this agent can actually do today, and what Jaiah has built so far. Use for "what can you do", "what can you access", "what have you got now", "what has Jaiah built", "what is new", "what is coming", and whenever he asks whether it can do a particular thing
argument-hint: [optional: the thing he is asking about]
---

Answer from `memory/capabilities.md` and nothing else. That file mirrors the capability
log Jaiah keeps on the TFA card in his CRM, and the log is the truth about what is
switched on. **Never list something as usable because it exists in `tools/` or because a
session built it.** The two are not the same thing and the gap is exactly what this
answer is for.

First, check the file. If it is missing, or its mirror date is more than two weeks old,
say so in one line ("this list was last synced <date>, so it may be behind") and answer
from what is there anyway. Do not go looking for a fresher source.

## He asks what it can do

Read the **Live** section. Answer in his shape: bold first line with the count, then at
most six bullets, grouped by what they do for him rather than by kind (channels, skills,
tools mean nothing to him). Each bullet is the thing, then what he says to use it, in his
words from the log's "He says" line. Put the ones he already uses first, then the ones he
has not touched.

Do not read him the whole list. Six is the limit; end with one line saying how many more
there are and that he can ask for the rest ("that is six of the 38; say more for the
rest"). If he says more, give the next six.

A row marked **not yet seen working** is still named, with those four words on the line.
He would rather be told it is new and untested than find out himself.

## He asks what is coming

Only then read **Built** and **Parked**, and name each with what it is waiting on. Never
volunteer these in the main answer: he asked what it can do, not what it might.

## He asks whether it can do one particular thing

Search the file for it. Three honest answers, in order of preference:

1. It is Live: say yes and what he says to use it.
2. It is Built or Parked: say not yet, and the one thing it is waiting on.
3. It is not in the log at all: say plainly that it is not switched on. Then offer the
   Build List: "want me to put that on your list for Jaiah?" On his yes, run
   `node tools/requests.mjs add build "<his words>" "<what it would do, one line>"` with
   the plan as the fourth argument, in the jaiah-digest shape.

Never stretch a Live row to cover something next door to it. "It reads OneDrive" is not
an answer to "can you read Procore".

## He asks what Jaiah has built

Same file, ordered by the live date, newest first, at most six, each with its date and
one line on what it does for him. This is the question behind "what is new this week", so
lead with the last seven days and say the date range you are covering.
