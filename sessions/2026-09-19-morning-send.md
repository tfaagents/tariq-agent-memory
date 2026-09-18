---
job: Scheduled morning brief for Sat 19 Sep, pushed to his Telegram
slug: morning-send
type: report
started: 2026-09-19T06:30
ended: 2026-09-19T06:44
outcome: done
skill: morning-send
---

## Asked
Scheduled run, Tariq not present. Do only what needs no approval. Build the brief exactly
as /brief does, save it to work/briefs/, push it with notify.mjs, finish with three lines.

## Did
- `node tools/calendar.mjs everyone 1`: his line read fine, nothing in the window for him
  or for any of the 33 other TFA mailboxes. Saturday.
- `node tools/mail.mjs diary 3` for what is coming: Mon 21 Sep only (Clay catchup 9am,
  Aliyah's formal 1pm Sanctuary Cove, Heather on the ATO portal 2pm).
- `node tools/mail.mjs inbox 14`: thirteen overnight, twelve of them lists and alerts.
  Opened 8, 12 and 4 to read the To: line before judging them.
- `node tools/promises.mjs list`: last scan Fri 18 Sep 06:16, ~24h old, over the 18h line.
  Ran `candidates 14` to see what was new, then deliberately did NOT `save` (see Why).
- `node tools/settled.mjs --promises`: 3 checked, 0 may honestly be called LATE.
- Carry-forward check against `sessions/scheduled/2026-09-1[678]-*promises-scan.md`, per
  memory/promise-scan-window.md, run before writing the message rather than after.
- `node tools/tfa.mjs waiting`, `requests.mjs list --open`, `list --build`,
  `recall.mjs "tender template folder" --since 14d`, `recall.mjs "Scribe seats" --since 14d`,
  and a sweep of sessions with outcome partial or blocked.
- Wrote `work/briefs/2026-09-19.txt` (955 chars) and sent it:
  `node tools/notify.mjs --file work/briefs/2026-09-19.txt` returned "sent to 1 chat".

## Why
**The scan was stale and I still did not re-run `save`.** `candidates 14` came back with
100 messages reaching only to 2026-09-15T01:55Z, the known cap (r-20260917-01,
memory/promise-scan-window.md). The Ali Family Trust email of 14 Sep, which carries open
promise 2, is outside that window, so `save` would have rewritten `work/promises.json`
without it and deleted a live promise. `save` only accepts indexes into the candidate
list, so there is no way to carry it through. Keeping the 18 Sep list intact and reading
the new mail by hand loses nothing: only one promise has been made since that scan.

**The one new promise, added by hand to the brief, not to the list.** i=13, 18 Sep 9:31am
to Veena and Clay on the Mitchell Brandtman fee proposal for Dan St: "I will complete the
funding feasibility submission and contract." No date, so it cannot be late. It is in
PROMISES as a commitment of his, not as a chase.

**Nothing printed LATE.** All three saved promises have `due: null`, so none can be past
its date, and settled.mjs agrees (0 LATE). Promise 1 is THEY REPLIED (Heather, wish list),
2 is STILL OPEN (Shane, Ali Family Trust) but dateless, 3 is YOU DID IT (Kendal, Forvm)
and so is left out of the brief entirely.

**Carry-forward, both items resolved rather than restored.** Stamford Capital / Grant Rex
on Dan St is due 30 Sep, NOT DUE, left out per the skill. Teina Takimoana's work
experience form was retracted at the 18 Sep close-out: settled.mjs --who showed he
answered Heather on that thread 11 Sep 10:47am and the placement started 14 Sep. It was
never late, so it is not restored.

**The OneDrive storage alert was left out on purpose.** Email 8 looks like his and is
addressed to daniel@ and dan@, the dormant accounts, per
memory/recurring-inbox-noise.md. Read the To: line, not the subject. It was wrongly put in
the brief once, on 17 Sep.

**The $11,000 Sniip bill went in even though it is addressed to accounts@.** RCH Holdings
INV-0027 is due Mon 21 Sep and his 3:30pm payment cutoff (memory/rules.md, 14 Sep) makes
Monday the only day for it. The line says plainly it went to Heather, not him.

**LOOSE ENDS left out, section omitted.** Scribe seats and the tender template folder each
ran three mornings (15, 16, 17 Sep) and went to the retro on 18 Sep. The Documents-viewers
request ran its three (16, 17, 18 Sep) and goes the same way. The two partial/blocked
sessions of 10 and 11 Sep were both verified resolved at yesterday's retro. Nothing honest
was left to put there, so the section is not printed.

## Checked
- `awk 'length>80'` on the brief: no line over 80 characters after trimming line 1.
- No em dash in the file; 955 characters, well under 1,500.
- `notify.mjs` reported delivery to 1 chat.
- Every promise verdict taken from `settled.mjs --promises`, not from the raw scan.
- Every inbox alert tested on its To: line before inclusion.

## Left
- `work/promises.json` still holds the 18 Sep scan. Promise 3 (Kendal, Forvm) is YOU DID IT
  and could be closed with `promises.mjs done 3` once he confirms.
- The 18 Sep Dan St commitment to Veena and Clay is in this log and in today's brief but
  NOT in `work/promises.json`, because saving it would have deleted the Ali Family Trust
  one. It needs carrying by hand until r-20260917-01 is fixed. Jaiah owns that fix.
- Shane's $42.50 Bunnings receipt is still ready on the dashboard and needs his tap.
- Scribe seats (r-20260914-08), the tender template folder (r-20260914-06) and the
  Documents-viewers audit (r-20260915-02) are all with Jaiah or waiting on an answer from
  Tariq, and are now retro items rather than brief items.

## Links
- work/briefs/2026-09-19.txt
- work/promises.json, /tmp/cand.json (the candidate read)
- memory/promise-scan-window.md, memory/recurring-inbox-noise.md, memory/brief-late-defect.md
- sessions/scheduled/2026-09-18-1630-close-out-send.md, sessions/scheduled/2026-09-18-1600-retro.md
