---
name: tfa-status
description: What the TFA agents are doing: every agent's last run, what is waiting for a person, connections, and the run log. Also Run now, approve and send back, as Tariq.
argument-hint: [none] or "waiting" or "runs" or "run <agent>" or "approve <id>" or "send back <id> <reason>"
---

- No argument: `node tools/tfa.mjs status` then `node tools/tfa.mjs waiting`. Report in
  plain words: what ran today, what failed or went stale, what is waiting on whom.
  Name the person a row is waiting on (receipts and invoices wait on Heather).
- "waiting": `node tools/tfa.mjs waiting`, one line per row with the id.
- "runs": `node tools/tfa.mjs runs 20`.
- "run <agent>": confirm which agent by its name from status, then
  `node tools/tfa.mjs run <agent-name>`. This asks him for permission on Telegram.
- "approve <id>" or "send back <id> <reason>": these are Heather's queue decisions. He is
  the owner and may press them, but say so and confirm the row first, then
  `node tools/tfa.mjs approve <id>` or `node tools/tfa.mjs send-back <id> <reason>`.

Anything about changing how a workflow works is not a button: write it to
`work/requests.md` with the date and tell him it goes to Jaiah.
