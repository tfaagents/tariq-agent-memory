#!/bin/zsh
# Runs one skill non-interactively and files the result. Used by scheduled LaunchAgents.
export PATH="$HOME/.local/bin:$HOME/.bun/bin:/usr/local/bin:/opt/homebrew/bin:$PATH"
export CLAUDE_CODE_OAUTH_TOKEN="$(cat "$HOME/.claude-oauth-token" 2>/dev/null)"
SLUG="$1"; [[ -n "$SLUG" ]] || exit 1
cd "$HOME/tariq-agent" || exit 1
mkdir -p sessions/scheduled
OUT="sessions/scheduled/$(date '+%Y-%m-%d-%H%M')-$SLUG.md"
{
  echo "---"; echo "job: scheduled /$SLUG"; echo "slug: $SLUG"; echo "type: scheduled"
  echo "started: $(date '+%Y-%m-%dT%H:%M')"; echo "---"; echo
  # Tools that need Tariq's yes (drafts, approvals, runs) are switched off for unattended runs.
  GATED=$(python3 -c 'import json;print(" ".join(json.load(open(".claude/settings.json")).get("permissions",{}).get("ask",[])))' 2>/dev/null)
  claude -p "/$SLUG Scheduled run, Tariq is not present. Do only what needs no approval. Finish with a three-line summary." \
    --permission-mode auto ${GATED:+--disallowedTools $GATED} 2>&1
} > "$OUT"
git add sessions/scheduled >/dev/null 2>&1 && git commit -q -m "scheduled: $SLUG $(date '+%Y-%m-%d %H:%M')" >/dev/null 2>&1 || true
