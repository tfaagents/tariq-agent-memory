---
name: onedrive-privacy
description: His OneDrive Documents folder is private, checked 15 Sep 2026; what this agent can and cannot see about file access
metadata:
  type: project
---

15 Sep 2026 he asked who else in TFA has been in his OneDrive **Documents** folder (47
items), and said to lock it down if nobody had. Checked with
`node local/onedrive-sharing.mjs Documents`: **nothing shared, no permission on any item
but his own, nothing last changed by anyone else.** Nothing needed moving.

What the connection can and cannot answer about access, so this is not re-litigated:

- **Can**: who a file is shared with (Graph `/permissions`), the `shared` flag, and who
  last wrote it (`lastModifiedBy`).
- **Cannot**: who has **opened or viewed** a file. That is the Microsoft 365 unified audit
  log, which needs `AuditLog.Read.All`; the "Tariq Assistant" app does not have it. Filed
  as `r-20260915-02` for Jaiah.
- **True regardless**: a TFA global admin can reach any staff OneDrive, and since 14 Sep
  this agent can read any TFA drive (`--user`). Told him both.

Scope of the connection, asked separately the same morning: the **TFA Microsoft tenant
only**. His personal OneDrive is a separate Microsoft account and is unreachable by any
command here. Six names are refused in every drive per `config/files.json`: Personal,
Tariq Personal, ATO, Tax, Employee Contracts, Contracts - Personal. There is a
`Personal Vault.lnk` shortcut in his TFA Documents; a shortcut only.

See [[bot-builds-doc]] for the drive path habits, [[tfa-systems]] for the connection.
