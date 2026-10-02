---
name: tfa-systems
description: "What TFA runs on, what this agent can reach today, and what is not connected yet"
metadata:
  node_type: memory
  type: reference
  originSessionId: 92012670-eaa2-4ca6-a160-cb53ca56a9be
  modified: 2026-10-02T06:04:52.331Z
---

## Connected (through tools/)
- **Microsoft 365, tenant-wide since 14 Sep 2026 22:37** (Jaiah removed the five-mailbox
  access policy on the Tariq Assistant app): every TFA mailbox, every calendar
  (`calendar.mjs everyone`, read for the team line on 22 and 26 Sep), his whole OneDrive and
  any staff drive. Reply drafts go to his Drafts folder. Sending is a separate app scoped to
  tariq@ only, and only through `send.mjs go` behind his Approve (seen 26 Sep 2026; detail in
  `memory/capabilities.md`).
- If a mailbox read fails, say "could not read X"; never report a search from it as empty
  (seen 14 Sep 2026).
- **The TFA Agents dashboard** (https://tfas-mac-mini.tail77353f.ts.net, runs on this mini):
  the workflow agents, what is waiting for a person, run log, Run now, Approve and Send back.
  Tariq is the owner login and sees every sector (seen 14 Sep 2026).
- **The store** the workflow agents keep fresh: inbox digest (daily 5:30pm), promise tracker
  (6:00am, from his sent mail), calendar refresh, receipts queue (seen 14 Sep 2026). The
  workflow lane no longer builds a morning brief: `tfa.mjs brief` points back to this agent
  (seen 17 Sep 2026).
- **The workflow promise tracker** (`tfa.mjs promises`) is not the authority:
  - an empty list is a tool fault, not "he owes nobody anything". On 14 Sep 9:00pm it
    printed "tracker ran 15 h ago" then "The tracker has no report yet" where on 13 Sep it
    listed seven. Fall back to `mail.mjs sent` (seen 14 Sep 2026).
  - it does not notice a promise being kept: on 13 Sep it still showed the Narangba and
    Bokarina resends as LATE two days after he resent both folders. Check before anything is
    called late; `settled.mjs` decides (seen 13 Sep 2026).
- **`tools/notify.mjs` has no flags except `--file` and `--plain`.** Anything else on the
  command line IS the message: `node tools/notify.mjs --help` sent Tariq a Telegram saying
  "\-\-help" at 6:32am on 14 Sep, and again at 6:42am on 15 Sep in the same morning-send run,
  because this note was not read first. Twice now. Read the header of the file for usage,
  never probe it, and read this file before a scheduled send (seen 15 Sep 2026).
- **TFA Automation Flow Tracker, live-linked to the Agents dashboard** (seen 28 Sep 2026).
  SharePoint shared it with Kendal and Tariq at 7:17pm: **agents@tfaconstructions.com.au >
  Documents > Agent Development > TFA Automation Flow Tracker.xlsx**, "a change made here
  shows on the dashboard within a minute, and a change made on the dashboard lands here".
  **Edit this copy, never the emailed V1.** It is Kendal's tracker and the live answer to
  what is being automated and where each flow sits; read it before saying what is built.
- **"Heather time eaters"** (Kendal to Jaiah, 28 Sep 2026 2:46pm): Heather tracked her work
  in time blocks for a week to see what is worth automating. It feeds the next round of agent
  builds and sits in Jaiah's lane (seen 28 Sep 2026).

## The workflow agents (Jaiah's lane, `~/tfa-agents`, never edited from here)
As listed 14 Sep 2026; `node tools/tfa.mjs status` says which are switched on today.
- Accounts: receipts-intake (FLOW 05, receipts by form, Heather approves), invoice-split
  (FLOW 08, one PDF with several invoices, propose only).
- Admin: employee-onboarding (Jotform, MYOB cards held until approved), bulk-emails
  (Kendal's list, sending switched off until Tariq's OK and Mail.Send consent).
- Tariq: daily-inbox-digest, inbox-search (email a question to agents@), promise-tracker,
  calendar-refresh. (morning-brief no longer builds one, seen 17 Sep.)
- Autoflow: connection-check, wa-health, skill-review.
- Alerts and reports go out on the WhatsApp agent line (0423 720 036, "Tfa Agent"). That line
  is workflows only and answers nothing else on purpose.

## Not connected yet
- **MYOB AccountRight** (TFA Constructions Pty Ltd file, online): developer application
  submitted 10 Sep 2026; TFA Agent user exists as a File user, needs Administrator. Cost and
  payment questions cannot be answered from MYOB until then (seen 10 Sep 2026).
- **Procore**: no invite for agents@ yet; Clay's side, and he still owes it. Jaiah asked him
  for it directly on 14 Sep 11:35pm (seen 14 Sep 2026).
- **ProScan** (also written Pro Scan) is named by Tariq as TFA's **Procore to MYOB
  integration** (CA brief to Frontline, 21 Sep 2026). Not connected here.
- **Deputy, Monday.com, the six card portals**: not connected. Staff hours are in Deputy and
  cannot be read from here (seen 14 Sep 2026). Monday.com: a token reached Jaiah 15 Sep but
  no tool reads it yet (seen 15 Sep 2026, `memory/capabilities.md`).
- **ALIS Property Group mail (alispg.com.au)**, activated by VentraIP on 21 Sep 2026, notices
  to web@tfaconstructions.com.au: **tariq@alispg.com.au** at 10:36am and **info@alispg.com.au**
  shortly after. Kendal forwarded both ("Ill do this for you when we next catch up"); Tariq
  replied "rogy" at 1:10pm. Not set up on his devices and not connected to this agent: his
  TFA mailbox is the only one of his readable from here (seen 21 Sep 2026).
- The "OneDrive out of storage" alerts are not his drive: they are for the dormant daniel@
  and dan@ accounts. Detail and the rule in [[recurring-inbox-noise]] (seen 19 Sep 2026).

## Other tools they pay for
V1CE ("Client Capture OS", the digital business card, sends him a weekly tap summary; 1 tap
in the week to 13 Sep 2026), Procore, Bluebeam (two dead perpetual licences; new seats are
about $450 to $980 a year each), Cubit Estimating trial, Jotform, Blaze (video), Figma (TFA
Constructions team, the flow boards), Monday.com (seen 13 Sep 2026).
- **Monday.com AI credits ran out.** Notice 13 Sep 2026 8:18am: the team is on 0 AI credits
  and Monday's AI features stop in 4 days, so about **17 Sep 2026**, unless someone buys more.
  Monday.com is where TFA's tasks live and mentions in it are how urgent estimates reach him.
  Kendal forwarded it 14 Sep 8:38am with "Grrrr"; he replied 9:48am "**what is this
  exactly?**". As at 14 Sep he did not know what the credits are or what stops without them,
  and nobody had costed the top-up (seen 14 Sep 2026).

## The Autoflow flow boards (Figma, reviewed with Jaiah)
- 10 Sep 2026 Jaiah sent **FLOW 01, 09 and 10** to the team, questions as numbered stickies.
  **FLOW 01 Employee onboarding** (Kendal and Heather): reads the onboarding form, checks MYOB
  for an existing card, holds the card for Kendal to approve; open questions include whether
  MYOB's Deputy connection is on. **FLOW 09 Supplier invoices** (Clay): checks each invoice as
  it lands, lists what is missing, drafts the chase, puts a check sheet beside it; the CA still
  approves in Pro Scan; open questions include where invoices land and how an approved cost
  gets from Procore into MYOB. **FLOW 10 Bulk emails** (Kendal): she uploads the list, writes
  once, checks every copy, it sends.
- **FLOW 10 needs Tariq's own OK for the agent to send externally, with Kendal approving
  every send.** His decision, still open as at 14 Sep 2026.
- The four job sites named in FLOW 09 are **Logan Village, Jimboomba, Mariners and Slacks
  Creek** (seen 10 Sep 2026).
- Clay also wants an agreed "ideal supplier invoice email" (invoice, PO and dockets in one)
  (seen 10 Sep 2026).
