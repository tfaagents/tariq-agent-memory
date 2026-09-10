#!/bin/zsh
# One-time setup of Tariq's agent under ITS OWN macOS user on the TFA mini.
# Run as that user (ssh tariq@tfa-mini, or `sudo -u tariq -i` from the admin account).
# Idempotent: safe to run again. Needs: the folder already at ~/tariq-agent (rsync from
# Jaiah's Mac), and the two secret files placed by the admin (see README, "Second user").
set -e
export PATH="$HOME/.local/bin:$HOME/.bun/bin:/usr/local/bin:$PATH"
cd "$HOME/tariq-agent"

echo "1. Bun (the Telegram channel plugin runs on it)"
command -v bun >/dev/null 2>&1 || curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"; bun --version

echo "2. Claude Code for this user"
command -v claude >/dev/null 2>&1 || curl -fsSL https://claude.ai/install.sh | bash
export PATH="$HOME/.local/bin:$PATH"; claude --version

echo "3. Folders and permissions"
mkdir -p work/inbox work/drafts work/tenders work/briefs sessions/scheduled raw/kendal
chmod +x .claude/hooks/*.sh tools/*.mjs
chmod 700 "$HOME/.tariq-graph" "$HOME/.tariq-dashboard" 2>/dev/null || true
chmod 600 "$HOME"/.tariq-graph/* "$HOME"/.tariq-dashboard/* 2>/dev/null || true
[[ -d .git ]] || { git init -q; git add -A; git -c user.email=agents@tfaconstructions.com.au -c user.name="Tariq Agent" commit -q -m "tariq-agent: first commit under the tariq user"; }

echo "4. Claude login"
if [[ ! -s "$HOME/.claude-oauth-token" ]]; then
  echo "   No token yet. Run:  claude setup-token   (as this user, follow the URL, paste the code)"
  echo "   then:  printf %s '<token>' > ~/.claude-oauth-token && chmod 600 ~/.claude-oauth-token"
  echo "   and run this script again."
  exit 0
fi
export CLAUDE_CODE_OAUTH_TOKEN="$(cat "$HOME/.claude-oauth-token")"

echo "5. Trust this folder (so the first launch never waits on a dialog)"
python3 - <<'PY'
import json, os
p = os.path.expanduser('~/.claude.json')
try: d = json.load(open(p))
except Exception: d = {}
d.setdefault('projects', {})
e = d['projects'].get(os.path.expanduser('~/tariq-agent'), {})
e.update({'hasTrustDialogAccepted': True, 'hasClaudeMdExternalIncludesApproved': False})
d['projects'][os.path.expanduser('~/tariq-agent')] = e
json.dump(d, open(p, 'w'), indent=2)
print('   trusted')
PY

echo "6. Telegram channel plugin"
claude plugin install telegram@claude-plugins-official -s user -y >/dev/null 2>&1 || true
claude plugin list | grep -A2 telegram || true
mkdir -p "$HOME/.claude/channels/telegram"
[[ -s "$HOME/.claude/channels/telegram/.env" ]] || echo "   Put the bot token in ~/.claude/channels/telegram/.env as TELEGRAM_BOT_TOKEN=... (chmod 600); access.json is copied by the admin."

echo "7. Smoke tests"
node tools/tfa.mjs status | head -3 || echo "   dashboard: not reachable yet (passcode file or dashboard down)"
node tools/mail.mjs diary 1 | head -3 || echo "   graph: no certificate yet (see config/connections.json)"

echo
echo "Done. The LaunchDaemon (installed by the admin) starts the session within 5 minutes."
echo "Watch it:  screen -r tariq   (as this user)"
