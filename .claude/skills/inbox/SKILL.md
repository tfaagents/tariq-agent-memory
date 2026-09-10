---
name: inbox
description: Go through Tariq's inbox since a given time, say what needs a reply, what is time sensitive and what can wait, and offer drafts
argument-hint: [hours, default 24] or a search phrase
---

If $ARGUMENTS is a number, run `node tools/mail.mjs inbox $ARGUMENTS`. If it is words, run
`node tools/mail.mjs search "$ARGUMENTS"`. Default `inbox 24`.

Then sort what came back into three groups and report them in this order:

1. **Needs a reply from him**: sender, one line of what they want, any date or amount.
2. **Time sensitive**: anything with a deadline, a hearing, a payment date, a site date.
3. **Can wait or is noise**: invoices already going to accounts, newsletters, notifications.
   One line for the whole group.

Keep the numbers from the list so he can say "draft 3" or "read 3". Never quote a whole
email back. End with one offer.
