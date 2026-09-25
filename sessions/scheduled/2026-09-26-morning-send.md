# morning-send, Sat 26 Sep 2026 06:30

Unattended. Brief built and sent to his Telegram, one chat.

## What was read
- `calendar.mjs everyone 1`: his only entry is the Wed 23 Sept 12:00pm School Holidays
  Out of Office. Nothing in the window for the other 33 mailboxes. `mail.mjs diary 2`
  agrees. Saturday, so a thin diary is real, not a read failure.
- `mail.mjs inbox 14`: 10 shown, 4 filtered as noise. Six of the ten are "copy, addressed
  to" accounts@ or info@ (three Hastings Deering invoices, the Xero Instant Green Nursery
  $15,790.83 due 30 Sep, the intercompany loans reminder, the DPO surcharge notice) and two
  are agent marketing (RE/MAX, eplace). Left out per the rule. Two were his and both were
  read in full: Hishaam Tayob 7:26pm and Clay 4:50pm.
- `tfa.mjs waiting`: 11 invoice-split rows ready, unchanged from yesterday, biggest Astro
  Klean $31,641.50.

## The promise scan
The 06:15 scan does not run Saturdays, so the list was 24 hours old, over /brief's 18 hour
line. Refreshed here.

`candidates 14` returned **248** emails, 13 Sep 22:05Z to 25 Sep 13:12Z. Only four were sent
after the 25 Sep 06:17 scan (i:0 Kendal on the Urban Leader Awards, i:1 Morgan Coleman and
i:3 Daniel Deasy at Pickles on passed-in assets, i:2 a forward to accounts). **None carries a
promise**: i:0 and i:2 are statements and a forward, i:1 and i:3 are him asking them for
something, not the other way round. Wrote `[]` to `work/promise-findings.json` and saved.

Per [[promise-scan-window]] the live rule is report only what is not already in
`work/promises.json`, so an empty findings file is the correct answer, not a skipped save.
`save` returned "11 open promises from 248 sent emails, 11 carried from earlier scans".
All eleven carried, nothing dropped, no duplicate row, so r-20260923-01 did not fire. The
Stamford Capital promise (10 Sep, due 30 Sep) is still outside the window and still carried.

`settled.mjs --promises`: 11 checked, **0 may honestly be called LATE**. Four NOT DUE
(CofC 2 Oct, Reece 30 Sep, Collingwood Park 2 Oct, Stamford 30 Sep), five
STILL OPEN but none with a due date, one THEY REPLIED (Heather's office wish list), one
YOU DID IT (Kendal's tender price section). No LATE line went in the brief.

## Why the first line is Hishaam
He replied on the Progress Claim 16 thread at 7:26pm Friday, the same thread as the promise
Tariq made on Thursday to have the CofC by Fri 2 Oct. The reply moves the goalposts: above
97.5 percent the financier wants a Certificate of Practical Completion **as well as** the
CofC, plus Form 12s, Form 43s, Form 71, QFES sign-off, a Stat Dec and a tax invoice. That is
money with a date attached to a promise already on his list, so it outranked everything else.
Clay's Friday review is the second line because it is progress, not a request, but both the
Chateau clarifications and the Alan Robertson pricing land COB Fri 2 Oct, same day as the CofC.

## Written
- `work/briefs/2026-09-26.txt`, 877 characters, plain text, no drafts and no offer.
- `node tools/notify.mjs --file work/briefs/2026-09-26.txt` -> sent to 1 chat.

Nothing needed approval and nothing was sent on his behalf. No requests filed for Jaiah:
every tool answered.
