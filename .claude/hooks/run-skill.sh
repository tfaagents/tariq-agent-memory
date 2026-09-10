#!/bin/zsh
# Runs one skill non-interactively and files the result. Used by the scheduler
# (tools/scheduler.mjs) and by launchd jobs created by the old schedule.sh.
export PATH="$HOME/.local/bin:$HOME/.bun/bin:/usr/local/bin:/opt/homebrew/bin:$PATH"
export CLAUDE_CODE_OAUTH_TOKEN="$(cat "$HOME/.claude-oauth-token" 2>/dev/null)"
SLUG="$1"; [[ -n "$SLUG" ]] || exit 1
cd "$HOME/tariq-agent" || exit 1
mkdir -p sessions/scheduled
OUT="sessions/scheduled/$(date '+%Y-%m-%d-%H%M')-$SLUG.md"
# Tools that need Tariq's yes (drafts, approvals, runs) are switched off for unattended
# runs: the "ask" list from settings.json, one rule per argument. zsh does not word-split
# variables, so build an array rather than a string.
GATED=("${(@f)$(python3 -c 'import json;print("\n".join(json.load(open(".claude/settings.json")).get("permissions",{}).get("ask",[])))' 2>/dev/null)}")
GATED=(${GATED:#})
{
  echo "---"; echo "job: scheduled /$SLUG"; echo "slug: $SLUG"; echo "type: scheduled"
  echo "started: $(date '+%Y-%m-%dT%H:%M')"; echo "---"; echo
  if (( ${#GATED} )); then
    claude -p "/$SLUG Scheduled run, Tariq is not present. Do only what needs no approval. Finish with a three-line summary." \
      --permission-mode auto --disallowedTools "${GATED[@]}" 2>&1 < /dev/null
  else
    claude -p "/$SLUG Scheduled run, Tariq is not present. Do only what needs no approval. Finish with a three-line summary." \
      --permission-mode auto 2>&1 < /dev/null
  fi
} > "$OUT"
git add sessions/scheduled memory >/dev/null 2>&1 && git commit -q -m "scheduled: $SLUG $(date '+%Y-%m-%d %H:%M')" >/dev/null 2>&1 || true
