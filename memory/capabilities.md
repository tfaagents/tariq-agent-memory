# What this agent can do (36 live of 44 logged)

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
- **Promises** Lists what he said he would do, to whom and by when, late ones flagged, with an Outlook link each, read from the promise tracker through the dashboard API. Installed 10 Sep but it returned "no report yet" until 14 Sep 21:47: the dashboard served reports only from digest files and the tracker writes the store (fixed in tfa-agents 7a0e0ab). Seen working on the mini 14 Sep 21:50: 8 open, 2 late. He says: What have I promised? (live 10 Sept 2026)
- **Remember** Saves durable facts into file-based memory. Installed 10 Sep; listed live in the 14 Sep handover. He says: Remember this. (live 10 Sept 2026)
- **Workflow status** Reads workflow status through the dashboard API. Installed 10 Sep; listed live in the 14 Sep handover. He says: How are the workflows going? (live 10 Sept 2026)

### Tools
- **Browser lane** Headless Chrome with an allowlist. Form submission requires Approve. Verified against a test form 11 Sep. He says: Open an allowed site and fill in this form. (live 11 Sept 2026)
- **Build List** Stores build ideas in work/build-list.md and on the dashboard without a notification. Verified end to end 14 Sep. He says: Add this to the list; what is on my Build List? (live 14 Sept 2026)
- **Everyone's calendars** Reads every TFA calendar from the directory (45 accounts, cached in work/people.json), his first, the quiet ones summarised in one line, for the morning brief and "when is Kendal free". Tenant-wide since 14 Sep evening; until Graph picks up the removed access policy (up to two hours) only his and Kendal's read. He says: "What has everyone got on tomorrow?" "When is Clay free this week?" (live 14 Sept 2026, not yet seen working)
- **Microsoft Graph v2** Mail, calendars and OneDrive read through the agent's own Entra app "Tariq Assistant" (id ebb63dd1-040a-4ab4-90fe-070b1f105290), tenant-wide since 14 Sep evening: every TFA mailbox and calendar, his whole OneDrive and any staff member's drive. Proven 14 Sep: his inbox, Kendal's calendar, his and Kendal's OneDrive roots, the directory (45 accounts). (live 14 Sept 2026)
- **OneDrive scope** The whole of TFA since 14 Sep evening (Jaiah): his entire OneDrive and any staff member's drive with --user <address>; his personal documents, ATO, tax and contracts are refused by name in every drive (config/files.json deniedNames). Folder-by-folder picking stays as the way to narrow it again. Seen working 14 Sep evening: his root and Kendal's root listed, denied names shown. He says: "What is in Kendal's Accounts folder?" "Find the tender template." (live 14 Sept 2026)
- **Progress and background jobs** One progress message per job, workers for long tasks, persistent job board. Shipped 10 Sep. He says: Where is that job up to? (live 10 Sept 2026)
- **Read diary** Reads Outlook calendar through mail.mjs diary while the new Entra application is pending. He says: What is on today? (live 10 Sept 2026)
- **Read mail and draft replies** Reads every TFA mailbox through the agent's own app (since 14 Sep 21:40; tenant-wide since 14 Sep evening). Default scope is his own mailbox; another person's only when he names it or the job lives there, and what it finds there is repeated to nobody but him. Outlook drafts require Approve. Verified 10-11 Sep on the five mailboxes. He says: Check my inbox; find Heather's email; what did Clay send about the apprentices; draft a reply. (live 10 Sept 2026)
- **Recall search** Searches memory, every session log, raw/ (including the shared TFA export), the mail index, the job board and the Build List in one go and prints file:line per hit, newest first. The agent runs it before saying "I don't have that" or "you never told me". Seen working on the mini 14 Sep 21:35: found facts in contacts.md, the 21:00 nightly-learn output and the shared export. He says: Have we talked about X? What did I say to Kendal about the tender? What do you know about Jimboomba? (live 14 Sept 2026)
- **Send email** Sends one of his existing drafts as tariq@ through the second app "Tariq Assistant Send" (Mail.Send only, scoped to his mailbox alone; proven 14 Sep that it cannot read mail and is refused on kendal@). Only after his Approve tap on Telegram, which shows to, subject, first lines and attachments. Receipt in work/sent.log. Not yet seen sending a real email. He says: Say "send it" after a draft; approve the prompt on your phone. (live 14 Sept 2026, not yet seen working)
- **Shared read-only base** The workflow lane exports promises, contacts, everyone's calendar, the daily digest and a projects placeholder to tfa-agents/data/shared nightly at 20:30 from its dashboard server. The personal lane reads it at raw/tfa-shared, read only, and recall searches it; a fact taken from it says so and carries the export date. First export written 14 Sep 21:32 and read through the symlink. He says: Nothing to say; it feeds recall and the morning brief. Ask: what does the TFA export say about X? (live 14 Sept 2026)
- **TFA dashboard** Status, waiting items, runs, promises and brief; workflow actions behind Approve. Browser login verified 14 Sep. He says: Show me the dashboard; what is waiting on me? (live 14 Sept 2026)
- **TFA directory** Who is who at TFA from the Microsoft 365 directory (User.Read.All): name, address, title; 45 accounts, cached twelve hours in work/people.json. Feeds "everyone" in the calendar tool and the mailbox scope for search. Seen working 14 Sep evening (find heather gives one match). He says: "What is Heather's email?" "Who is Elycia?" (live 14 Sept 2026)
- **Voice notes** Local Whisper transcription; echoes what was heard before acting. Verified with a real voice note 14 Sep. He says: Send a voice note. (live 14 Sept 2026)
- **Wall list** Records missing tools or connections on the dashboard and notifies Jaiah. Rule-based refusals are never requests. Verified 14 Sep. He says: Ask for something that needs a new connection. (live 14 Sept 2026)
- **Write calendar** Adds or moves events on HIS calendar (Calendars.ReadWrite consented 14 Sep), each behind Approve on Telegram. "Remind me to X on Friday" becomes an 8am entry. Not yet seen writing a real event. He says: "Put X in my diary Friday 8am" or "move my 10am to 2pm", then approve. (live 14 Sept 2026, not yet seen working)
- **Write OneDrive files** Upload, move and attach files in his OneDrive or any staff member's drive (--user), each behind Approve; the off-limits names are refused everywhere. Files.ReadWrite.All consented 14 Sep; scope is the whole of TFA since 14 Sep evening. Not yet seen writing. (live 14 Sept 2026, not yet seen working)

