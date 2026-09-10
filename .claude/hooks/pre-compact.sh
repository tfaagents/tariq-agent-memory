#!/bin/zsh
# PreCompact hook. Fires just before Claude Code compacts the chat. Records that it happened
# and reminds the model (via stdout, which compaction reads as guidance) what must survive.
cd "$HOME/tariq-agent" 2>/dev/null || exit 0
echo "$(date '+%Y-%m-%d %H:%M') compaction" >> work/compactions.log
cat <<'MSG'
Before compacting: keep every open job and its progress message id, every promise or
preference Tariq stated in this chat that is not yet in memory/, and the numbered list
from the last inbox or search (work/mail-index.json holds the ids). Facts about him, his
projects and his people belong in memory/ files, not in the summary; write them there first
if they are only in the chat.
MSG
exit 0
