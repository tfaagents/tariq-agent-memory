#!/bin/zsh
# Daily rollover: give the agent a fresh context every morning, with everything it learned
# already on disk. Run by the scheduler at 05:00 (after nightly-learn at 21:00 has written
# memory), or by hand: zsh .claude/hooks/rollover.sh
#
# Why: one long-lived chat session fills its context over days. Claude Code compacts it
# automatically (a summary replaces the older turns), which keeps it running but blurs
# detail. Memory lives in files, not in the chat, so a clean restart loses nothing that was
# written down and starts each day sharp. The SessionEnd hook commits memory on the way out.
export PATH="$HOME/.local/bin:$HOME/.bun/bin:/usr/local/bin:/opt/homebrew/bin:$PATH"
cd "$HOME/tariq-agent" 2>/dev/null || exit 0
# Never roll over mid-job: wait up to 10 minutes for the session log to go quiet.
LOG=$(ls -t "$HOME/.claude/projects/-$(echo "$HOME" | tr '/' '-')-tariq-agent"/*.jsonl 2>/dev/null | head -1)
for i in {1..20}; do
  [[ -n "$LOG" ]] || break
  age=$(( $(date +%s) - $(stat -f %m "$LOG") ))
  (( age > 120 )) && break
  sleep 30
done
echo "$(date '+%Y-%m-%d %H:%M') rollover: restarting the session" >> work/start.log
screen -S tariq -X quit 2>/dev/null || true
sleep 5
zsh "$HOME/tariq-agent/.claude/hooks/start.sh"
