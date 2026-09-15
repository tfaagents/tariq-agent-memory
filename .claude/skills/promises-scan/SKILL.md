# promises-scan

Read what Tariq has **sent** and pull out the commitments he made, so `/promises`, the brief
and the close-out have a list to work from. Runs on a schedule before the morning brief, and
whenever he asks for a fresh read.

Until 15 Sep 2026 this list came from the team's workflow agents through the dashboard, which
meant the accounts app was reading his mail. It is read here now, with his own app, so his
lane needs nothing from the team's.

## Do this

1. `node tools/promises.mjs candidates 14` prints the emails he sent in the last fourteen
   days as JSON: each has `i` (its index), `to`, `subject`, `sent` and a preview of the body.
   Everything you need is in that list. Do not open anything else.
2. Decide which of them carry a promise, by the rules below.
3. Write your findings to `work/promise-findings.json` as one JSON array, then run
   `node tools/promises.mjs save work/promise-findings.json`. Nothing else writes the list.

```
[
  { "i": 3, "promise": "Send the revised quote for Bardon Rd", "due": "2026-09-02", "confidence": "high" }
]
```

## What counts as a promise

Something **Tariq said he would do**, that a person on the other end is now waiting for, in
his own words, shortened to one line.

- "I'll get that over to you Friday" is a promise, due that Friday
- "I'll have a look and come back to you" is a promise, no date
- "Leave it with me" is a promise, no date
- "We'll get someone out next week" is a promise, due next week

## What does not count

- Something **someone else** promised him. Only his own commitments.
- A statement of fact. "The slab was poured Tuesday" is not a promise.
- Pleasantries: "happy to help", "no worries", "speak soon".
- Anything already done inside the same email. "I've attached it" is done, not promised.
- Standing arrangements. "We invoice on the 30th" is a policy, not a promise.

**When in doubt, leave it out.** Four real promises are useful. Twenty with half invented gets
ignored inside a week and then the whole kit is furniture. Precision beats recall, every time.

## Dates

`due` is an ISO date (`YYYY-MM-DD`) **only when the email actually says when**, worked out
against that email's own `sent` date. "Friday" in an email sent on a Wednesday is that same
week's Friday. No date stated or implied means `due` is `null`. Never guess one to make an
entry look complete.

## Confidence

`high` when he plainly committed in plain words. `medium` when it reads as a commitment but
the wording is loose. `low` when it might be one; include it only if a person would want to
see it.

## Rules

- `i` must be an index from the list you were given. Never invent one; an index that was not
  in the list is dropped by `save`, not rendered.
- Never write a URL, a subject or a date out of the email. Return the index and the promise.
  `save` attaches the real subject, date and link, so every promise can be traced back to the
  exact email.
- If nothing in the list is a promise, write `[]`. An empty list is a correct answer and a
  much better one than a padded list.
- **Never call anything late here.** This scan cannot see whether he already did it.
  `node tools/settled.mjs --promises` is what tests each one against his sent folder, and only
  a STILL OPEN verdict past its own date may ever be called late. See the rule in CLAUDE.md,
  "Before you say it, check it is still true".
