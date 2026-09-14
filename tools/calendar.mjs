#!/usr/bin/env node
// Calendars. Reads every TFA calendar (the directory, tenant-wide since 14 Sep) for the
// morning brief; writes ONLY to
// Tariq's own calendar, and `add` and `move` are on the ask list (Approve on Telegram).
//
//   node tools/calendar.mjs everyone [days]                       every TFA calendar, next N days (default 1)
//   node tools/calendar.mjs add "<title>" <start> <end> [location]  his calendar; times like 2026-09-12T08:00
//   node tools/calendar.mjs move <event-id> <start> <end>          his calendar
// Times are Brisbane local, no timezone suffix. "Remind me to X on Friday" = an 08:00 entry.
import { OWNER, requireConnection, graph } from './lib/connected.mjs';

const [, , cmd, ...args] = process.argv;
const TZ = 'Australia/Brisbane';
const when = (iso) => iso ? new Date(iso).toLocaleString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: TZ }) : '';
const isLocal = (t) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(t || '');

try {
  if (cmd === 'everyone') {
    const days = Number(args[0] || 1);
    const c = requireConnection('read', 'reading the calendars');
    const g = await graph();
    const scope = await g.mailboxScope().catch(() => c.cfg.mailboxes || [OWNER]);
    const boxes = [OWNER, ...scope.filter((b) => b.toLowerCase() !== OWNER.toLowerCase())];
    const to = new Date(Date.now() + days * 864e5).toISOString();
    const short = (mb) => mb.split('@')[0];
    const quiet = [], blocked = [], none = [];
    for (const mb of boxes) {
      let rows = [];
      try { rows = await g.calendarView(mb, { toISO: to }); }
      catch (e) {
        const msg = String(e.message || '');
        if (mb === OWNER) console.log(`${mb} (his): could not read (${msg.slice(0, 80)})`);
        else if (/MailboxNotEnabledForRESTAPI|ResourceNotFound|404/.test(msg)) none.push(mb);
        else blocked.push(mb);
        continue;
      }
      if (!rows.length && mb !== OWNER) { quiet.push(mb); continue; }
      console.log(`${mb}${mb === OWNER ? ' (his)' : ''}: ${rows.length ? '' : 'nothing in the window'}`);
      rows.forEach((r) => console.log(`  ${r.allDay ? 'all day' : when(r.start)}  ${r.subject}${r.location ? ` @ ${r.location}` : ''}${r.organizer ? ` (${r.organizer})` : ''}`));
    }
    if (quiet.length) console.log(`Nothing in the window for ${quiet.length} other${quiet.length === 1 ? '' : 's'}: ${quiet.map(short).join(', ')}`);
    if (blocked.length) console.log(`Could not read ${blocked.length} (Graph says not permitted): ${blocked.map(short).join(', ')}`);
    if (none.length) console.log(`No mailbox: ${none.map(short).join(', ')}`);
  } else if (cmd === 'add') {
    const [title, start, end, location] = args;
    if (!title || !isLocal(start) || !isLocal(end)) throw new Error('usage: add "<title>" <YYYY-MM-DDTHH:MM> <YYYY-MM-DDTHH:MM> [location]');
    requireConnection('read', 'adding to his calendar');
    const g = await graph();
    const ev = await g.api(`/users/${encodeURIComponent(OWNER)}/events`, { method: 'POST', body: JSON.stringify({
      subject: title, start: { dateTime: start, timeZone: TZ }, end: { dateTime: end, timeZone: TZ },
      ...(location ? { location: { displayName: location } } : {}),
    }) });
    console.log(`Added to his calendar: ${title}, ${when(ev.start?.dateTime + '+10:00')} to ${when(ev.end?.dateTime + '+10:00')}${location ? ` @ ${location}` : ''}. id ${ev.id}`);
  } else if (cmd === 'move') {
    const [id, start, end] = args;
    if (!id || !isLocal(start) || !isLocal(end)) throw new Error('usage: move <event-id> <YYYY-MM-DDTHH:MM> <YYYY-MM-DDTHH:MM>');
    requireConnection('read', 'moving an event');
    const g = await graph();
    const ev = await g.api(`/users/${encodeURIComponent(OWNER)}/events/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({
      start: { dateTime: start, timeZone: TZ }, end: { dateTime: end, timeZone: TZ },
    }) });
    console.log(`Moved: ${ev.subject} now ${when(ev.start?.dateTime + '+10:00')} to ${when(ev.end?.dateTime + '+10:00')}`);
  } else { console.log('usage: everyone [days] | add "<title>" <start> <end> [location] | move <event-id> <start> <end>'); process.exit(1); }
} catch (e) { console.error(String(e.message || e)); process.exit(1); }
