# TFA team workflows — what the mail actually shows

Generated 2026-08-31 by `runner/map-workflows.mjs` over 120 days of mailbox metadata.
Read-only, **no email bodies** — who, when, what subject, was there an attachment.

**This is not a process map. It is the shortlist to go and map**, and the opening
question for each. Nothing here is confirmed with the person yet, and nothing becomes a
process card until it is.

## Why it was done this way

Asking someone to describe their processes is the slowest and least accurate way to
find them. People describe the interesting parts and skip the forty repetitions that
actually cost the time, because those are invisible from the inside. Their sent folder
is not — it measures the repetition exactly.

So this replaces the blank page, not the recordings. You walk in with *"you send this
same email about 40 times a month, walk me through one"* instead of *"tell me about
your processes"*, and the session is a third as long and lands on what matters.

**One correction worth keeping.** The first run reported Kendal at 697 sent, 69
received. Not credible for an admin — it was reading only the Inbox folder, which
measures what is **unfiled**, not what arrived. For someone who files as they go that
reads as almost no incoming mail, the opposite of the truth. Reading across all folders
gave 771 received. Always sanity-check a number before building on it.

---

## The systems the team is actually downstream of

This is the most useful single finding, because each one is a candidate **connection**,
and reading a system directly always beats reading its notification emails.

| System | Emails in 120 days | Who | What it means |
|---|---|---|---|
| **Monday.com** | 45 | Kendal | Confirmed as central. Currently we only see its notification emails, which is reading the shadow. |
| **Seek** (3 senders) | 44 | Kendal | Recruitment is a real, high-volume, repetitive workflow. It was on Tariq's list and the mail proves it. |
| **MYOB** | 63 + 12 | Heather, Kendal | See the 2FA finding below. |
| **Procore** | ~18 | Kendal | Account and project setup, not day-to-day use. |
| Dropbox, Teams, SharePoint | ~35 | Kendal | File sharing and folder setup. |
| The Urban Developer | 37 | Kendal | Industry newsletter. Noise, not workflow. |

## The finding worth acting on first

**Heather receives a MYOB two-factor code 63 times in 120 days** — roughly every other
working day, and it is the single most frequent thing in her mailbox.

Two things follow:

1. It is friction nobody has counted. Ask her what she is logging in to do each time.
2. **It is a hard constraint on every MYOB automation we might build.** An agent cannot
   pass an interactive 2FA challenge. Anything touching MYOB has to go through the API
   with its own credential, not by driving her login. Worth confirming before promising
   anything MYOB-shaped.

Also: **Heather sent 2 emails in 120 days from `heather@`, and received 189.** She
works out of `accounts@`, not her named mailbox. Any agent for her must be pointed at
the shared inbox.

And **18 "Scan Data from FX-D6E79E" emails with attachments** — a scanner mails paper
into the mailbox. That is the front of the supplier-invoice process, and it is a clean
automation trigger.

---

## The headline: they are already paying people to do this

**294 of the 315 emails `accounts@` sent in 120 days went to two outsourced
data-entry addresses** — `daniel948@scan.prokitplus.com` (193) and
`proscantfa@scan.smoothx.com` (103). About **17 invoice forwards a week**.

Those same two addresses sit in nearly every named supplier invoice thread: Bunnings
27, Saunders Waste 20, Jimboomba Timbers 16, Neilsen's 15, Reece 18, Brissie Auto
Electrics 8, Astro Klean 7, Meer Tile Market 7, Nickellcrete 6, Wagners 5, Plasta
Trade 5, Jaybro 5.

And separately: **19 emails from Upwork reviewing proposals for a "MYOB Data Entry
VA"**, plus 8 manual-time notifications. They are actively recruiting a person to do
the same job.

**So supplier invoice entry is not a hypothetical automation. It is a line item they
are already paying for, twice.** That makes it the first agent to build and the easiest
one to price, because the value is a number they already know rather than an estimate
we have to defend.

**Before promising anything, find out:**

1. What do prokitplus and smoothx actually cost per month, and what do they return —
   keyed MYOB entries, or coded data someone still has to import?
2. Is the Upwork VA hire going ahead? If so this conversation is urgent, because a
   hired person is much harder to unwind than a cancelled subscription.
3. Where does the human judgement sit — coding to a job, GST treatment, approving
   payment? That part stays human. Getting the data in is what gets automated.

## `accounts@` — 8 candidates, from 1,129 emails

