#!/bin/zsh
# One-time, on the mini, as the user that runs the agent: prepare the remote backup of
# what the agent has learned (memory/, sessions/, raw/, skills) so the mini dying does
# not take it all with it.
#
#   zsh scripts/backup-setup.sh [git@github.com:tfaagents/tariq-agent-memory.git]
#
# What it does: makes an ed25519 deploy key at ~/.ssh/tariq-agent-backup (no passphrase,
# so the SessionEnd hook can push unattended), adds an ssh alias `tariq-backup` that uses
# it, and adds the git remote `backup`. It prints the PUBLIC key at the end. Jaiah then,
# in the browser signed in as TFA's GitHub account (agents@), creates the private repo and
# adds that key under Settings > Deploy keys with "Allow write access" ticked. From then on
# .claude/hooks/save.sh pushes after every commit, best effort, never blocking.
#
# Why a deploy key: the mini has no GitHub credential and its keychain is locked over
# non-interactive ssh (see tfa-constructions decisions, 31 Aug 2026). A key file needs
# neither. Why TFA's account: the repo holds Tariq's data, so TFA owns it (workspace rule 4).
set -euo pipefail
cd "$(dirname "$0")/.."
REMOTE="${1:-git@github.com:tfaagents/tariq-agent-memory.git}"
KEY="$HOME/.ssh/tariq-agent-backup"
mkdir -p "$HOME/.ssh" && chmod 700 "$HOME/.ssh"
if [[ ! -f "$KEY" ]]; then
  ssh-keygen -q -t ed25519 -N '' -C "tariq-agent backup $(hostname -s) $(date +%Y-%m-%d)" -f "$KEY"
  echo "key made: $KEY"
else
  echo "key exists: $KEY"
fi
if ! grep -q '^Host tariq-backup$' "$HOME/.ssh/config" 2>/dev/null; then
  cat >> "$HOME/.ssh/config" <<EOF

Host tariq-backup
  HostName github.com
  User git
  IdentityFile $KEY
  IdentitiesOnly yes
  StrictHostKeyChecking accept-new
EOF
  chmod 600 "$HOME/.ssh/config"
  echo "ssh alias tariq-backup added"
fi
# The remote goes through the alias so only this key is offered to GitHub.
ALIASED="${REMOTE/git@github.com:/tariq-backup:}"
if git remote get-url backup >/dev/null 2>&1; then
  git remote set-url backup "$ALIASED"
else
  git remote add backup "$ALIASED"
fi
echo "remote backup = $(git remote get-url backup)"
echo
echo "PUBLIC KEY (paste into the repo's Settings > Deploy keys, tick Allow write access):"
cat "$KEY.pub"
echo
echo "Then test from here:  git push -u backup main   (and a clone elsewhere to prove it)."
