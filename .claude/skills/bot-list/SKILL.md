---
name: bot-list
description: Add to, reword, or read back Tariq's list of bot builds. Use when he says "add to my bot list", "put this on the bot list", "change B24 to ...", "reword that one", or asks what is on it, what batch something is in, or what id an item has.
argument-hint: <what he wants added>, or "change <id> ..." , or nothing to read the list back
---

One file: `Desktop/Tariqs list of bot builds.docx` in his OneDrive. It holds his own list word
for word in section 1, the same items batched in section 2, and his ChatGPT eight agent version
in section 3. Every item has a permanent id, B01 upwards, which is the number Word prints next
to it. He reads this file and he types in this file, so there is never a question of which copy
is current.

He adds items two ways and both are fine: he types on one of the blank numbered lines at the end
of section 1, or he tells you. Expect items to appear that you did not add.

**The one rule: his words go in exactly as he said them.** That holds for a change as much as
for a new item: when he rewords one, write what he said, not a tidied version of it. Do not tidy the grammar, do not fix a
typo, do not shorten it, do not merge it with a similar item already on the list. His objection
to bots touching his documents, 15 Sep 2026: "I hate how they don't keep how it was. Okay,
you're improving it. Great. But like when you merged it, it always loses two sentences." If what
he said is ambiguous, add it as he said it and ask about it afterwards.

## Reading it back

- `node tools/botlist.mjs items` for the whole list with ids.
- `node tools/botlist.mjs batches` for the batches of similar work.

Both read the copy last downloaded, so run `stage` first if he may have typed in it since.

## Adding to it

1. `node tools/botlist.mjs stage "<his words, exactly>"`

   Downloads the current file, appends the item to the end of section 1 with the next id, and
   checks that every paragraph already in the file is still there, word for word, in the same
   order, and that nothing else changed. If that check fails it stops and puts nothing back.

2. Tell him the id and read the item back as it will appear. If he changes the wording, run
   `stage` again rather than editing the staged file: it downloads again, so it can never put
   back a stale copy.

3. Put it back. **This is the step he approves on Telegram:**

   `node tools/files.mjs put work/botlist/updated.docx "Desktop/Tariqs list of bot builds.docx"`

4. Confirm in one line: "Added B44 to your bot list: <his words>." Say that it is in his list now
   and that it will not be in a batch in section 2 until Jaiah files it, because which batch it
   belongs in is a decision rather than a guess. Then log the session with slug `bot-list`.

## Changing an item

Only when he asks for it, naming the item or clearly pointing at one. Never off your own bat.

1. Read him the item as it stands first, with its id, and get the new wording from him in his
   words. If he has not given you the whole line, ask; do not compose it for him.
2. `node tools/botlist.mjs amend <id> "<his new wording>"`

   It rewrites that one item and the line carrying the same id in section 2, and then checks
   that the document is exactly what it was with only those two lines different: nothing added,
   nothing removed, nothing reordered, no other item touched. If that check fails it stops and
   puts nothing back. It refuses an id that does not exist, wording identical to what is already
   there, and a blank, because emptying an item is removing it and this does not remove.
3. Show him the before and the after, both in full. Then put it back. **This is the step he
   approves on Telegram:**

   `node tools/files.mjs put work/botlist/updated.docx "Desktop/Tariqs list of bot builds.docx"`
4. If the tool warned that the item carries a cross-reference note, say so: the note under it is
   Jaiah's and is unchanged, so it may now disagree with the new wording, and Jaiah settles it.
5. Confirm in one line what changed, and log the session with slug `bot-list`.

**Removing an item is not something this does.** If he wants one gone, say that removing is a
person's call, tell him which id he means, and that Jaiah will do it. Do not empty the line to
fake it: a blank numbered line is the slot he types his next item on, so a blanked item reads as
an invitation rather than a deletion.

## When the put refuses

If it stops with "has changed in OneDrive since this copy was taken", he edited the file himself
while this was running, which with this file is a normal thing to happen. Nothing was overwritten
and his edit is intact. Say so, then start again at step 1. Never use `--force`: that flag exists
to overwrite his own edit and there is no situation in this skill where that is right.

## What not to do

- Never `--force` a put over this file.
- **Never run `botlist.mjs rebuild` or `build`.** Those regenerate sections 2 and 3 and are
  Jaiah's commands, run from his Mac where the original base copy lives. Adding an item does not
  need them.
- Never change an item he did not ask you to change, and never change one as a side effect of
  adding another.
- Do not move an item into a batch on your own. That lives in `config/botlist.json`, which this
  agent cannot edit.
