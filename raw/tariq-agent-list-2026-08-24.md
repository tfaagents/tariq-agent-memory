# Tariq's agent and automation list — received 24 Aug 2026

Source: "TFA Agents and Automations Mapping.pdf" from Tariq (6 pages of phone-note
screenshots). Original filed alongside this doc as `tariq-agent-list-2026-08-24.pdf`,
in the CRM (TFA card → Documents), and in Drive (Clients/TFA Constructions).
Every item is also a row in the CRM agent register (TFA card → Agent register).

Transcribed verbatim below, then triaged. Anything marked **[unclear]** needs Tariq's
answer before it can be specced.

## Verbatim transcription

**TFA List**
1. Vehicle registers
2. Checkin in weekly of staff times
3. Auto weekly report from Deputy
4. Mostly attendance sheets
5. Weekly computer use and down time per admin staff / all staff

**Project team**
1. VA automations
2. List of tasks on monday to create auto from voice on WhatsApp *(assume Monday.com — [unclear: Monday.com or the weekday?])*
3. Work flows automation from clays images and videos *([unclear: "Clay's" — a person? or "client's"?])*
4. Induction or orientation simulation
5. Company wide SOPs

**Kendal**
1. Links for everything she is working on
2. Auto update on hours working on what
3. Filing and software stuff

**Accounts**
1. Automate payroll
2. Link MYOB to spreadsheet
3. Create all auto data work for Heather to eliminate repetitive works

**Tariq List**
1. Give me daily logs of what staff did on laptops and hours worked
2. What they finished on their targets
3. Create AI agents for: marketing, feeso *([unclear])*, website scraping for client
   future pricing, email blasting, scraping for cranes, finding sites, creating
   comparisons for Bardon Rd, monitoring staff etc, LinkedIn, scrapers, recruiting,
   quote searching, procurement spreadsheet populating for cas *([unclear])*
4. Create something to manage tasks and delegation to staff

## Triage — what each item actually is

Not everything on the list is an agent. Four buckets:

| Bucket | Items |
|---|---|
| **Agent** (scheduled, express-train, buildable on the mini) | Deputy weekly report; weekly staff times check-in; attendance sheets; vehicle register watch; daily staff hours digest; target completion digest; MYOB→spreadsheet; quote searching; crane/site/pricing scraping; Bardon Rd comparisons; recruiting/LinkedIn search |
| **Automation with new plumbing** (needs a connection that doesn't exist yet) | WhatsApp voice → task list (needs WhatsApp Business API — already on the connections ask list); task management + delegation (needs the task tool decided: Monday.com?) |
| **Buy, don't build** | Computer use / downtime / "what staff did on laptops" monitoring — that is employee-monitoring software, a product category, plus a workplace-surveillance policy question in QLD. An agent can *summarise* its reports; we should not build the surveillance itself. |
| **Content project, not software** | Company-wide SOPs (feeds off Heather's process capture, already running); induction/orientation simulation; "VA automations", "filing and software stuff", Kendall's items — too vague to spec, need one paragraph each from the person |

**Payroll:** never fully automated. The safe shape is MYOB read-only → prepared payroll
summary → a human presses the button. Money-moving stays human.

## Recommended order — Tariq first

Per Jaiah's call 2026-08-24: build for Tariq's own use first, not the team.

**Wave 1 — Tariq, buildable next (one new connection: Deputy API):**
1. **deputy-weekly-report** — Tariq's Monday-morning email: hours by person, attendance
   exceptions, week-on-week. Covers TFA list items 2, 3 and 4 in one agent.
2. **daily-staff-digest** — end-of-day email: who worked what hours (Deputy), flagged
   gaps. The "what they did on laptops" half is the monitoring product, not this agent.
3. **vehicle-register-watch** — rego/service due dates from one shared sheet; reminder
   email 4 weeks and 1 week out. Smallest, safest, very visible.

**Wave 2 — Tariq, needs new plumbing or a decision:**
4. **whatsapp-task-capture** — Tariq sends a voice note; it becomes a written task in
   the task tool with an owner. Blocked on WhatsApp Business API + which task tool.
5. **quote-search / procurement / scraping family** — one narrow agent at a time from
   Tariq list 3, once wave 1 has proven the pattern. First pick after clarification.

**Wave 3 — team (Heather, Kendall, project team):**
6. **myob-to-spreadsheet** (read-only) → then Heather's repetitive-work agents, specced
   from her Loom process capture.
7. Kendall's links hub + hours updates, once she's written a paragraph on each.

**Ask Tariq (blocking clarifications):** "feeso"? "for cas"? "Clay's images"?
Monday.com or weekday? Which monitoring product/policy stance for staff laptops?

## Gate note

Agreement still unsigned and deposit unpaid as of 2026-08-24. Speccing, registering
and clarifying are fine; wave 1 build starts when the gate is passed.
