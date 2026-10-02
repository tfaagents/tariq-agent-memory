---
name: brief-late-defect
description: "How LATE gets called wrong in the brief: the 15 Sep Alee defect, and the settled.mjs --who trap that counts the promise email itself as fulfilment"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 92012670-eaa2-4ca6-a160-cb53ca56a9be
  modified: 2026-10-02T06:04:09.697Z
---

## The rules

1. LATE needs a `settled.mjs --promises` verdict of STILL OPEN and a due date in the past.
   Nothing else may print it. YOU DID IT is a chase on them, never his late promise; DONE is
   never mentioned. The brief skill already carries this rule; the 15 Sep defect was a run
   that did not honour it, not wrong skill text (seen 16 Sep 2026).
2. Until the brief stops getting this wrong, every close-out re-checks each LATE the brief
   printed that morning against `settled.mjs` and says plainly when the brief was wrong
   (seen 15 Sep 2026). See [[rules]].
3. A LATE printed wrongly is a brief-run defect for the Friday retro, not a memory error
   (seen 15 Sep 2026).
4. `--promises` is the authority on a promise. Use `settled.mjs --who <address> --since
   <date> --about "<words>"` for requests, loose ends and dashboard rows (seen 16 Sep 2026).
5. When `--who` contradicts `--promises` on the same promise, check whether the "you sent"
   timestamp is the promise email itself before believing it: `--who` does not apply the
   filter `--promises` does, and once counted the very email in which he made the promise as
   its fulfilment (seen 16 Sep 2026).
6. A promise to do a physical thing (sign a form, attend) can never be settled by mail either
   way, so it stays open until he says otherwise (seen 16 Sep 2026).
7. Over-correcting is the same mistake. A promise restored to the list by hand has skipped
   `--promises`; run `--who` on it alone before printing LATE, and "cannot be proven either
   way" is a reason to check, not to call it late (seen 18 Sep 2026). See
   [[promise-scan-window]].

**Why:** LATE is the most load-bearing word in the brief. Spent on something he already did,
he stops reading the section, and the close-out then has to contradict the brief.

## Where the rules came from

- 15 Sep 2026, 06:32 `/morning-send`: "LATE Alee Fateh: confirm he can open the Narangba
  drawings, due 11 Sep". `settled.mjs --promises` returned YOU DID IT: he sent the documents
  Fri 11 Sep 11:28am, six minutes after promising them. Alee had not replied, so it was a
  chase on Alee. The same run's summary read "9 checked. 0 of them may honestly be called
  LATE." It recurred one day after CLAUDE.md's "Before you say it, check it is still true"
  was written. Rules 1 to 3.
- 16 Sep 2026, 06:30: rule honoured. Narangba went in as a chase on Alee ("you resent the
  Narangba documents 11 Sep, nothing back in five days"), Bokarina was DONE and left out, and
  the only LATE was Heather's work experience form (STILL OPEN + PAST DUE). The same day
  `--who` counted his 11 Sept 10:47am email as fulfilment of that form promise. Rules 4 to 6.
- 18 Sep 2026: that same form was carried back on by hand and called LATE at 06:44. The
  close-out ran `--who` (heather@, since 11 Sep, "Teina Takimoana work experience form"):
  YOU DID IT, he replied on the thread 11 Sep 10:47am, twenty minutes after Heather wrote,
  and the placement started Mon 14 Sep (Clay forwarded it to Daniel). Retracted. Rule 7.
