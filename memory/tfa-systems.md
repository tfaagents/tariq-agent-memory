---
name: tfa-systems
description: What TFA runs on, what this agent can reach today, and what is not connected yet
---

Connected (through tools/)
- **Microsoft 365 mail and calendar**: tariq@, kendal@, heather@, accounts@, agents@.
  Read, search, diary. Reply drafts into Tariq's Drafts folder. No sending, by design.
- **The TFA Agents dashboard** (https://tfas-mac-mini.tail77353f.ts.net, runs on this
  mini): the workflow agents, what is waiting for a person, run log, Run now, Approve
  and Send back. Tariq is the owner login and sees every sector.
- **The store** the workflow agents keep fresh: inbox digest (daily 5:30pm), promise
  tracker (6:00am, from his sent mail), calendar refresh, morning brief, receipts queue.
- **The morning-brief workflow is stale and still climbing: 13 days on 13 Sep, 14 days on
  14 Sep.** `tfa.mjs brief` still returns the brief dated Monday 31 August. The inbox
  digest (13h) and the promise tracker (30 min) stay current, so it is that one agent, not
  the store. Do not quote the brief's email list or diary line without checking the age it
  prints. It has not self-healed in two days, so it is a request for Jaiah now, not a wait.
- **`tfa.mjs brief` still prints a usable diary line** even while the brief body is stale.
  On 14 Sep it gave today's 10am Dan Street entry, 5 minutes old. `mail.mjs diary <days>`
  is the other way in. Reach for both before telling him the diary cannot be read, because
  `calendar.mjs everyone` is still the only one that is genuinely not connected.
- **`tools/notify.mjs` has no flags except `--file` and `--plain`.** Anything else on the
  command line IS the message: `node tools/notify.mjs --help` sent Tariq a Telegram saying
  "\-\-help" at 6:32am on 14 Sep, and again at 6:42am on 15 Sep in the
  same morning-send run, because this note was not read first. Twice now. Read the
  header of the file for usage, never probe it, and read this file before a scheduled send.
- **The promise tracker returned nothing on 14 Sep 2026 9:00pm.** `tfa.mjs promises`
  printed its "tracker ran 15 h ago" header and then "The tracker has no report yet",
  where on 13 Sep the same command listed seven open promises. The header and the body
  disagree, so treat an empty promise list as a tool fault, not as "he owes nobody
  anything", and fall back to reading `mail.mjs sent`.
- **The promise tracker does not notice a promise being kept.** On 13 Sep it still showed
  the Narangba and Bokarina resends as LATE, two days after Tariq resent both folders.
  Always check `mail.mjs sent` before telling him something is late.

The workflow agents (Jaiah's lane, `~/tfa-agents`, never edited from here)
- Accounts: receipts-intake (FLOW 05, receipts by form, Heather approves), invoice-split
  (FLOW 08, one PDF with several invoices, propose only).
- Admin: employee-onboarding (Jotform, MYOB cards held until approved), bulk-emails
  (Kendal's list, sending switched off until Tariq's OK and Mail.Send consent).
- Tariq: daily-inbox-digest, inbox-search (email a question to agents@), morning-brief,
  promise-tracker, calendar-refresh.
- Autoflow: connection-check, wa-health, skill-review.
- Alerts and reports go out on the WhatsApp agent line (0423 720 036, "Tfa Agent").
  That line is workflows only and answers nothing else on purpose.

Not connected yet
- **MYOB AccountRight** (TFA Constructions Pty Ltd file, online): developer application
  submitted 10 Sep 2026; TFA Agent user exists as a File user, needs Administrator. Cost
  and payment questions cannot be answered from MYOB until then.
- **Procore and Pro Scan**: no invite for agents@ yet. Clay's side.
- **OneDrive and SharePoint**: no Files.Read consent yet, so templates and Kendal's filing
  folders are not reachable. Ask for the path and the consent.
  SUPERSEDED 12 Sep 2026, the line below was wrong: "his OneDrive hit its 1 TB limit on
  11 Sep 2026 5:29pm ... which is why Alee Fateh, Abhinav and others could not open the
  drawings." The 1 TB alerts are NOT Tariq's drive. Every one of them is addressed to
  daniel@ and dan@tfaconstructions.com.au, and Tariq told Kendal in his own words on
  24 Aug 2026: "its for Daniel and old Dan Tu one drive accounts." They are dormant
  accounts nobody is clearing, so the same two alerts land again every few days
  (11 Sep 5:29pm, 12 Sep 5:00pm "approaching", 12 Sep 5:24pm "out of storage",
  13 Sep 5:22pm "out of storage"). They are noise in his inbox, not an outage, and they
  have nothing to do with the estimators' broken share links. Do not tell him his drive
  is full. Confirmed again 13 Sep 2026: the link in the alert points at
  personal/dan_tfaconstructions_com_au, not Tariq's drive.
- **Deputy, Monday.com, the six card portals**: not connected. Staff hours are in Deputy
  and cannot be read from here.
- **Mail.Send**: not granted. Nothing on this machine can send an email.

- **ALIS Property Group is getting its own mail domain (21 Sep 2026).** VentraIP
  activated email hosting on **alispg.com.au** that morning, notices to
  web@tfaconstructions.com.au: **tariq@alispg.com.au** at 10:36am and
  **info@alispg.com.au** shortly after. Kendal forwarded both and said "Ill do this for
  you when we next catch up"; Tariq replied "rogy" at 1:10pm. So the ALIS mailboxes exist
  but are **not set up on his devices yet and are not connected to this agent**: his TFA
  mailbox is still the only one readable from here.
- **ProScan** is named by Tariq as TFA's **Procore to MYOB integration** (CA brief to
  Frontline, 21 Sep 2026). Not connected here.

