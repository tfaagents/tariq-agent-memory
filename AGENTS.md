# Agents

This folder is Tariq's personal agent: one Claude session that answers every message from him
first, the way Claude answers in the app, and only then looks at what is set up (a skill, a
scheduled job, a TFA workflow) and asks whether he wants it run. The model underneath is a power
source and can be swapped. Whatever runtime reads this file: the identity, rules and layout are
in `CLAUDE.md`. Memory is in `memory/`, source material in `raw/`, the record of work in
`sessions/`, repeatable jobs in `.claude/skills/`, the only bridges to TFA's systems in `tools/`.
