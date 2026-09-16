---
name: bot-list
description: Add something to Tariq's list of bot builds, or read it back to him. Use when he says "add to my bot list", "put this on the bot list", "add to the list of bots", or asks what is on it, what batch something is in, or what id an item has.
argument-hint: <what he wants added>, or nothing to read the list back
---

There are two files in his OneDrive Desktop and the difference matters.

- **`Tariqs list of bot builds.docx`** is his. He typed all 43 items and he keeps adding to
  it himself. This is the source of truth and the file items get added to.
- **`Tariqs list of bot builds - batched.docx`** is built from it: his list word for word in
  section 1, the same items sorted into batches in section 2, his ChatGPT eight agent
  version in section 3. Every item has a permanent id, B01 to B43, printed next to it.

Because the second is derived from the first, adding an item means updating both. Adding to
his list and leaving the batched one stale is the drift he would notice and lose trust over.

**The one rule: his words go in exactly as he said them.** Do not tidy the grammar, do not
fix a typo, do not shorten it, do not merge it with a similar item already on the list. His
objection to bots touching his documents, 15 Sep 2026: "I hate how they don't keep how it
was. Okay, you're improving it. Great. But like when you merged it, it always loses two
sentences." If what he said is ambiguous, add it as he said it and ask about it afterwards.

## Reading it back

- `node tools/botlist.mjs items` for the whole list with ids.
- `node tools/botlist.mjs batches` for the batches of similar work.

Both read the copy last downloaded. If he has been typing in it, run `stage` first so the
copy is current.

## Adding to it

1. `node tools/botlist.mjs stage "<his words, exactly>"`

   Downloads his current list, appends the item to the end with the next id, and checks that
   every paragraph he typed is still there, word for word, in the same order, and that
   nothing else in the file changed. If that check fails it stops and puts nothing back.

2. Tell him the id and read the item back as it will appear. If he changes the wording, run
   `stage` again rather than editing the staged file: it downloads again, so it can never
   put back a stale copy.

3. Put his list back. **This is the first step he approves on Telegram:**

   `node tools/files.mjs put work/botlist/updated.docx "Desktop/Tariqs list of bot builds.docx"`

4. `node tools/botlist.mjs rebuild`

   Rebuilds the batched document from the copy just staged and checks it the same way. A new
   item belongs to no batch until a person decides which, so it is parked under "Added
   since, not yet batched" with its id. That is deliberate: it is visible and it is not
   guessed at. Tell him it is parked and that Jaiah will file it.

5. Put the batched document back. **Second approval:**

   `node tools/files.mjs put work/botlist/batched.docx "Desktop/Tariqs list of bot builds - batched.docx"`

6. Confirm in one line: "Added B44 to your bot list: <his words>. Both files updated."
   Then log the session with slug `bot-list`.

## When a put refuses

If a put stops with "has changed in OneDrive since this copy was taken", he edited that file
himself while this was running. Nothing was overwritten and his edit is intact. Say so, then
start again from step 1. Never use `--force`: that flag exists to overwrite his own edit and
there is no situation in this skill where that is right.

If step 3 succeeded and step 5 refused, say exactly that: his list has the new item, the
batched document is one behind, and it needs a rebuild. Do not leave him thinking both are
current.

## What not to do

- Never `--force` a put over either file.
- If he asks to change or remove an item rather than add one, do not do it silently. Tell him
  the tool only appends, say which id he means, and ask Jaiah to make the edit.
- Do not move an item into a batch on your own. Which batch something belongs in is Jaiah's
  call, made in `config/botlist.json`, which this agent cannot edit.
