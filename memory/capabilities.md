# What this agent can do (29 live of 41 logged)

Mirrored from the Capabilities tab on the TFA Constructions card in Jaiah's CRM on 14 Sept 2026.
That log is the truth about what is switched on; this file is a copy. Do not edit it here,
tell Jaiah. Answer "what can you do" from the Live section, in his shape. Built and Parked
are named only when he asks what is coming, always with what they are waiting on.

## Live: he can use these today

### Channels
- **Telegram chat** Text, photos and documents through @tfa_agent_bot. Verified live 10 Sep. He says: Send a message, photo or document. (live 10 Sept 2026)

### Skills
- **Diary review** Reviews diary through the existing mail wrapper. Installed 10 Sep; listed live in the 14 Sep handover. He says: What is on this week? (live 10 Sept 2026)
- **Draft reply** Drafts replies in Tariq's voice; Outlook Drafts requires Approve. Installed 10 Sep; listed live in the 14 Sep handover. He says: Draft a reply to this email. (live 10 Sept 2026)
- **Inbox review** Reviews mail through the existing mail wrapper. Installed 10 Sep; listed live in the 14 Sep handover. He says: Check my inbox. (live 10 Sept 2026)
- **Morning brief** Prepares a brief from connected mail, diary and workflow information. Installed 10 Sep; listed live in the 14 Sep handover. He says: Give me my brief. (live 10 Sept 2026)
- **Promises** Reads promises through the TFA dashboard. Installed 10 Sep; listed live in the 14 Sep handover. He says: What have I promised? (live 10 Sept 2026)
- **Remember** Saves durable facts into file-based memory. Installed 10 Sep; listed live in the 14 Sep handover. He says: Remember this. (live 10 Sept 2026)
- **Workflow status** Reads workflow status through the dashboard API. Installed 10 Sep; listed live in the 14 Sep handover. He says: How are the workflows going? (live 10 Sept 2026)

### Tools
- **Browser lane** Headless Chrome with an allowlist. Form submission requires Approve. Verified against a test form 11 Sep. He says: Open an allowed site and fill in this form. (live 11 Sept 2026)
- **Build List** Stores build ideas in work/build-list.md and on the dashboard without a notification. Verified end to end 14 Sep. He says: Add this to the list; what is on my Build List? (live 14 Sept 2026)
- **Everyone's calendars** Reads the calendars of all five TFA mailboxes for the morning brief and for "when is Kendal free". As of 14 Sep 21:40 his and Kendal's read; Heather, accounts and agents were still blocked by the new access policy propagating (up to 30 min). He says: "What has everyone got on tomorrow?" (live 14 Sept 2026, not yet seen working)
- **Microsoft Graph v2** Mail, calendars and OneDrive read through the agent's own Entra app "Tariq Assistant" (id ebb63dd1-040a-4ab4-90fe-070b1f105290), scoped by an Exchange access policy to five mailboxes: tariq, kendal, heather, accounts, agents. Proven 14 Sep: his inbox, Kendal's calendar, his OneDrive root. (live 14 Sept 2026)
- **OneDrive folder picking** OneDrive is deny-by-default: only folders he names are reachable, listed in config/files.json. The Graph side is connected as of 14 Sep; the list is empty until he picks the first folder. He says: "You can use my Tenders folder" and Jaiah adds it (one line). (live 14 Sept 2026, not yet seen working)
- **Progress and background jobs** One progress message per job, workers for long tasks, persistent job board. Shipped 10 Sep. He says: Where is that job up to? (live 10 Sept 2026)
- **Read diary** Reads Outlook calendar through mail.mjs diary while the new Entra application is pending. He says: What is on today? (live 10 Sept 2026)
- **Read mail and draft replies** Reads Tariq, Kendal, Heather and accounts mail using the v1 TFA Agents connection. Outlook drafts require Approve. Verified 10-11 Sep. He says: Check my inbox; find Heather's email; draft a reply. (live 10 Sept 2026)
- **Send email** Sends one of his existing drafts as tariq@ through the second app "Tariq Assistant Send" (Mail.Send only, scoped to his mailbox alone; proven 14 Sep that it cannot read mail and is refused on kendal@). Only after his Approve tap on Telegram, which shows to, subject, first lines and attachments. Receipt in work/sent.log. Not yet seen sending a real email. He says: Say "send it" after a draft; approve the prompt on your phone. (live 14 Sept 2026, not yet seen working)
- **TFA dashboard** Status, waiting items, runs, promises and brief; workflow actions behind Approve. Browser login verified 14 Sep. He says: Show me the dashboard; what is waiting on me? (live 14 Sept 2026)
- **Voice notes** Local Whisper transcription; echoes what was heard before acting. Verified with a real voice note 14 Sep. He says: Send a voice note. (live 14 Sept 2026)
- **Wall list** Records missing tools or connections on the dashboard and notifies Jaiah. Rule-based refusals are never requests. Verified 14 Sep. He says: Ask for something that needs a new connection. (live 14 Sept 2026)
- **Write calendar** Adds or moves events on HIS calendar (Calendars.ReadWrite consented 14 Sep), each behind Approve on Telegram. "Remind me to X on Friday" becomes an 8am entry. Not yet seen writing a real event. He says: "Put X in my diary Friday 8am" or "move my 10am to 2pm", then approve. (live 14 Sept 2026, not yet seen working)
- **Write OneDrive files** Upload, move and attach files in his OneDrive (Files.ReadWrite.All consented 14 Sep), each behind Approve, and only inside the folders he has allowed. No folder allowed yet, so nothing is reachable until he names one. (live 14 Sept 2026, not yet seen working)

