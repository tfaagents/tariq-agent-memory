#!/usr/bin/env node
// The agent's own scheduler. Runs skills (or a shell command) unattended at the times in
// config/schedule.json, with no launchd and no admin rights, so the agent can add a
// schedule itself when Tariq says yes. Started by .claude/hooks/start.sh in its own screen
// window; one loop, checks every 30 seconds, runs a job at most once per day at its slot.
//
//   config/schedule.json: { "jobs": [
//     { "slug": "morning-send", "time": "06:30", "days": "weekdays" },          a skill, via run-skill.sh
//     { "slug": "rollover", "time": "05:00", "days": "daily", "command": ".claude/hooks/rollover.sh" },
//     { "slug": "inbox-watch", "every": 10, "days": "weekdays", "enabled": false }   every N minutes; enabled:false = parked
//   ] }
//   days: daily | weekdays | mon,tue,wed,thu,fri,sat,sun (comma list)
//   state: work/scheduler-state.json  ({ "<slug>": "YYYY-MM-DD" of the last run })
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CFG = path.join(ROOT, 'config/schedule.json');
const STATE = path.join(ROOT, 'work/scheduler-state.json');
const RUN = path.join(ROOT, '.claude/hooks/run-skill.sh');
const TZ = 'Australia/Brisbane';

const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (_) { return d; } };
const log = (m) => console.log(`${new Date().toISOString()} ${m}`);

function nowBrisbane() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-AU', { timeZone: TZ, weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
    .formatToParts(new Date()).filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hm: `${parts.hour === '24' ? '00' : parts.hour}:${parts.minute}`, day: parts.weekday.toLowerCase().slice(0, 3) };
}
function dueToday(job, day) {
  const d = String(job.days || 'daily').toLowerCase();
  if (d === 'daily') return true;
  if (d === 'weekdays') return !['sat', 'sun'].includes(day);
  return d.split(',').map((x) => x.trim().slice(0, 3)).includes(day);
}
const running = new Set();
function tick() {
  const { date, hm, day } = nowBrisbane();
  const jobs = (readJson(CFG, {}).jobs || []).filter((j) => j.slug && j.enabled !== false && (/^\d{2}:\d{2}$/.test(j.time || '') || Number(j.every) > 0));
  const state = readJson(STATE, {});
  for (const j of jobs) {
    if (!dueToday(j, day) || running.has(j.slug)) continue;
    if (Number(j.every) > 0) {
      // An interval job (e.g. inbox-watch every 10 minutes): state holds the last start time.
      const last = Date.parse(state[`${j.slug}:last`] || 0);
      if (Date.now() - last < Number(j.every) * 60_000) continue;
      state[`${j.slug}:last`] = new Date().toISOString();
    } else {
      if (state[j.slug] === date) continue;
      // Run at the slot or within the following 10 minutes (a restart must not skip a day).
      const [h, m] = j.time.split(':').map(Number); const [nh, nm] = hm.split(':').map(Number);
      const diff = (nh * 60 + nm) - (h * 60 + m);
      if (diff < 0 || diff > 10) continue;
      state[j.slug] = date;
    }
    running.add(j.slug);
    fs.mkdirSync(path.dirname(STATE), { recursive: true }); fs.writeFileSync(STATE, JSON.stringify(state, null, 2));
    const argv = j.command ? [path.resolve(ROOT, j.command)] : [RUN, j.slug];
    log(`running ${j.command ? j.command : `/${j.slug}`}`);
    const child = spawn('/bin/zsh', argv, { cwd: ROOT, stdio: 'ignore', env: process.env, detached: !!j.command });
    if (j.command) child.unref();   // a rollover restarts this very process; let the child outlive it
    child.on('exit', (code) => { running.delete(j.slug); log(`${j.slug} finished (${code})`); });
    child.on('error', (e) => { running.delete(j.slug); log(`${j.slug} failed to start: ${e.message}`); });
  }
}
log(`scheduler up, ${(readJson(CFG, {}).jobs || []).length} job(s) in config/schedule.json`);
tick();
setInterval(tick, 30_000);