Other tools they pay for: V1CE ("Client Capture OS", the digital business card, sends him
a weekly tap summary; 1 tap in the week to 13 Sep 2026), Procore, Bluebeam (two dead
perpetual licences; new seats are about $450 to $980 a year each), Cubit Estimating trial,
Jotform, Blaze (video), Figma (TFA Constructions team, the flow boards), Monday.com.

- **Monday.com AI credits ran out.** Notice 13 Sep 2026 8:18am: the team is on 0 AI
  credits and Monday's AI features stop in 4 days, so about **17 Sep 2026**, unless
  someone buys more. Monday.com is where TFA's tasks live and mentions in it are how
  urgent estimates reach him. Kendal forwarded the notice to Tariq on 14 Sep 8:38am with
  "Grrrr" and he replied at 9:48am "**what is this exactly?**", so as at 14 Sep he still
  does not know what the credits are or what stops without them. Nobody has costed the
  top-up for him.

The Autoflow flow boards (Figma, reviewed with Jaiah)
- 10 Sep 2026 Jaiah sent **FLOW 01, 09 and 10** to the team to review, questions as
  numbered stickies on each board. **FLOW 01 Employee onboarding** (Kendal and Heather):
  reads the onboarding form, checks MYOB for an existing card, holds the card for Kendal
  to approve; open questions include whether MYOB's Deputy connection is on. **FLOW 09
  Supplier invoices** (Clay): checks each invoice as it lands, lists what is missing,
  drafts the chase, puts a check sheet beside it; the CA still approves in Pro Scan; open
  questions include where invoices land and how an approved cost gets from Procore into
  MYOB. **FLOW 10 Bulk emails** (Kendal): she uploads the list, writes once, checks every
  copy, it sends. **FLOW 10 needs Tariq's own OK for the agent to send externally, with
  Kendal approving every send.** That is his decision to make and it is still open.
- 14 Sep 2026: Tariq chased Jaiah at 3:54pm, "Has the team completed the below ready for
  **tomorrows site visit**?", so Autoflow are on site **Tuesday 15 Sep 2026**. Kendal
  replied at 4:04pm "I havent even got to this yet 😕" and Tariq answered "tsk tsk tsk
  tsk". The three boards are not reviewed going into that visit.
- The four job sites named in FLOW 09 are **Logan Village, Jimboomba, Mariners and Slacks
  Creek**. Mariners is not otherwise in anything read here.
- Clay also wants an agreed "ideal supplier invoice email" (invoice, PO and dockets in
  one) and still owes the **Procore invite for agents@**.
- 14 Sep 2026: the agent's scope is the whole of TFA since 22:37 (Jaiah removed the five-mailbox
  Exchange access policy on the Tariq Assistant app). Graph keeps answering **403 [RAOP]
  Blocked by tenant** from a cache for up to two hours on any mailbox that was asked for
  while the policy was still on (heather@, accounts@, agents@, clay@, nick@, qa@, randal@);
  mailboxes never asked for before (mauricio@, daniel@) read straight away. It clears on
  its own; do not probe it every run, and never call it a wall (r-20260914-09 was filed
  at 22:56 and closed by Jaiah with this explanation). If a box still 403s after 15 Sep
  09:00, that is new and worth one request. Until then: say "could not read X" rather
  than reporting a search from those boxes as empty.