### Rules
- **Decision Book** Records corrections in memory/rules.md; session logs explain actions and their sources. Shipped 14 Sep. He says: Remember this rule; what are my rules? (live 14 Sept 2026, not yet seen working)
- **Plain-language Approve prompts** A plain explanation before each Approve tap. Shipped 14 Sep. He says: Use a command that needs approval. (live 14 Sept 2026, not yet seen working)
- **Self-build lane** Instructions permit small scripts under local/ and personal skills; first script run requires Approve. He says: Can you build a report using the tools you already have? (live 14 Sept 2026, not yet seen working)

### Connections
- **Microsoft 365 connection** Two Entra app registrations made 14 Sep by Jaiah with Claude driving the browser: "Tariq Assistant" (Mail.ReadWrite, Calendars.ReadWrite, Files.ReadWrite.All, User.Read.All, Contacts.Read, MailboxSettings.Read; access policy = the five-mailbox group) and "Tariq Assistant Send" (Mail.Send only; access policy = tariq@ alone). Certificates, not secrets; both expire 10 Sep 2028. Switched on with scripts/connect-graph.sh, all proofs passed. He says: Nothing to do; it is the plumbing under mail, calendar, files and send. (live 14 Sept 2026)

### Schedules
- **Morning send** Weekday 06:30 brief to Tariq. Delivery fix verified 11 Sep. He says: Runs weekdays at 06:30. (live 11 Sept 2026)
- **Nightly learning** 21:00 memory learning from sent mail and diary. Unattended run verified 10 Sep. Telegram learning is not added yet. He says: Runs nightly at 21:00. (live 10 Sept 2026)
- **Weekly retro** Friday 16:00 review of patterns, skills and memory. Schedule loaded 10 Sep; monthly consolidation is not added yet. He says: Runs Fridays at 16:00. (live 10 Sept 2026)

## Built, not switched on: the code is on the mini, waiting on something outside it

### Skills
- **Tender template** Template skill installed; the source template is not yet reachable. He says: Prepare a tender from my template. Waiting on: Template OneDrive path, allowed folder and Entra connection.

## Parked: deliberately switched off

### Skills
- **Inbox watch** Suggested replies for new mail; built but deliberately disabled. He says: Automatic new-mail review once enabled. Waiting on: Entra apps confirmed and inbox-watch enabled.

## Planned: agreed, not started

### Tools
- **Recall search** Search memory, sessions, raw files, mail index and Build List with source lines. Waiting on: Memory improvement queued after the CRM capability log.
- **Shared read-only base** Nightly workflow export of projects, contacts and promises for personal-agent recall. Waiting on: Memory improvement queued after the CRM capability log.

### Connections
- **Deputy** Not connected as of the 14 Sep handover. Waiting on: Connection not configured.
- **Instagram** Not connected as of the 14 Sep handover. Waiting on: Connection not configured.
- **Monday.com** Not connected as of the 14 Sep handover. Waiting on: Monday.com token awaited.
- **MYOB** Not connected as of the 14 Sep handover. Waiting on: Developer ticket 52306 acknowledged; access not granted.
- **Procore** Not connected as of the 14 Sep handover. Waiting on: Connection and access not confirmed.

### Schedules
- **Monthly consolidation** First-Friday consolidation with a dated archive and rebuilt memory index. Waiting on: Memory improvement queued after the CRM capability log.
- **Remote memory backup** TFA-owned remote backup; current memory git has no remote. Waiting on: Memory improvement queued after the CRM capability log.
- **Telegram learning** Include session logs, completed jobs and rules in nightly learning. Waiting on: Memory improvement queued after the CRM capability log.

Generated by scripts/pull-capabilities.mjs on 2026-09-14.
