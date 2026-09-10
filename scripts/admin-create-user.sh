#!/bin/zsh
# Run ONCE on the mini as the admin account (tfaagents), in Terminal or over screen share.
# Creates the 'tariq' standard user, lets Jaiah ssh in as it, moves the Telegram bot and
# a bridge copy of the read-only Graph certificate across, hands over the dashboard
# passcode, and stops the copy of the agent that ran under tfaagents.
#
#   zsh ~/tfa-agents/../tariq-agent/scripts/admin-create-user.sh   (or paste it)
#
# Asks for the admin password once (sudo). Nothing here touches the workflow agents.
set -e
NEWUSER=tariq
printf "Password for the new '%s' user (used only if he ever logs in at the screen): " "$NEWUSER"
read -s PW; echo

if ! id "$NEWUSER" >/dev/null 2>&1; then
  sudo sysadminctl -addUser "$NEWUSER" -fullName "Tariq Agent" -password "$PW" -home "/Users/$NEWUSER" -shell /bin/zsh
  echo "created $NEWUSER (standard user, not admin)"
fi
sudo dseditgroup -o edit -a "$NEWUSER" -t user com.apple.access_ssh 2>/dev/null || true

# Jaiah's ssh key: the same one the tfaagents account trusts.
sudo mkdir -p "/Users/$NEWUSER/.ssh"
sudo cp "$HOME/.ssh/authorized_keys" "/Users/$NEWUSER/.ssh/authorized_keys"
sudo chown -R "${NEWUSER}:staff" "/Users/$NEWUSER/.ssh"
sudo chmod 700 "/Users/$NEWUSER/.ssh"; sudo chmod 600 "/Users/$NEWUSER/.ssh/authorized_keys"

# Secrets that move across (readable by tariq only).
sudo mkdir -p "/Users/$NEWUSER/.tariq-graph" "/Users/$NEWUSER/.tariq-dashboard" "/Users/$NEWUSER/.claude/channels/telegram"
# Bridge: the READ-ONLY TFA Agents certificate, until the Tariq Assistant app exists.
sudo cp "$HOME/.tfa-graph/tfa-agents-mini.key" "/Users/$NEWUSER/.tariq-graph/tariq-assistant.key"
sudo cp "$HOME/.tfa-graph/tfa-agents-mini.crt" "/Users/$NEWUSER/.tariq-graph/tariq-assistant.crt"
# His dashboard passcode, so the agent presses buttons as him.
python3 -c "import json;print(json.load(open('$HOME/tfa-agents/config/passcodes.json'))['tariq@tfaconstructions.com.au'])" | sudo tee "/Users/$NEWUSER/.tariq-dashboard/passcode" >/dev/null
# The Telegram bot: token and allowlist.
sudo cp "$HOME/.claude/channels/telegram/.env" "/Users/$NEWUSER/.claude/channels/telegram/.env"
sudo cp "$HOME/.claude/channels/telegram/access.json" "/Users/$NEWUSER/.claude/channels/telegram/access.json"
# The Claude login: same TFA Max token as a bridge; replace with his own via `claude setup-token` later.
sudo cp "$HOME/.claude-oauth-token" "/Users/$NEWUSER/.claude-oauth-token"
sudo chown -R "${NEWUSER}:staff" "/Users/$NEWUSER/.tariq-graph" "/Users/$NEWUSER/.tariq-dashboard" "/Users/$NEWUSER/.claude" "/Users/$NEWUSER/.claude-oauth-token"
sudo chmod 700 "/Users/$NEWUSER/.tariq-graph" "/Users/$NEWUSER/.tariq-dashboard"
sudo chmod 600 "/Users/$NEWUSER"/.tariq-graph/* "/Users/$NEWUSER"/.tariq-dashboard/* "/Users/$NEWUSER/.claude/channels/telegram/.env" "/Users/$NEWUSER/.claude-oauth-token"

# Everything the agent learned while it ran under tfaagents comes across: memory, session
# logs, drafts, the mail index. Jaiah's rsync afterwards brings the code; this brings the brain.
if [[ -d "$HOME/tariq-agent" ]]; then
  sudo mkdir -p "/Users/$NEWUSER/tariq-agent"
  for d in memory sessions raw work; do
    [[ -d "$HOME/tariq-agent/$d" ]] && sudo cp -R "$HOME/tariq-agent/$d" "/Users/$NEWUSER/tariq-agent/"
  done
  sudo chown -R "${NEWUSER}:staff" "/Users/$NEWUSER/tariq-agent"
fi

# Stop the copy that ran under tfaagents, so two bridges never poll the same bot.
launchctl unload "$HOME/Library/LaunchAgents/com.tfa.tariq-agent.plist" 2>/dev/null || true
rm -f "$HOME/Library/LaunchAgents/com.tfa.tariq-agent.plist"
screen -S tariq -X quit 2>/dev/null || true
mv "$HOME/.claude/channels/telegram" "$HOME/.claude/channels/telegram.moved-to-tariq-user" 2>/dev/null || true

echo
echo "Done. Next, from Jaiah's Mac:"
echo "  rsync -a --exclude 'work/*' --exclude .git ~/Documents/Autoflow-workspace/clients/tfa-constructions/tariq-agent/ tariq@tfa-mini:tariq-agent/"
echo "  ssh tariq@tfa-mini 'zsh tariq-agent/scripts/setup-user.sh'"
echo "Then here, as admin:"
echo "  sudo cp /Users/$NEWUSER/tariq-agent/launchd/com.tfa.tariq-agent.daemon.plist /Library/LaunchDaemons/com.tfa.tariq-agent.plist"
echo "  sudo chown root:wheel /Library/LaunchDaemons/com.tfa.tariq-agent.plist && sudo launchctl bootstrap system /Library/LaunchDaemons/com.tfa.tariq-agent.plist"
