---
name: inbox-watch
description: Unattended check of Tariq's inbox every few minutes. For each new email that wants a reply, write a suggested reply in his voice and push it to his Telegram; he answers "send it", "change ...", or "leave it" in the chat. Never sends anything itself.
argument-hint: [none]
---

Runs headless from the scheduler (`every` minutes in config/schedule.json, switched on by
Jaiah once the Tariq Assistant app exists). It cannot use the Approve button, so it only
suggests.

1. Read `work/inbox-watch.json` for the last watermark (an ISO time). First run: now minus
   30 minutes. Run `node tools/mail.mjs inbox 1` and keep only messages received after the
   watermark and not sent by him. Newsletters, notifications and receipts get no reply
   suggestion; note them in one line if there are many.
2. For each email that plainly wants an answer from him: read it in full, read
   `memory/voice.md`, and write a reply body to `work/drafts/<YYYY-MM-DD-HHMM>-<n>.txt` in
   his voice: short, direct, no em dashes, `[CONFIRM: ...]` for anything you do not know.
   Do not create the Outlook draft here; the chat session does that with his yes.
3. Push one Telegram message per email with `node tools/notify.mjs`:
   "New from <name>: <subject in ten words>. Suggested reply: <the draft>. Say send it,
   change it, or leave it." Keep the whole message under 1,500 characters.
4. Write the new watermark to `work/inbox-watch.json` and append one line per email to
   `work/inbox-watch.log` (time, sender, subject, draft file). Finish with a three-line
   summary.

When he answers in the chat, the main session does: `node tools/mail.mjs draft <n> --file
<draft file>` (Approve), then `node tools/send.mjs go last` (Approve again, the prompt
shows to, subject, first lines, attachments). Two taps, nothing leaves without the second.
