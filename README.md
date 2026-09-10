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
| `.claude/hooks/start.sh` | starts the session in `screen -S tariq` if a bot token exists |
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

## Day to day

- Restart the session: `screen -S tariq -X quit` then wait for launchd, or run start.sh.
- Logs: `work/start.log`, `work/launchd.log`, and the session itself in screen.
- The session auto-updates Claude Code; if the `--channels` flag changes in a release,
  edit `start.sh`.
- Memory and sessions are committed to the local repo by the SessionEnd hook. No remote
  yet; add one under TFA's GitHub when there is a nightly backup target.
- Second bot on the same mini (another person): a second folder, a second token,
  `TELEGRAM_STATE_DIR` set per instance. Never a second id on Tariq's allowlist.
