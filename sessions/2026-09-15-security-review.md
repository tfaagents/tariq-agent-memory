---
job: security gaps this agent is prone to, and a diagram of how it is built
slug: security-review
started: 2026-09-15T08:54
finished: 2026-09-15T09:10
---

## What he asked
Telegram, 08:54: "Tell me the security gaps that you are possibly prone to breach? Also
show me in a visual image how you have been built from the orchestrator to the agents etc"

## What I did
Checked the real setup rather than describing it from memory:
- `config/connections.json`: Mail.ReadWrite, Calendars.ReadWrite, Files.ReadWrite.All,
  User.Read.All, Contacts.Read, MailboxSettings.Read on app 1; Mail.Send on app 2.
- `git remote -v`: a `backup` remote (tariq-backup:tfaagents/tariq-agent-memory.git) is
  configured. `.git/refs/remotes/` does not exist, so nothing has been pushed to it yet.
- `.gitignore`: work/ and documents excluded; **memory/, sessions/ and raw/ are committed**.
- `tools/voice.mjs`: Whisper via ONNX **on the mini**. Audio never leaves. Told him so.
- Secrets: `~/.tariq-agent/secrets.json`, `~/.tariq-dashboard/passcode`,
  `~/.tariq-graph/*.key|crt` all 0600 to the tfaagents user.
- `config/browser.json`: allowedHosts is httpbin.org, example.com, 127.0.0.1 only.

Told him ten gaps over two messages, worst first: prompt injection; permission wider than
the tools; the Approve line being my own summary; plain-text business data plus a
configured backup remote; phone/mini possession equals control; everything read going to
the model provider. Then: no visible audit trail, the unattended WhatsApp digest, six
unwatched scheduled jobs, and confident stale memory.

Diagram: wrote `work/diagrams/architecture.html`, served it on 127.0.0.1:4711, opened it
in the browser lane and screenshotted it to
`work/browser/diagram/01-architecture.png`, sent as a file. Six layers: him, the
orchestrator, the four workers, the tools, the Approve gate, the outside world, with
Jaiah's lane beside it and the schedules underneath.

## Why
- Every claim in the gap list was checked against a file this session, not recalled, since
  a confidently wrong security answer is worse than no answer.
- Named my own behaviour as a gap in two places: I built and ran a script this morning that
  calls Graph directly (`local/onedrive-sharing.mjs`), and one of my commands reached at
  `~/.ssh/config` and was denied by the permission layer. Both are real evidence, and the
  second shows the guard working.
- `file://` is refused by `browser.mjs goto`, so the diagram was served over local http
  rather than worked around.

## What needs him
Offered to write the ten gaps up for Jaiah with a fix against each. Nothing filed yet;
waiting on his word so it does not become ten pings.
