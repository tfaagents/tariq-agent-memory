---
name: recurring-inbox-noise
description: "Inbox alerts that look like his problem and are not (the daniel@/dan@ OneDrive storage alerts, retailer and auction mail, Reaction Daily Digest); read the To: line and open the email before any alert becomes a brief line"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 92012670-eaa2-4ca6-a160-cb53ca56a9be
  modified: 2026-10-02T06:04:18.191Z
---

# Inbox alerts that look like his problem and are not

Check this file before any INBOX line in the brief or the close-out. Each of these arrives
again every few days, reads as urgent, and is not his to act on. Naming one as a job for him
costs him a trip to a system that is working fine.

## The rules

1. **Read the To: line, not the subject.** Nearly every one of these is addressed to somebody
   else and lands in his box as a copy (seen 20 Sep 2026).
2. **Open the alert with `mail.mjs read <n>` BEFORE its line is written, not after the brief
   is sent.** No alert earns a brief line from the list and the preview alone. Both failures
   (17 and 20 Sep 2026) came from skimming the list, writing from subject and preview, and
   opening the headers later (seen 20 Sep 2026).
3. Do the read straight after the listing: a row number is not stable between calls, and
   `read 15` once gave two different emails minutes apart (r-20260928-02, open, seen 28 Sep).
4. Since 21 Sep, `mail.mjs inbox` reads the To: line itself: rows matching `config/noise.json`
   go under "Filtered as noise", rows addressed to someone else are marked as a copy, and a
   filtered row is never a brief or close-out line. Jaiah edits that rule file, not this lane
   (seen 2 Oct 2026, "2 rows filtered as noise").

## The recurring ones

- **"Your OneDrive is out of storage space" / "approaching your storage limit"**, from
  no-reply@sharepointonline.com. Addressed to **daniel@ and dan@tfaconstructions.com.au**,
  the two dormant accounts nobody is clearing; the link goes to
  personal/dan_tfaconstructions_com_au. His own drive is fine, it is not an outage, and it
  has nothing to do with the estimators' broken share links (Alee Fateh, Abhinav). Tariq told
  Kendal on 24 Aug 2026: "its for Daniel and old Dan Tu one drive accounts." Seen 11, 12, 13,
  16 and 19 Sep 2026. Do not tell him his drive is full.
  **Wrongly put in the brief as his on 17 Sep 2026 and corrected by a second message the same
  minute. It happened AGAIN on 20 Sep 2026** (the Sat 19 Sep 5:13pm copy), and again needed a
  correction. It is never his.
- **Tool retailer sales mail** (Total Tools, Trade Tools, Sydney Tools, Umart) and the
  auction and travel lists (Lloyds, Grays, Slattery, ALL). Never in a brief.
- **"Reaction Daily Digest"** from Outlook. A thumbs up on one of his emails is not a reply
  and is not a promise being answered.

Related: [[brief-late-defect]] is the same failure on promises, [[promise-scan-window]] on
the scan.
