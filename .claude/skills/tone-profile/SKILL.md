---
name: tone-profile
description: Rebuild memory/voice.md, the profile of how Tariq writes email, from his own sent mail: counted stats and a style card per audience, with his corrections kept verbatim. Monthly, or when Jaiah asks.
argument-hint: [none]
---

1. `node tools/tone.mjs stats`. If it says there is no corpus, run
   `node tools/tone.mjs harvest` first (reads his Sent Items for the last eighteen months
   into work/voice/corpus.json, which never leaves this machine), then stats again.
2. `node tools/tone.mjs spread --n 30`: thirty of his emails spread across time and
   audience, his side only, quoted replies and signatures already cut off.
3. Rewrite `memory/voice.md` ABOVE the "## Corrections" heading; keep everything from that
   heading down exactly as it is (create the heading if it is missing). Front matter:
   name voice, description with today's date, the number of emails and "corrections at
   the bottom". Then these sections, each backed by a count from step 1 or a quote from
   step 2, and nothing the emails do not show:
   - **Opening** (the counted forms and percentages, by name or not, when there is none)
   - **Closing** (forms and percentages, when the full credential signature appears)
   - **Length** (median words, sentences per email, paragraphs) and **Sentences and
     punctuation** (commas, fragments, questions, exclamation marks, emojis, "lol")
   - **Words and phrases he uses**, including spellings of his to keep and typos not to copy
   - **Register by audience**: Staff, Clients and consultants, Suppliers and trades, Family.
     For each: how he opens, how direct, two short verbatim examples, what he asks for and
     how he asks.
   - **Asking for things**: money, discounts, chasing, saying no, bad news. Quote him.
   - **Humour and warmth**: when it appears and how.
   - **Never**
   Under 150 lines. No em dashes. Where the old profile had a line the new evidence still
   supports, keep its wording.
4. `git add memory/voice.md && git commit -m "voice profile rebuilt <date>"`. Log the
   session with slug `tone-profile`. Summary: emails in the corpus, per audience, what
   changed in the profile since the last one.
