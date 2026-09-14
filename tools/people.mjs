#!/usr/bin/env node
// Who is who at TFA, from the Microsoft 365 directory (User.Read.All on the Tariq Assistant
// app). Read only. Cached in work/people.json for twelve hours; --fresh reads again.
//
//   node tools/people.mjs                 everyone with a mailbox: name, address, title
//   node tools/people.mjs find <words>    match on name, address or title
import { requireConnection, graph } from './lib/connected.mjs';

const argv = process.argv.slice(2);
const fresh = argv.includes('--fresh');
const [cmd, ...rest] = argv.filter((a) => a !== '--fresh');
try {
  requireConnection('read', 'reading the TFA directory');
  const g = await graph();
  const people = await g.directoryPeople({ maxAgeHours: fresh ? 0 : 12 });
  const words = (cmd === 'find' ? rest : []).map((w) => w.toLowerCase());
  const rows = words.length ? people.filter((p) => words.every((w) => `${p.name} ${p.mail} ${p.title || ''}`.toLowerCase().includes(w))) : people;
  if (!rows.length) { console.log(words.length ? `Nobody at TFA matches "${words.join(' ')}".` : 'The directory returned nobody with a mailbox.'); process.exit(0); }
  console.log(`${rows.length} ${rows.length === 1 ? 'person' : 'people'} at TFA${words.length ? ` matching "${words.join(' ')}"` : ''}:`);
  rows.forEach((p) => console.log(`- ${p.name} <${p.mail}>${p.title ? `, ${p.title}` : ''}`));
} catch (e) { console.error(String(e.message || e)); process.exit(1); }
