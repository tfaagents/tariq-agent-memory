---
name: diary
description: What is in Tariq's calendar today or this week. His calendar is also his to-do list, so treat entries as things to do, not only meetings
argument-hint: [days, default 1; "week" = 7]
---

Run `node tools/mail.mjs diary <days>` (1 for today, 7 for "week").

Report as a short list in time order: time, what, where, who called it. Flag anything that
clashes, anything with no location that looks like it needs one, and anything that reads
like a task he set himself (his calendar is his to-do list). If he asks to add something,
say that the agent cannot write to the calendar yet and offer to note it in
`memory/` and remind him in the morning brief.
