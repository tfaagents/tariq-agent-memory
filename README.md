# tariq-agent

Tariq Ali's personal agent. A plain Claude Code session in this folder on the TFA Mac
mini, reached from his phone through the official Claude Code Telegram channel plugin.
Design and reasoning: `clients/tfa-constructions/docs/tariq-personal-agent-plan-2026-09-10.md`.

Lives at `/Users/tfaagents/tariq-agent` on the mini (`ssh tfa-mini`). Jaiah's copy is
`clients/tfa-constructions/tariq-agent/` in the Autoflow workspace. Ship changes with
`rsync -a --exclude work --exclude .git ./ tfa-mini:tariq-agent/` then restart the session.

## What is where

| Path | What |
|---|---|
| `CLAUDE.md` | identity, rules, how he reaches it, hard rules |
| `memory/` | what it knows (auto-memory dir), committed locally |
| `raw/` | source material, never rewritten (Kendal's exports, templates) |
| `sessions/` | one log per finished job; `patterns.py` reads these |
| `tools/mail.mjs` | his mail and diary through `~/tfa-agents/runner/lib/graph.mjs`; `draft` is the one write |
| `tools/tfa.mjs` | the dashboard as Tariq: status, waiting, runs, promises, done, run, approve, send-back |
| `.claude/settings.json` | allow, ask, deny lists. `ask` = permission relayed to his Telegram |
| `.claude/agents/` | the workers (`worker`, `researcher`, `drafter`): background subagents the main session hands long jobs to; no Telegram tools, results in `work/jobs/<id>.md` |
| `tools/jobs.mjs` | the job board (`work/jobs.json`): one id per message, progress message id, steps, status; read back by the SessionStart hook after a restart |
| `.claude/hooks/start.sh` | starts the session in `screen -S tariq` if a bot token exists; restarts it if the bridge has died; one scheduler only |
| `launchd/com.tfa.tariq-agent.plist` | runs start.sh at login and every 5 minutes |

## The Telegram account (decided 10 Sep 2026)

Tariq could not create a Telegram account on his own number, so the TFA agent handset's
number (0423 720 036, the Optus X Plus that also runs the WhatsApp "Tfa Agent" line) gets
the Telegram account. One account, three devices: signed up on the handset (the SMS code
lands there), then added on Tariq's phone (Settings, Devices, Link Desktop Device does
not cover phones; on his phone he enters the number and the code arrives in the
handset's Telegram app) and on a Mac (Telegram Desktop, Settings, Devices, Link Desktop
Device, scan the QR from the handset). That account creates the bot with @BotFather, so
the bot is owned by TFA, which is the right owner at handover.

What that means while it stands: whoever is logged into that account is "Tariq" to the
agent. Jaiah logged in on the Mac sees every message Tariq sends the agent and can send
as him. Fine for the test fortnight; say so to Tariq. When he gets his own account, the
swap is one line: add his numeric id to `allowFrom` in `access.json`, remove the shared
one, and the bot keeps working because the token never changes.

## Live state (10 Sep 2026, 12:13)

Bot **@tfa_agent_bot** (id 8453429275), created from the shared TFA account. Paired and locked
to Telegram user id **8775846624** (`dmPolicy: allowlist`). First `brief` answered in about
45 seconds. Token at `~/.claude/channels/telegram/.env` on the mini, mode 600.

## First run (Jaiah)

1. Create the bot from the shared account: Telegram, @BotFather, `/newbot`, a name (for
   example "Tariq's Assistant"), a username ending in `bot`. Copy the token. Never send
   it by email.
2. On the mini: `mkdir -p ~/.claude/channels/telegram && printf 'TELEGRAM_BOT_TOKEN=%s\n' '<token>' > ~/.claude/channels/telegram/.env && chmod 600 ~/.claude/channels/telegram/.env`
3. `launchctl kickstart -k gui/501/com.tfa.tariq-agent` (or wait five minutes). Check
   `screen -list` shows `tariq`.
4. Tariq messages the bot. It replies with a six-character code. Then EITHER attach and
   pair (`ssh -t tfa-mini 'screen -r tariq'`, type `/telegram:access pair <code>`, then
   `/telegram:access policy allowlist`, detach with ctrl-a d) OR skip pairing: get his
   numeric id from @userinfobot and write `~/.claude/channels/telegram/access.json`:
   `{"dmPolicy":"allowlist","allowFrom":["<id>"],"groups":{},"pending":{}}`. The server
   re-reads it on every message.
5. Send "brief" from his phone and watch `screen -r tariq`.

## Second user (decided 10 Sep 2026): the agent runs as its own macOS user

Why: everything that runs as one macOS user can read that user's files, so a certificate
the workflow runner can read is one a personal session could reach with Bash. The fix is
the operating system, not a permission file: Tariq's agent runs as the standard user
`tariq`, the eleven workflow agents stay under `tfaagents`, and neither can read the
other's home (homes are mode 750). What that buys, permanently:

- Tariq's agent can be given whatever Tariq is allowed (calendar write, OneDrive, later
  send) on its OWN Entra app registration and certificate in `~/.tariq-graph`, and no
  workflow agent can ever use that key. The workflow app keeps read-only.
- The workflow lane's store, run log, receipts, staff forms and secrets are unreadable
  to the personal lane. The only door is the dashboard over HTTP on 127.0.0.1, as Tariq's
  own owner login, which is exactly what he sees in the browser and is audited as him.
- Separate Claude login, so a long brainstorm never eats the workflow agents' plan limits.
- Separate Telegram bot state, Bun and Claude Code installs, so an update or a broken
  plugin in one lane cannot take the other down.

Known limits, stated once:

- `tfaagents` is an admin account and could `sudo` into anything. No model has that
  password; only Jaiah types it. If that ever matters, make a third admin-only account
  for Jaiah and drop `tfaagents` to standard.
