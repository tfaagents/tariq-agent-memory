---
name: brief-late-defect
description: How LATE gets called wrong in the brief: the 15 Sep Alee defect, and the settled.mjs --who trap that counts the promise email itself as fulfilment
metadata:
  type: project
---

On 15 Sep 2026 the 06:32 `/morning-send` brief printed
"LATE Alee Fateh: confirm he can open the Narangba drawings, due 11 Sep".
`node tools/settled.mjs --promises` returns **YOU DID IT** for that promise: Tariq sent
the documents Fri 11 Sep 11:28am, six minutes after promising them. Alee has not replied,
so it is a chase on Alee, never Tariq's late promise. The same run's verdict summary reads
"9 checked. 0 of them may honestly be called LATE."

`.claude/skills/brief/SKILL.md` already carries the rule (lines 13 and 53: LATE needs a
STILL OPEN verdict past its due date). So the skill text is right and the 06:32 run did
not honour it. This is the exact failure described in CLAUDE.md "Before you say it, check
it is still true", recurring one day after that rule was written.

**Why:** LATE is the most load-bearing word in the brief. Spent on something he already
did, he stops reading the section, and the close-out then has to contradict the brief.

**How to apply:** Raise it at the Friday retro as a brief-run defect, not a memory error.
Until it is fixed, any close-out re-checks every LATE the brief printed that morning
against `settled.mjs` and says plainly when the brief was wrong. See [[rules]].

## 16 Sep: honoured, and a second trap found

The 16 Sep 06:30 brief honoured the rule: Narangba went in as a chase on Alee ("you
resent the Narangba documents 11 Sep, nothing back in five days"), Bokarina was DONE and
left out entirely, and the only LATE was the Heather work experience form, which
`settled.mjs --promises` returns as STILL OPEN + PAST DUE.

**The second trap.** `node tools/settled.mjs --who <address> --since <date> --about
"<words>"` does NOT apply the filter that `--promises` does: it counted Tariq's 11 Sept
10:47am email as fulfilment when that is the very email in which he MADE the promise, and
so returned YOU DID IT for a promise `--promises` calls STILL OPEN + PAST DUE. Taken at
face value it would have deleted a real late item from the brief.

**How to apply:** `--promises` is the authority on a promise. Use `--who` for requests,
loose ends and dashboard rows, and whenever `--who` contradicts `--promises` on the same
promise, check whether the "you sent" timestamp is the promise email itself before
believing it. Also worth knowing: a promise to do a physical thing (sign a form, attend)
can never be settled by mail either way, so it stays open until he says otherwise.

