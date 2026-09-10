#!/bin/zsh
# Creates a LaunchAgent that runs a skill unattended and writes the result to sessions/scheduled/.
# Usage: schedule.sh <slug> <HH:MM> <daily|mon|tue|wed|thu|fri|sat|sun>
# Only for jobs that need no login, no send and no approval. Remove with:
#   launchctl unload ~/Library/LaunchAgents/com.tfa.tariq-agent.<slug>.plist && rm that file
set -e
SLUG="$1"; TIME="$2"; DAY="${3:-daily}"
[[ -n "$SLUG" && "$TIME" =~ ^[0-9]{2}:[0-9]{2}$ ]] || { echo "usage: schedule.sh <slug> <HH:MM> <daily|mon..sun>"; exit 1; }
[[ -d "$HOME/tariq-agent/.claude/skills/$SLUG" ]] || { echo "no skill at .claude/skills/$SLUG"; exit 1; }
HOUR=${TIME%%:*}; MIN=${TIME##*:}
case "$DAY" in
  daily) WD="";;
  sun) WD="<key>Weekday</key><integer>0</integer>";; mon) WD="<key>Weekday</key><integer>1</integer>";;
  tue) WD="<key>Weekday</key><integer>2</integer>";; wed) WD="<key>Weekday</key><integer>3</integer>";;
  thu) WD="<key>Weekday</key><integer>4</integer>";; fri) WD="<key>Weekday</key><integer>5</integer>";;
  sat) WD="<key>Weekday</key><integer>6</integer>";;
  *) echo "day must be daily or mon..sun"; exit 1;;
esac
RUN="$HOME/tariq-agent/.claude/hooks/run-skill.sh"
PLIST="$HOME/Library/LaunchAgents/com.tfa.tariq-agent.$SLUG.plist"
mkdir -p "$HOME/Library/LaunchAgents"
cat > "$PLIST" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0"><dict>
  <key>Label</key><string>com.tfa.tariq-agent.$SLUG</string>
  <key>ProgramArguments</key><array><string>/bin/zsh</string><string>-lc</string><string>$RUN $SLUG</string></array>
  <key>StartCalendarInterval</key><dict><key>Hour</key><integer>$((10#$HOUR))</integer><key>Minute</key><integer>$((10#$MIN))</integer>$WD</dict>
  <key>StandardOutPath</key><string>/tmp/tariq-agent-$SLUG.log</string>
  <key>StandardErrorPath</key><string>/tmp/tariq-agent-$SLUG.log</string>
</dict></plist>
PL
launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"
echo "scheduled /$SLUG at $TIME ($DAY). Results: sessions/scheduled/. Log: /tmp/tariq-agent-$SLUG.log"