| # | Candidate process | Frequency | Evidence |
|---|---|---|---|
| 1 | **Supplier invoice entry** | ~17/week | 294 of 315 outbound to two outsourced scan services |
| 2 | **Office scanner intake** | ~4/week | "Scan Data from FX-D6E79E" 65 times, 64 with attachments |
| 3 | MYOB data-entry VA sourcing | ~1-2/week | 19 Upwork proposal reviews, 8 manual-time flags |
| 4 | **Wages ABA payment run** | ~3-weekly | "ABA file for payment today please", tagged to pay weeks |
| 5 | T Ali & Sons overdue tax debt | ~3-weekly | 6 threads, one marked "for BPay today please" |
| 6 | Cummins invoice chasing | ~3-weekly | 6 threads — the supplier who does *not* come through the scanner |
| 7 | NAB Slacks Creek account query | ~3-weekly | 6 threads with two NAB bankers |
| 8 | Apprenticeship training contracts | ~monthly | 5 threads, all with attachments |

**Money-moving stays human.** Candidates 4 and 5 are payment runs. The safe shape is
read-only preparation and a person pressing the button, exactly as agreed for payroll
in `agent-list-2026-08-24.md`. Do not soften that.

Candidate 6 is worth a question on its own: **why does Cummins have to be chased when
every other supplier comes through the scanner?** The exception usually explains the
rule.


---

## Kendal — 7 candidates, from 1,468 emails (697 sent, 771 received)

She sent Tariq **306 emails in 120 days** — about 2.5 a working day. She is his routing
layer, by hand. Worth understanding before automating anything else of hers.

| # | Candidate process | Frequency | Evidence |
|---|---|---|---|
| 1 | **7-9 Dan St, Slacks Creek deal coordination** | ~4/week | Six separate subject threads on one property: Management 18, Concept Fee Proposal 13, Land Acquisition 11, Agenda Topics 11, Portfolio Update 10, PEXA Settlement 8 |
| 2 | **Seek candidate review for open roles** | ~3/week | Daily candidate updates 35, high-fit shortlists 10 |
| 3 | **New project folder setup & sharing** | ~1/week | 19 "shared the folder", 18 of them sent by her |
| 4 | **Letters of Demand — Beaudesert Child Care** | ~3/month | 13 emails, 9 attachments, with accounts@ and the subcontractor |
| 5 | **Project insurance quote requests** | ~1/week | 8 with the broker, 7 with Master Builders QLD |
| 6 | **Procore account & project setup** | ~1/week | 10 usage/product threads, 8 on Slacks Creek setup |
| 7 | Kangjia Zhang correspondence | ~2/month | 10 emails — probably not a process, ask what it is |

**Opening questions**, generated with each candidate, are in
`tfa-agents/data/workflows/kendal.json`. The best one:

> *"Walk me through what happens when one of these Seek updates lands — where does it
> go from your inbox?"*

Note **candidate 1 is a project, not a process.** Dan St dominates because it is the
live deal, not because coordinating it is repeatable. Do not build for it; use it to
ask what she does for *every* project.

---

## What this does not tell you

Be straight about the limits when you take this to the team:

- **Metadata only.** It knows work repeats, how often, and with whom. It knows nothing
  about what any email said or what she actually does with it.
- **Email-shaped work only.** Anything Kendal or Heather does in Monday.com, MYOB or on
  paper is invisible here. The recordings still have to happen.
- **Volume is not value.** The newsletter is the third most frequent thing in Kendal's
  mailbox and is worth nothing.
- **A candidate is a hypothesis.** It becomes a process card only once the person has
  confirmed it, in the fixed format in `process-mapping-kit.md`.

## Next

1. **Take this list to Kendal and Heather** and use the opening questions. Their
   corrections are the real map.
2. **Record two tasks each** with the record-while-working method. The two best first
   candidates, and it is not close: **the supplier invoice run** (17 a week, already
   being paid for twice) and **the Seek candidate review** (3 a week, clear trigger,
   obvious output).
3. **Extract to process cards** using the prompt in `autoflow-ai/process-capture-kit.md`.
4. **Then** decide which becomes an agent. Not before.

**Still blocked:** the FigJam review board needs a Figma account on
`jaiah@autoflowai.com.au`. The connector is authenticated as `jaiah@onelifeclub.com`,
which is an employer address and cuts against workspace hard rule 2. Nothing goes on
the OLC-linked account.