### Rules
- **Decision Book** Records corrections in memory/rules.md; session logs explain actions and their sources. Shipped 14 Sep. He says: Remember this rule; what are my rules? (live 14 Sept 2026, not yet seen working)
- **Plain-language Approve prompts** A plain explanation before each Approve tap. Shipped 14 Sep. He says: Use a command that needs approval. (live 14 Sept 2026, not yet seen working)
- **Plans on every catch** Every wall, build ask, self-build and declined offer is filed with a plan in a fixed shape: What, Uses (live capabilities only), Missing, Self-build yes or no, First step, Size. The plan travels to the dashboard and into the daily digest so Jaiah reviews a proposal, not a bare ask. Declined offers are filed too (kind declined, no ping). He says: Automatic when the agent files a request; Jaiah sees the plan in the digest and on the dashboard. (live 14 Sept 2026)
- **Self-build lane** Instructions permit small scripts under local/ and personal skills; first script run requires Approve. He says: Can you build a report using the tools you already have? (live 14 Sept 2026, not yet seen working)

### Connections
- **Microsoft 365 connection** Two Entra app registrations made 14 Sep by Jaiah: "Tariq Assistant" (Mail.ReadWrite, Calendars.ReadWrite, Files.ReadWrite.All, User.Read.All, Contacts.Read, MailboxSettings.Read) and "Tariq Assistant Send" (Mail.Send only; access policy = tariq@ alone). Certificates, not secrets; both expire 10 Sep 2028. App 1 is tenant-wide since 14 Sep evening (Jaiah: org-wide access): its five-mailbox access policy was removed; the send app stays locked to his mailbox. He says: Nothing to do; it is the plumbing under mail, calendar, files and send. (live 14 Sept 2026)

