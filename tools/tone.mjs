#!/usr/bin/env node
// His writing voice, from his own sent mail, and what he changes in the agent's drafts.
//
//   node tools/tone.mjs harvest [--days 540] [--max 400]   read his Sent Items into work/voice/corpus.json (local only)
//   node tools/tone.mjs stats                              the counted profile, overall and per audience
//   node tools/tone.mjs spread [--n 30]                    a spread of his emails across time and audience, for /tone-profile
//   node tools/tone.mjs like "<subject or gist>" [--to <address>] [--k 3]   his past replies most like this one
//   node tools/tone.mjs edits [--k 3]                      the last times he changed a draft: what was written, what he sent
//   node tools/tone.mjs edit --suggested <file> --final <file> [--to <address>] [--subject "<s>"] [--source chat]
//   node tools/tone.mjs review [--days 3]                  drafts the agent filed: sent as drafted, edited (pairs printed), dropped
import fs from 'node:fs';
import { OWNER, requireConnection, graph } from './lib/connected.mjs';
import { sample, stats, exemplars, loadCorpus, saveCorpus, recordEdit, recentEdits, readDraftLog, logDraft, stripQuoted, segments, normalise } from './lib/tone.mjs';

const argv = process.argv.slice(2);
const opt = (flag, d) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : d; };
const num = (flag, d) => Number(opt(flag, d));
const [cmd, ...rest] = argv;
const positional = rest.filter((a, i) => !a.startsWith('--') && !(rest[i - 1] || '').startsWith('--'));
const when = (iso) => iso ? new Date(iso).toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Australia/Brisbane' }) : '';
const show = (s) => `${s.greeting ? s.greeting + '\n' : ''}${s.text}${s.signoff ? '\n' + s.signoff : ''}`;
const AUD = ['staff', 'external', 'family'];

