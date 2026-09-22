#!/bin/zsh
# SessionStart hook. Never blocks a session: every step is best-effort, always exits 0.
cd "$HOME/tariq-agent" 2>/dev/null || exit 0
mkdir -p work/inbox sessions/scheduled
# Pattern notices (a job done three times with no skill, a job that repeats at the same hour)
# used to print here and CLAUDE.md told the agent to offer them to Tariq first. He was being
# asked to decide Jaiah's schedules, twice in eleven replies on 20 Sep 2026. They go to a file
# now and the 17:30 /jaiah-digest carries them to Jaiah.
if command -v python3 >/dev/null 2>&1; then
  python3 .claude/hooks/patterns.py > work/pattern-notices.txt 2>/dev/null || true
fi
# A one-line state stamp so the session knows the day and what is fresh.
echo "STATE: $(date '+%A %-d %B %Y, %H:%M') Brisbane. You are Tariq's personal agent: answer him first, as Claude would, then check what is set up. Reply through the Telegram reply tool. Work from $HOME/tariq-agent."
# Open jobs on the board, so a restart or a compaction never drops one.
if [[ -s work/jobs.json ]] && command -v node >/dev/null 2>&1; then
  OPEN=$(node tools/jobs.mjs list --open 2>/dev/null)
  [[ "$OPEN" == "no jobs" || -z "$OPEN" ]] || { echo "OPEN JOBS (tell him you are picking these back up, then run them):"; echo "$OPEN"; }
fi
exit 0