### Schedules
- **Daily digest to Jaiah** Every day at 17:30 the agent compiles everything it caught since the last digest (Build List asks, walls, things it built itself, offers Tariq declined, blocked jobs, housekeeping such as a stale backup), each with its plan, and sends one WhatsApp message to Jaiah through the dashboard, filed on the Requests page and in data/digests. First real run 14 Sep 21:52: five items, one new wall filed by the agent itself, WhatsApp sent. He says: Nothing for Tariq. Jaiah replies with an id and go, no or later. (live 14 Sept 2026)
- **Monthly consolidation** On the first Friday of each month the retro rewrites every memory file to what is still true, moves the rest to memory/archive/YYYY-MM.md with dates, rebuilds MEMORY.md and keeps files under about 120 lines. rules.md entries are struck through, never moved; raw/ is never touched. Written 14 Sep; first run is Fri 2 Oct, not yet observed. He says: Runs inside the Friday 16:00 retro; nothing to say. (live 14 Sept 2026, not yet seen working)
- **Morning send** Weekday 06:30 brief to Tariq. Delivery fix verified 11 Sep. He says: Runs weekdays at 06:30. (live 11 Sept 2026)
- **Nightly learning** 21:00 memory learning from sent mail and diary, and since 14 Sep the day's session logs, job board, Build List, new rules and the shared export. Unattended run verified 10 Sep; the 14 Sep 21:00 run read 27 sent emails, added three rules and committed. He says: Runs nightly at 21:00. (live 10 Sept 2026)
- **Telegram learning** Nightly learn step 3 reads the day's session logs, the job board, the Build List, new rules and the shared export alongside his sent mail and diary, so what he said to the agent on Telegram counts like what he emailed. Written 14 Sep; first unattended run with the new text is 21:00 Tue 15 Sep, not yet observed. He says: Runs inside the 21:00 nightly learn; nothing to say. (live 14 Sept 2026, not yet seen working)
- **Weekly retro** Friday 16:00 review of patterns, skills and memory; reports a stale backup; on the first Friday of the month it runs the monthly consolidation (added 14 Sep, first run 2 Oct). Schedule loaded 10 Sep. He says: Runs Fridays at 16:00. (live 10 Sept 2026)

## Built, not switched on: the code is on the mini, waiting on something outside it

### Skills
- **Tender template** Template skill installed; the source template is not yet reachable. He says: Prepare a tender from my template. Waiting on: Template OneDrive path, allowed folder and Entra connection.

### Schedules
- **Remote memory backup** At every session end save.sh commits memory, sessions, raw and skills and pushes to TFA's private GitHub repo tfaagents/tariq-agent-memory through a deploy key on the mini; best effort, never blocks a session end; work/backup.log records each push and the Friday retro reports a stale backup. Plumbing on the mini since 14 Sep 21:33 (key, ssh alias, remote); every push fails until the repo exists. He says: Nothing to say; the Friday retro reports if the backup is stale. Waiting on: Jaiah creates the private repo tfaagents/tariq-agent-memory signed in as agents@ and adds the deploy key with write access

## Parked: deliberately switched off

### Skills
- **Inbox watch** Suggested replies for new mail; built but deliberately disabled. He says: Automatic new-mail review once enabled. Waiting on: Entra apps confirmed and inbox-watch enabled.

## Planned: agreed, not started

### Connections
- **Deputy** Not connected as of the 14 Sep handover. Waiting on: Connection not configured.
- **Instagram** Not connected as of the 14 Sep handover. Waiting on: Connection not configured.
- **Monday.com** Not connected as of the 14 Sep handover. Waiting on: Monday.com token awaited.
- **MYOB** Not connected as of the 14 Sep handover. Waiting on: Developer ticket 52306 acknowledged; access not granted.
- **Procore** Not connected as of the 14 Sep handover. Waiting on: Connection and access not confirmed.

Generated by scripts/pull-capabilities.mjs on 2026-09-14.