try {
  if (cmd === 'harvest') {
    requireConnection('read', 'reading his sent mail'); const g = await graph();
    const days = num('--days', 540), max = num('--max', 400);
    const messages = await g.sentMessagesFull(OWNER, { days, max });
    const samples = messages.map(sample).filter(Boolean);
    if (samples.length < 8) { console.log(`Only ${samples.length} usable of ${messages.length} sent; too few for a profile. Try --days 730.`); process.exit(1); }
    const byAudience = Object.fromEntries(AUD.map((a) => [a, stats(samples.filter((s) => s.audience === a))]));
    saveCorpus({ mailbox: OWNER, harvestedAt: new Date().toISOString(), days, scanned: messages.length, samples, stats: stats(samples), byAudience });
    const st = stats(samples);
    console.log(`${samples.length} usable emails from ${messages.length} sent in the last ${days} days (${AUD.map((a) => `${a} ${samples.filter((s) => s.audience === a).length}`).join(', ')}).`);
    console.log(`Median ${st.medianWords} words, about ${st.meanSentenceWords} words a sentence; opens with ${st.greetings.slice(0, 3).map((x) => `"${x.form}" ${x.pct}%`).join(', ') || 'nothing'}; closes with ${st.signoffs.slice(0, 3).map((x) => `"${x.form}" ${x.pct}%`).join(', ') || 'nothing'}.`);
    console.log('Corpus in work/voice/corpus.json (local only, never shipped). Next: /tone-profile rewrites memory/voice.md from it.');
  } else if (cmd === 'stats') {
    const c = loadCorpus(); if (!c) { console.log('No corpus yet: node tools/tone.mjs harvest'); process.exit(1); }
    console.log(`Harvested ${when(c.harvestedAt)}: ${c.samples.length} emails over ${c.days} days.`);
    console.log('ALL', JSON.stringify(c.stats));
    for (const a of AUD) if (c.byAudience?.[a]) console.log(a.toUpperCase(), JSON.stringify(c.byAudience[a]));
  } else if (cmd === 'spread') {
    const c = loadCorpus(); if (!c) { console.log('No corpus yet: node tools/tone.mjs harvest'); process.exit(1); }
    const n = num('--n', 30);
    const out = [];
    for (const a of AUD) {
      const pool = c.samples.filter((s) => s.audience === a).sort((x, y) => String(x.sentAt).localeCompare(String(y.sentAt)));
      if (!pool.length) continue;
      const want = Math.max(2, Math.round(n * pool.length / c.samples.length));
      const pick = pool.length <= want ? pool : Array.from({ length: want }, (_, i) => pool[Math.floor(i * (pool.length / want))]);
      out.push(...pick);
    }
    out.forEach((s, i) => console.log(`--- ${i + 1} [${s.audience}] to ${s.to[0] || 'someone'} <${s.toAddrs[0] || ''}>, ${when(s.sentAt)}, re: ${s.subject || 'no subject'} ---\n${show(s)}\n`));
  } else if (cmd === 'like') {
    const c = loadCorpus(); if (!c) { console.log('No corpus yet: node tools/tone.mjs harvest'); process.exit(1); }
    const query = positional[0]; if (!query) throw new Error('usage: like "<subject or gist>" [--to <address>] [--k 3]');
    const rows = exemplars(c.samples, query, { k: num('--k', 3), to: opt('--to', null) });
    if (!rows.length) { console.log('Nothing similar in his sent mail; go by memory/voice.md alone.'); process.exit(0); }
    console.log(`${rows.length} past repl${rows.length === 1 ? 'y' : 'ies'} of his most like this${opt('--to') ? ` (to ${opt('--to')} first)` : ''}:`);
    rows.forEach((s, i) => console.log(`\n--- ${i + 1} [${s.audience}] to ${s.to[0] || 'someone'}, ${when(s.sentAt)}, re: ${s.subject || 'no subject'} ---\n${show(s)}`));
  } else if (cmd === 'edits') {
    const rows = recentEdits(num('--k', 3));
    if (!rows.length) { console.log('He has not changed a draft yet.'); process.exit(0); }
    rows.forEach((e, i) => console.log(`--- ${i + 1} ${when(e.at)} (${e.source}) to ${e.to || '?'}, re: ${e.subject || '?'} ---\nI wrote:\n${e.suggested}\n\nHe sent:\n${e.final}\n`));
  } else if (cmd === 'edit') {
    const s = opt('--suggested'), f = opt('--final');
    if (!s || !f) throw new Error('usage: edit --suggested <file> --final <file> [--to <address>] [--subject "<s>"] [--source chat|outlook]');
    const ok = recordEdit({ to: opt('--to', null), subject: opt('--subject', null), suggested: fs.readFileSync(s, 'utf8'), final: fs.readFileSync(f, 'utf8'), source: opt('--source', 'chat') });
    console.log(ok ? 'Recorded. Now write the lesson under Corrections in memory/voice.md.' : 'No difference between the two; nothing recorded.');
  } else if (cmd === 'review') {
    const log = readDraftLog();
    const reviewed = new Set(log.filter((e) => e.reviewed).map((e) => e.reviewed));
    const pending = log.filter((e) => e.draftId && !reviewed.has(e.draftId));
    if (!pending.length) { console.log('No drafts waiting for review.'); process.exit(0); }
    requireConnection('read', 'reading his sent mail'); const g = await graph();
    const sent = await g.sentMessagesFull(OWNER, { days: num('--days', 3) + 7, max: 150 });
    for (const d of pending) {
      const m = sent.find((x) => x.conversationId && x.conversationId === d.conversationId && Date.parse(x.sentDateTime) > Date.parse(d.at));
      const ageDays = (Date.now() - Date.parse(d.at)) / 864e5;
      if (!m) {
        if (ageDays > 7) { logDraft({ reviewed: d.draftId, outcome: 'dropped' }); console.log(`DROPPED: to ${d.to || '?'}, re: ${d.subject || '?'}, drafted ${when(d.at)}, nothing sent in 7 days.`); }
        else console.log(`NOT SENT YET: to ${d.to || '?'}, re: ${d.subject || '?'}, drafted ${when(d.at)}.`);
        continue;
      }
      const his = segments(stripQuoted(m.body?.content || '')); const hisText = `${his.greeting ? his.greeting + '\n' : ''}${his.body}`.trim();
      const mine = normalise(d.text), theirs = normalise(hisText);
      if (mine === theirs || normalise(segments(d.text).body) === normalise(his.body)) {
        logDraft({ reviewed: d.draftId, outcome: 'sent as drafted', sentId: m.id });
        console.log(`SENT AS DRAFTED: to ${d.to || '?'}, re: ${d.subject || '?'}, sent ${when(m.sentDateTime)}.`);
      } else {
        recordEdit({ to: d.to, subject: d.subject, suggested: d.text, final: hisText, source: 'outlook' });
        logDraft({ reviewed: d.draftId, outcome: 'edited', sentId: m.id });
        console.log(`EDITED: to ${d.to || '?'}, re: ${d.subject || '?'}, drafted ${when(d.at)}, sent ${when(m.sentDateTime)}\n--- I wrote ---\n${d.text.trim()}\n--- he sent ---\n${hisText}\n`);
      }
    }
  } else { console.log('usage: harvest [--days N] [--max N] | stats | spread [--n N] | like "<text>" [--to a] [--k N] | edits [--k N] | edit --suggested f --final f | review [--days N]'); process.exit(1); }
} catch (e) { console.error(String(e.message || e)); process.exit(1); }
