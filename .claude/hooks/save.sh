#!/bin/zsh
# SessionEnd hook, including /clear. Commits memory, sessions, raw and skills to the local
# repo so nothing learned is lost, then pushes to the `backup` remote if one is set up
# (scripts/backup-setup.sh). The push is best effort: no network, no key, no remote, and
# the session still ends cleanly. A failed push is noted in work/backup.log so the retro
# can say the backup is stale.
cd "$HOME/tariq-agent" 2>/dev/null || exit 0
git add CLAUDE.md memory sessions raw .claude/skills 2>/dev/null
git diff --cached --quiet || git commit -q -m "session: $(date '+%Y-%m-%d %H:%M')" 2>/dev/null || true
if git remote get-url backup >/dev/null 2>&1; then
  mkdir -p work
  if git push -q backup HEAD:main >/dev/null 2>&1; then
    echo "$(date '+%Y-%m-%d %H:%M') pushed $(git rev-parse --short HEAD)" >> work/backup.log
  else
    echo "$(date '+%Y-%m-%d %H:%M') push failed (offline, or the deploy key is not on the repo yet)" >> work/backup.log
  fi
fi
exit 0
