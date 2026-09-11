#!/bin/zsh
# SessionStart hook. Never blocks a session: every step is best-effort, always exits 0.
cd "$HOME/tariq-agent" 2>/dev/null || exit 0
mkdir -p work/inbox sessions/scheduled
if command -v python3 >/dev/null 2>&1; then
  python3 .claude/hooks/patterns.py 2>/dev/null || true
fi
# A one-line state stamp so the session knows the day and what is fresh.
echo "STATE: $(date '+%A %-d %B %Y, %H:%M') Brisbane. Reply to Tariq through the Telegram reply tool. Work from $HOME/tariq-agent."
# Open jobs on the board, so a restart or a compaction never drops one.
if [[ -s work/jobs.json ]] && command -v node >/dev/null 2>&1; then
  OPEN=$(node tools/jobs.mjs list --open 2>/dev/null)
  [[ "$OPEN" == "no jobs" || -z "$OPEN" ]] || { echo "OPEN JOBS (tell him you are picking these back up, then run them):"; echo "$OPEN"; }
fi
exit 0
