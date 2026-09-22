#!/bin/zsh
# Starts Tariq's agent session in a detached screen if it is not already running, plus the
# agent's own scheduler in a second window of the same screen. If the screen is up but its
# Telegram bridge has died, restarts the whole thing (self-heal).
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
STATE_DIR="${TELEGRAM_STATE_DIR:-$HOME/.claude/channels/telegram}"
LOG="$HOME/tariq-agent/work/start.log"
STRIKES="$HOME/tariq-agent/work/bridge-missing"

# The bridge is the plugin's `bun server.ts`; it writes its pid to bot.pid while it polls.
bridge_alive() {
  local pid
  pid=$(cat "$STATE_DIR/bot.pid" 2>/dev/null)
  [[ "$pid" == <-> ]] || return 1
  kill -0 "$pid" 2>/dev/null || return 1
  ps -p "$pid" -o args= 2>/dev/null | grep -q 'server.ts'
}

if screen -list 2>/dev/null | grep -q '\.tariq[[:space:]]'; then
  if bridge_alive; then rm -f "$STRIKES"; exit 0; fi
  # Session up, bridge gone: Claude Code never restarts an MCP server, so the bot stays
  # silent until the session is restarted (seen 10 Sep 2026 after each headless skill run
  # took over the poller). Two misses in a row (this runs every five minutes) so a session
  # that is still starting is left alone.
  n=$(( $(cat "$STRIKES" 2>/dev/null || echo 0) + 1 ))
  echo "$n" > "$STRIKES"
  (( n >= 2 )) || exit 0
  echo "$(date '+%Y-%m-%d %H:%M') bridge missing on $n checks, restarting the session" >> "$LOG"
  screen -S tariq -X quit 2>/dev/null || true
  sleep 5
fi
rm -f "$STRIKES"
# A scheduler outlives its screen when the screen is quit; one loop only, never three.
pkill -u "$(id -u)" -f 'tools/scheduler.mjs' 2>/dev/null || true
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
# The OAuth token is exported above and screen hands its environment to every window, so it
# is never written into the command string: a token in the command string is a token in
# `ps` for any user on the machine (seen 21 Sep 2026, and the user split makes that two users).
screen -dmS tariq zsh -lc "export PATH=\"$PATH\"; cd \"$HOME/tariq-agent\" && $CMD; sleep 20"
# The scheduler for unattended runs (config/schedule.json): a second window of the same
# screen, so one `screen -r tariq` shows both. No launchd for it, no admin rights.
screen -S tariq -X screen -t scheduler zsh -lc "export PATH=\"$PATH\"; cd \"$HOME/tariq-agent\" && node tools/scheduler.mjs >> work/scheduler.log 2>&1"
echo "$(date '+%Y-%m-%d %H:%M') started tariq session and scheduler ($(claude --version 2>/dev/null | head -1), plugin $(ls "$HOME/.claude/plugins/cache/claude-plugins-official/telegram" 2>/dev/null | sort -V | tail -1))" >> "$LOG"
