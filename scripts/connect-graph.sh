#!/bin/zsh
# Switch the agent's Microsoft 365 connection on, once the two Entra apps exist.
# Run on the mini as the user that owns ~/tariq-agent (tfaagents today, tariq after the split):
#   zsh scripts/connect-graph.sh <Tariq Assistant app id> <Tariq Assistant Send app id>
# It writes the ids into config/connections.json, proves each app does what it should and
# nothing more, then swaps the mail tool to the version that uses this connection.
set -e
cd "$HOME/tariq-agent"
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
APP1="$1"; APP2="${2:-}"
[[ "$APP1" =~ ^[0-9a-fA-F-]{36}$ ]] || { echo "usage: connect-graph.sh <app1 id> [app2 id]  (36-character Application (client) IDs from Entra; app 2 = the send app, can come later)"; exit 1; }
[[ -z "$APP2" || "$APP2" =~ ^[0-9a-fA-F-]{36}$ ]] || { echo "app 2 id does not look like an Application (client) ID"; exit 1; }
for f in ~/.tariq-graph/tariq-assistant.key ~/.tariq-graph/tariq-assistant.crt; do
  [[ -f "$f" ]] || { echo "missing $f (generate with openssl, see README)"; exit 1; }
done
python3 - "$APP1" "$APP2" <<'PY'
import json, sys
p = 'config/connections.json'; d = json.load(open(p)); g = d['m365-graph']
g['clientId'] = sys.argv[1]
if sys.argv[2]: g['sendClientId'] = sys.argv[2]
json.dump(d, open(p, 'w'), indent=2); open(p, 'a').write('\n'); print('ids written to config/connections.json' + ('' if sys.argv[2] else ' (send app not set yet: reads and drafts only)'))
PY
echo "== proving the connection"
node --input-type=module - <<'JS'
import path from 'node:path';
const g = await import(path.resolve('runner/lib/graph.mjs'));
const cfg = JSON.parse((await import('node:fs')).readFileSync('config/connections.json', 'utf8'))['m365-graph'];
const me = cfg.senderMailbox, other = (cfg.mailboxes || []).find((m) => m !== me) || me;
const ok = (l) => console.log('  ok   ' + l), bad = (l) => { console.log('  FAIL ' + l); process.exitCode = 1; };
const expect403 = async (label, fn) => { try { await fn(); bad(`${label}: allowed, but it must be refused`); } catch (e) { (e.status === 403 || e.status === 401) ? ok(`${label}: refused (${e.status}) as designed`) : bad(`${label}: ${e.message}`); } };
try { const r = await g.api(`/users/${encodeURIComponent(me)}/messages?$top=1&$select=subject`); ok(`app 1 reads his inbox (${r.value?.[0]?.subject || 'empty'})`); } catch (e) { bad(`app 1 inbox: ${e.message}`); }
try { const r = await g.calendarView(other); ok(`app 1 reads ${other}'s calendar (${r.length} in the next 7 days)`); } catch (e) { bad(`app 1 ${other} calendar: ${e.message}`); }
try { const r = await g.api(`/users/${encodeURIComponent(me)}/drive/root`); ok(`app 1 sees his OneDrive (${r.name || 'root'})`); } catch (e) { bad(`app 1 OneDrive: ${e.message} (Files.ReadWrite.All consent?)`); }
if (!cfg.sendClientId || /to confirm/i.test(cfg.sendClientId)) { console.log('  skip app 2 (send) not registered yet; reads, drafts, calendar and files only'); }
else {
const send = g.client({ clientId: cfg.sendClientId, keyPath: cfg.sendKeyPath, certPath: cfg.sendCertPath });
try { await send.api(`/users/${encodeURIComponent(me)}/messages?$top=1&$select=id`); bad('app 2 can READ his mail; it must hold Mail.Send only. Remove the read permission in Entra.'); } catch (e) { (e.status === 403) ? ok('app 2 cannot read mail (403), Mail.Send only as designed') : bad(`app 2 token or scope: ${e.message}`); }
await expect403(`app 2 on ${other}`, () => send.api(`/users/${encodeURIComponent(other)}/messages?$top=1&$select=id`));
}
console.log(process.exitCode ? '\nSomething above failed; the mail tool was NOT switched.' : '\nAll proofs passed.');
JS
[[ -f tools/mail.v2.mjs ]] && cp tools/mail.v2.mjs tools/mail.mjs && echo "tools/mail.mjs now uses this connection"
echo "Done. Tell the session: it will find mail, calendar and files connected on the next job. Flip inbox-watch to enabled in config/schedule.json when he wants suggested replies."
