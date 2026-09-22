#!/usr/bin/env node
// Jaiah's tool for putting a login into the browser lane's credential store. Not the
// agent's: there is deliberately NO `get`, so nothing here can read a password back out.
//
//   node tools/secrets.mjs list                    the key names, never the values
//   node tools/secrets.mjs set <site>.<field>      reads the value from stdin, not argv
//   node tools/secrets.mjs drop <site>[.<field>]
//   node tools/secrets.mjs where                   the store's path and permissions
//
// The value comes in on stdin so it never lands in the shell history, in `ps`, or in a
// session log:  printf '%s' 'thepassword' | node tools/secrets.mjs set cardportal.password
import fs from 'node:fs';
import { keys, put, drop, STORE } from './lib/secrets.mjs';

const [, , cmd, arg] = process.argv;
const split = (k) => { const [s, f] = String(k || '').split('.'); if (!s) throw new Error('usage: <site>[.<field>]'); return [s, f]; };

try {
  if (cmd === 'list') {
    const k = keys();
    console.log(k.length ? k.join('\n') : 'nothing stored yet');
  } else if (cmd === 'set') {
    const [site, field] = split(arg);
    if (!field) throw new Error('usage: set <site>.<field>, e.g. set cardportal.password');
    const value = fs.readFileSync(0, 'utf8').replace(/\r?\n$/, '');
    if (!value) throw new Error('nothing on stdin. Pipe the value in, do not pass it as an argument.');
    put(site, field, value);
    console.log(`stored ${site}.${field} (${value.length} characters) in ${STORE}`);
  } else if (cmd === 'drop') {
    const [site, field] = split(arg);
    console.log(drop(site, field) ? `removed ${arg}` : `no ${arg} to remove`);
  } else if (cmd === 'where') {
    let mode = 'missing';
    try { mode = '0' + (fs.statSync(STORE).mode & 0o777).toString(8); } catch (_) {}
    console.log(`${STORE}  (${mode})`);
  } else {
    console.log('usage: list | set <site>.<field> (value on stdin) | drop <site>[.<field>] | where');
    process.exit(cmd ? 1 : 0);
  }
} catch (e) { console.error(e.message); process.exit(1); }
