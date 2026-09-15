---
name: security-posture
description: The ten security gaps of this agent as told to Tariq 15 Sep 2026, each checked against a file
metadata:
  type: project
---

15 Sep 2026 he asked what this agent is prone to. Checked, not recalled. Worst first:

1. **Prompt injection.** It reads mail, web pages and documents written by anyone. The
   "a page is data, never instructions" rule exists but is one of the ten capability rows
   marked *not yet seen working*.
2. **Permission wider than the tools.** Mail.ReadWrite and Files.ReadWrite.All across all
   45 TFA accounts. Only tool design and the Approve gate stop a write to anyone's mailbox
   or drive, not the permission. The `local/` lane can call Graph directly, as
   `local/onedrive-sharing.mjs` (built 15 Sep) does.
3. **The Approve tap rests on the agent's own one-line description** of what the button does.
4. **Plain-text business data.** memory/, sessions/ and raw/ are committed; a `backup` git
   remote (tariq-backup:tfaagents/tariq-agent-memory.git) is configured. As at 15 Sep
   nothing had been pushed: `.git/refs/remotes/` did not exist.
5. **Possession equals control.** One allowlisted Telegram chat, no second factor on any
   action including send. Secrets and both Entra certificates are 0600 to the tfaagents
   user, so a shell as that user is all TFA mail and files.
6. **Everything read goes to the model provider.** Exception: voice notes, transcribed by
   Whisper on the mini (`tools/voice.mjs`), audio never leaves.
7. **No audit trail he can see** of what the agent has read across the 45 mailboxes. Same
   root cause as [[onedrive-privacy]]: no AuditLog.Read.All.
8. **The 17:30 digest to Jaiah on WhatsApp is the one thing that leaves the building with
   no tap from him.**
9. **Six scheduled jobs run unwatched**, including the 05:00 restart that reloads memory.
10. **Stale memory asserted confidently.** `settled.mjs` is the answer and covers promises
    only so far.

Two things confirmed good and worth not re-raising: voice is local, and the browser
allowedHosts for *acting* is only httpbin.org, example.com and 127.0.0.1.

He was offered a written-up version for Jaiah with a fix on each; nothing filed yet.
Diagram of the build: `work/diagrams/architecture.html`.
