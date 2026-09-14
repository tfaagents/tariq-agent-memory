#!/bin/zsh
# Ship this repo to the running copy on the mini, without touching what the mini owns.
#
#   scripts/ship.sh              to tfa-mini:tariq-agent/ (the tfaagents copy, live today)
#   scripts/ship.sh tfa-tariq    to the tariq user's copy once the user split is installed
#
# The mini is the truth for the agent's memory, session logs, raw/, work/ and the schedule it
# actually runs (launchd holds three of the four jobs there). Overwriting those from here
# broke mail and lost memory on 14 Sep 2026. Until 14 Sep 21:40 the mini also kept a v1
# mail tool on the TFA Agents cert; since scripts/connect-graph.sh ran that evening the
# mini's tools/mail.mjs is this repo's (the agent's own Entra app), so mail.mjs ships again.
# After shipping: `ssh <host> 'cd tariq-agent && npm install'` if package.json changed, then
# restart the session (screen -S tariq -X quit; zsh .claude/hooks/start.sh).
set -euo pipefail
cd "$(dirname "$0")/.."
HOST="${1:-tfa-mini}"
rsync -a \
  --exclude .git \
  --exclude 'work/*' \
  --exclude 'memory/*' \
  --exclude 'sessions/*' \
  --exclude 'raw/*' \
  --exclude models \
  --exclude node_modules \
  --exclude config/schedule.json \
  --exclude .env \
  ./ "${HOST}:tariq-agent/"
echo "shipped to ${HOST}:tariq-agent/ (memory, sessions, raw, work, schedule.json left alone)"
