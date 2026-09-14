#!/bin/zsh
# Runs one skill non-interactively and files the result. Used by the scheduler
# (tools/scheduler.mjs) and by launchd jobs created by the old schedule.sh.
export PATH="$HOME/.local/bin:$HOME/.bun/bin:/usr/local/bin:/opt/homebrew/bin:$PATH"
export CLAUDE_CODE_OAUTH_TOKEN="$(cat "$HOME/.claude-oauth-token" 2>/dev/null)"
SLUG="$1"; [[ -n "$SLUG" ]] || exit 1
cd "$HOME/tariq-agent" || exit 1
mkdir -p sessions/scheduled
OUT="sessions/scheduled/$(date '+%Y-%m-%d-%H%M')-$SLUG.md"
# The Telegram plugin registers its bridge as an MCP server, so a headless run would start a
# second poller on the same bot token; the plugin kills the previous holder (the live
# session's bridge) to take the slot, then shuts its own down on exit, and the live session
# never restarts an MCP server. Seen 10 Sep 2026 at 17:23 and 21:00: the bot went silent
# after every scheduled run. The plugin is switched off for this run; tools/notify.mjs
# talks to the Bot API directly and still works.
NOPLUGIN='{"enabledPlugins":{"telegram@claude-plugins-official":false}}'
# Tools that need Tariq's yes (drafts, approvals, runs) are switched off for unattended
# runs: the "ask" list from settings.json, one rule per argument. zsh does not word-split
# variables, so build an array rather than a string.
GATED=("${(@f)$(python3 -c 'import json;print("\n".join(json.load(open(".claude/settings.json")).get("permissions",{}).get("ask",[])))' 2>/dev/null)}")
GATED=(${GATED:#})
# The agent logs its own session to $OUT (same date, time and slug) while it runs. Until
# 14 Sep 2026 this block held $OUT open for the whole run and wrote claude's final summary
# into it at the shell's offset, over the top of what the agent had written, so the message
# body of every scheduled log was lost ("ended: 2Nightly learn done"). Now claude's output
# goes to a temp file and is appended once claude has exited.
START="$(date '+%Y-%m-%dT%H:%M')"
SUMMARY="$(mktemp -t tariq-run)"
if (( ${#GATED} )); then
  claude -p "/$SLUG Scheduled run, Tariq is not present. Do only what needs no approval. Finish with a three-line summary." \
    --permission-mode auto --settings "$NOPLUGIN" --disallowedTools "${GATED[@]}" > "$SUMMARY" 2>&1 < /dev/null
else
  claude -p "/$SLUG Scheduled run, Tariq is not present. Do only what needs no approval. Finish with a three-line summary." \
    --permission-mode auto --settings "$NOPLUGIN" > "$SUMMARY" 2>&1 < /dev/null
fi
if [[ ! -s "$OUT" ]]; then
  { echo "---"; echo "job: scheduled /$SLUG"; echo "slug: $SLUG"; echo "type: scheduled"
    echo "started: $START"; echo "---"; } > "$OUT"
fi
{ echo; echo "## Run summary ($(date '+%H:%M'))"; cat "$SUMMARY"; } >> "$OUT"
rm -f "$SUMMARY"
git add sessions/scheduled memory >/dev/null 2>&1 && git commit -q -m "scheduled: $SLUG $(date '+%Y-%m-%d %H:%M')" >/dev/null 2>&1 || true
