#!/bin/zsh
# Starts Tariq's agent session in a detached screen if it is not already running, plus the
# agent's own scheduler in a second window of the same screen.
# Called at boot and every five minutes by launchd (a LaunchDaemon running as the tariq
# user, or a LaunchAgent while it still runs under tfaagents).
# Attach to watch or to run /telegram:access:   screen -r tariq     (detach: ctrl-a d;
# ctrl-a n switches between the session and the scheduler windows)
export PATH="$HOME/.local/bin:$HOME/.bun/bin:/usr/local/bin:/opt/homebrew/bin:$PATH"
export CLAUDE_CODE_OAUTH_TOKEN="$(cat "$HOME/.claude-oauth-token" 2>/dev/null)"
cd "$HOME/tariq-agent" 2>/dev/null || exit 0
mkdir -p work/inbox sessions/scheduled
# No bot token yet = nothing to listen to. Stay quiet rather than burn a session.
[[ -s "$HOME/.claude/channels/telegram/.env" ]] || exit 0
screen -list 2>/dev/null | grep -q '\.tariq[[:space:]]' && exit 0
# Claude Code caches a "needs auth" verdict against an MCP server that failed once and then
# skips it silently on every later launch (seen 10 Sep 2026: the Telegram bridge never
# started after a restart). Drop the plugin's entry before each launch.
python3 - <<'PY' 2>/dev/null || true
import json, os
p = os.path.expanduser('~/.claude/mcp-needs-auth-cache.json')
try:
    d = json.load(open(p))
except Exception:
    d = None
if isinstance(d, dict):
    for k in [k for k in d if 'telegram' in k]:
        d.pop(k)
    json.dump(d, open(p, 'w'))
PY
CMD='claude --channels plugin:telegram@claude-plugins-official --permission-mode auto'
screen -dmS tariq zsh -lc "export PATH=\"$PATH\"; export CLAUDE_CODE_OAUTH_TOKEN=\"$CLAUDE_CODE_OAUTH_TOKEN\"; cd \"$HOME/tariq-agent\" && $CMD; sleep 20"
# The scheduler for unattended runs (config/schedule.json): a second window of the same
# screen, so one `screen -r tariq` shows both. No launchd for it, no admin rights.
screen -S tariq -X screen -t scheduler zsh -lc "export PATH=\"$PATH\"; export CLAUDE_CODE_OAUTH_TOKEN=\"$CLAUDE_CODE_OAUTH_TOKEN\"; cd \"$HOME/tariq-agent\" && node tools/scheduler.mjs >> work/scheduler.log 2>&1"
echo "$(date '+%Y-%m-%d %H:%M') started tariq session and scheduler" >> "$HOME/tariq-agent/work/start.log"
