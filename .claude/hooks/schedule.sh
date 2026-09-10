#!/bin/zsh
# Adds (or updates) an unattended run in config/schedule.json. No launchd, no admin: the
# agent's own scheduler (tools/scheduler.mjs, started by start.sh) picks it up within 30 s.
# Usage: schedule.sh <slug> <HH:MM> <daily|weekdays|mon,wed,fri|...>
# Only for jobs that need no login, no send and no approval.
# Remove one: delete its line from config/schedule.json.
set -e
SLUG="$1"; TIME="$2"; DAYS="${3:-daily}"
[[ -n "$SLUG" && "$TIME" =~ ^[0-9]{2}:[0-9]{2}$ ]] || { echo "usage: schedule.sh <slug> <HH:MM> <daily|weekdays|mon,tue,...>"; exit 1; }
[[ -d "$HOME/tariq-agent/.claude/skills/$SLUG" ]] || { echo "no skill at .claude/skills/$SLUG"; exit 1; }
cd "$HOME/tariq-agent"
python3 - "$SLUG" "$TIME" "$DAYS" <<'PY'
import json, sys
slug, time, days = sys.argv[1:4]
p = 'config/schedule.json'
try: d = json.load(open(p))
except Exception: d = {"jobs": []}
d.setdefault('jobs', [])
d['jobs'] = [j for j in d['jobs'] if j.get('slug') != slug] + [{"slug": slug, "time": time, "days": days}]
json.dump(d, open(p, 'w'), indent=2); open(p, 'a').write('\n')
print(f"scheduled /{slug} at {time} ({days}). Results: sessions/scheduled/. Scheduler log: work/scheduler.log")
PY
