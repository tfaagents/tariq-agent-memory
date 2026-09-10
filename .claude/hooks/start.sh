#!/bin/zsh
# Starts Tariq's agent session in a detached screen if it is not already running.
# Called at login and every five minutes by ~/Library/LaunchAgents/com.tfa.tariq-agent.plist.
# Attach to watch or to run /telegram:access:   screen -r tariq     (detach: ctrl-a d)
export PATH="$HOME/.local/bin:$HOME/.bun/bin:/usr/local/bin:/opt/homebrew/bin:$PATH"
export CLAUDE_CODE_OAUTH_TOKEN="$(cat "$HOME/.claude-oauth-token" 2>/dev/null)"
cd "$HOME/tariq-agent" 2>/dev/null || exit 0
mkdir -p work/inbox sessions/scheduled
# No bot token yet = nothing to listen to. Stay quiet rather than burn a session.
[[ -s "$HOME/.claude/channels/telegram/.env" ]] || exit 0
screen -list 2>/dev/null | grep -q '\.tariq[[:space:]]' && exit 0
CMD='claude --channels plugin:telegram@claude-plugins-official --permission-mode auto'
screen -dmS tariq zsh -lc "export PATH=\"$PATH\"; export CLAUDE_CODE_OAUTH_TOKEN=\"$CLAUDE_CODE_OAUTH_TOKEN\"; cd \"$HOME/tariq-agent\" && $CMD; sleep 20"
echo "$(date '+%Y-%m-%d %H:%M') started tariq session" >> "$HOME/tariq-agent/work/start.log"
