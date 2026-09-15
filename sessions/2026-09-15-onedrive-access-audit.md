---
job: who else can reach his OneDrive Documents folder, and lock it if nobody
slug: onedrive-access-audit
started: 2026-09-15T04:55
finished: 2026-09-15T05:05
---

## What he asked
Voice note, 04:55: everything in his TFA OneDrive Documents folder is for his eyes only.
Who other than him has been clicking into and operating in these files? If nobody
recently, move them so no one else inside TFA can read, view, edit or access them.

## What I did
- Checked what the connection can actually answer. The "Tariq Assistant" Entra app holds
  Mail.ReadWrite, Calendars.ReadWrite, Files.ReadWrite.All, User.Read.All, Contacts.Read,
  MailboxSettings.Read. No AuditLog.Read.All, so **who viewed a file is not readable**.
- Built `local/onedrive-sharing.mjs` (read only): for each item in a OneDrive folder it
  reads `/permissions`, the `shared` flag and `lastModifiedBy`. It honours the same
  `config/files.json` deniedNames gate as `tools/files.mjs`. First run approved by him.
- Ran it on Documents. **47 items, 0 shared, 0 with any permission but his own, 0 last
  changed by anyone else.**
- Told him nothing needs moving, and named the two things that are true anyway: a TFA
  global admin can reach any staff OneDrive, and this agent has org-wide drive read since
  14 Sep on his own instruction.
- Filed `r-20260915-01` (built) and `r-20260915-02` (AuditLog.Read.All, a wall for Jaiah).

## Why
- Did not "move" or re-permission anything: the audit came back clean, so the action he
  asked for had no work in it. Changing permissions is also a tenant write and Jaiah's
  lane, and he asked for it conditional on someone having been in there.
- Built the check under `local/` rather than calling it a wall, per rule 2 in CLAUDE.md:
  it only calls `tools/lib/connected.mjs` and reads. Nothing in `tools/`, `config/` or
  `runner/` was touched.
- Separated what the data shows (sharing, last writer) from what it does not (views), and
  said so rather than letting "nobody has been in there" cover both.

## What needs him
- Offered the same check across the rest of his drive, or tightening what this agent
  itself can reach.
- Jaiah: AuditLog.Read.All if he wants the "who opened it" answer.