- LaunchAgents only run for a user who is logged in at the screen, so the session is
  started by a system LaunchDaemon (`launchd/com.tfa.tariq-agent.daemon.plist`, installed
  once with sudo). Unattended skill runs use the agent's own scheduler
  (`tools/scheduler.mjs`, `config/schedule.json`), which needs no admin at all.
- Screen sharing shows the console user (tfaagents). Watch Tariq's agent with
  `ssh tariq@tfa-mini` then `screen -r tariq` (ctrl-a n for the scheduler window).
- Exchange application access policies scope mail and calendar only. OneDrive access is
  tenant-wide by nature unless it uses Sites.Selected; decide that when Files.Read is
  requested.
- Until the "Tariq Assistant" app registration exists, the tariq user carries a copy of
  the READ-ONLY TFA Agents certificate as a bridge. It cannot send. Swap the two lines in
  `config/connections.json` (clientId, cert paths) when the new app is consented.

The steps, in order:

1. Jaiah, on the mini as tfaagents (Terminal or screen share), once:
   `zsh /Users/tfaagents/tariq-agent/scripts/admin-create-user.sh`
   It creates the standard user, installs Jaiah's ssh key, copies the bridge certificate,
   the dashboard passcode, the Telegram token and allowlist and the Claude token into the
   new home (owned by tariq, mode 600), unloads and stops the tfaagents copy.
2. Jaiah, from the Mac: add `Host tfa-tariq` (same address, `User tariq`) to `~/.ssh/config`,
   then `rsync -a --exclude 'work/*' --exclude .git ./ tfa-tariq:tariq-agent/` and
   `ssh tfa-tariq 'zsh tariq-agent/scripts/setup-user.sh'` (Bun, Claude Code, plugin,
   trust, smoke tests).
3. Jaiah, on the mini as tfaagents: install the daemon (the three sudo lines the admin
   script prints). The session and the scheduler are up within a minute.
4. Later, when Tariq wants his own subscription: `ssh -t tfa-tariq 'claude setup-token'`,
   write the token to `~/.claude-oauth-token`, restart with
   `sudo launchctl kickstart -k system/com.tfa.tariq-agent`.
5. Later, Kendal (M365 admin): register "Tariq Assistant" in Entra with the application
   permissions listed in `config/connections.json`, upload the cert Jaiah generates in
   `~/.tariq-graph`, grant consent, then the Exchange access policy scoping it to tariq@.

## Scheduled runs

`config/schedule.json` holds them (morning-send 06:30 weekdays, nightly-learn 21:00,
retro Friday 16:00). The agent adds one with `.claude/hooks/schedule.sh <slug> <HH:MM>
<days>` when Tariq says yes; the scheduler picks it up within 30 seconds. Each run is
`claude -p /<skill>` with the ask-list tools disabled, output in `sessions/scheduled/`,
log in `work/scheduler.log`. Remove a line to stop one.

## Several jobs at once (how it works)
Telegram pushes every message into the one session, one at a time. The main session is a
dispatcher: it opens a job on the board, sends the progress message, hands anything longer
than a minute to a background worker (`.claude/agents/`), and returns so the next message
gets through. Workers cannot reach Telegram (their `tools:` list has no Telegram tool) and
write their result to `work/jobs/<id>.md`; the main session turns that into the edited
progress message. Steps that need Tariq's tap (a draft into Outlook, a workflow run) stay in
the main session so the Approve button reaches his phone. The board survives compaction
and the 05:00 restart: the SessionStart hook lists open jobs and the session picks them up.
Agent teams (separate sessions messaging each other) were considered and not used: they
cannot be resumed, one team per session, and nothing here needs two sessions.

## Updates
Claude Code updates itself in the background and the running session keeps the old
version until the next start (the 05:00 rollover). The official Telegram plugin does the
same within ten minutes of a start. Files (CLAUDE.md, memory, skills, hooks, settings) are
never touched by an update. `autoUpdatesChannel` is `stable` in `.claude/settings.json`
(about a week behind, skips releases with known regressions). Each start logs the Claude
and plugin versions in `work/start.log`, so a break that follows an update is visible; the
self-heal in start.sh restarts a session whose bridge failed, and `--channels` changing
shape is the one thing that needs a hand (edit start.sh).

## Day to day

- Restart the session: `screen -S tariq -X quit` then wait for launchd, or run start.sh.
- Bot silent but the screen is up: the Telegram bridge (`bun server.ts`, pid in
  `~/.claude/channels/telegram/bot.pid`) has died. start.sh checks this every five minutes
  and restarts the session after two misses in a row (`work/bridge-missing`, logged in
  `work/start.log`). To see why it died, read the newest file in
  `~/Library/Caches/claude-cli-nodejs/-<home with slashes as dashes>-tariq-agent/mcp-logs-plugin-telegram-telegram/`.
  "replacing stale poller" there means a second Claude session in this folder took the
  bot token's poll slot: never run a plain `claude` or `claude -p` in this folder while
  the session is up. `run-skill.sh` disables the plugin for unattended runs
  (`--settings '{"enabledPlugins":{"telegram@claude-plugins-official":false}}'`); do the
  same for any other headless run here.
- Logs: `work/start.log`, `work/launchd.log`, and the session itself in screen.
- The session auto-updates Claude Code; if the `--channels` flag changes in a release,
  edit `start.sh`.
- Memory and sessions are committed to the local repo by the SessionEnd hook. No remote
  yet; add one under TFA's GitHub when there is a nightly backup target.
- Second bot on the same mini (another person): a second folder, a second token,
  `TELEGRAM_STATE_DIR` set per instance. Never a second id on Tariq's allowlist.
