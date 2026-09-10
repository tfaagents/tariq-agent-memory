#!/bin/zsh
# SessionEnd hook, including /clear. Commits memory, sessions and skills to the local
# repo so nothing learned is lost. No remote yet; the nightly backup covers the copy.
cd "$HOME/tariq-agent" 2>/dev/null || exit 0
git add CLAUDE.md memory sessions raw .claude/skills 2>/dev/null
git diff --cached --quiet || git commit -q -m "session: $(date '+%Y-%m-%d %H:%M')" 2>/dev/null || true
exit 0
