---
name: remember
description: Save something Tariq tells you to remember, or distil a file in raw/ into memory. Use when he says "remember", "note that", "save this", or when Kendal's exports land in raw/kendal/.
argument-hint: <what to remember> or "raw/<path>"
---

If $ARGUMENTS names a path under `raw/`: read it fully, then write what it teaches as
facts into `memory/`: one file per subject (a project, a person, a template's rules, a
process), frontmatter `name` and `description`, short factual lines, dates absolute.
Update an existing file rather than creating a duplicate. Add one pointer line per file
to `memory/MEMORY.md` under the right heading. Never edit the raw file.

Otherwise: write the fact to the right file in `memory/` (create one if it is a new
subject), add the pointer, and confirm in one line what was saved and where. If it is an
idea rather than a fact, put it under "Projects and ideas" with the date he raised it.

Personal or non-TFA material is marked confidential in the file's description.
