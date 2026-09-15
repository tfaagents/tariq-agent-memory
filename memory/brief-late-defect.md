---
name: brief-late-defect
description: The 15 Sep 06:32 brief printed LATE for Alee Fateh against a YOU DID IT verdict; the brief skill has the settled.mjs rule but the run did not honour it
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
