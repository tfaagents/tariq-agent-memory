#!/usr/bin/env node
// Tariq's own list of bot builds: read it, batch it, add to it, and prove nothing was lost.
//
// THE RULE THIS TOOL ENFORCES. His 43 items are his. No item is ever reworded, merged,
// reordered or dropped, and that is checked mechanically rather than promised. His words
// on why, 15 Sep 2026: "I hate how they don't keep how it was. Okay, you're improving it.
// Great. But like when you merged it, it always loses two sentences."
//
// The check is an ordered-subsequence test over the paragraphs of word/document.xml: every
// paragraph of the source must appear in the result, character for character, in the same
// order. New paragraphs may be inserted anywhere. It is not a prefix test, because an
// insert in the middle is legal and shifts everything after it. A single silently
// corrected typo fails it.
//
//   node tools/botlist.mjs items [docx]            his 43 items with their permanent ids
//   node tools/botlist.mjs batches                 the batched view, checked for coverage
//   node tools/botlist.mjs build --out <docx>       build the three-section document
//   node tools/botlist.mjs verify <before> <after> [--allow <part>] [--batches]
//   node tools/botlist.mjs stage "<his words>"      add an item, ready to put back
//   node tools/botlist.mjs amend <id> "<his words>"  reword one item, ready to put back
//
// `stage` deliberately does NOT upload. Putting a file into his OneDrive is on the agent's
// ask list, which is what raises Approve on his Telegram; if this tool spawned
// `files.mjs put` itself, the agent would only have run `botlist.mjs stage` and the gate
// would never fire. So stage prepares and verifies, then prints the put command for the
// agent to run as its own step.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  openDocx, part, partText, setPart, saveDocx, changedParts,
  paragraphs, numIdOf, escapeXml,
} from './lib/docx.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOC = 'word/document.xml';
const NUM = 'word/numbering.xml';

/**
 * Run the files tool and hand back what it said. Its stderr is captured rather than let
 * through, so a raw Graph error like `404: {"error":...}` never lands in front of Tariq;
 * the caller decides what to say instead.
 */
function files(args) {
  try {
    return { ok: true, out: execFileSync('node', [path.join(ROOT, 'tools/files.mjs'), ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim() };
  } catch (e) {
    return { ok: false, out: String(e.stdout || '').trim(), err: String(e.stderr || e.message || '').trim() };
  }
}

export function loadConfig(file = path.join(ROOT, 'config/botlist.json')) {
  const cfg = JSON.parse(fs.readFileSync(file, 'utf8'));
  cfg._dir = path.dirname(file);
  return cfg;
}

export const idFor = (n, prefix = 'B') => `${prefix}${String(n).padStart(2, '0')}`;

/**
 * His items, in document order, with their permanent ids.
 *
 * An item is a non-empty paragraph in a numbered list. That is the whole definition, and
 * it is deliberately the same rule Word uses to print the numbers, so the id in this tool
 * and the number on his screen can never disagree. The unnumbered line between his two
 * lists ("CreateAgent for doing random shit") is a heading, not an item, and his two
 * trailing empty numbered paragraphs are the blank line he types the next one on.
 */
export function readItems(pkg, prefix = 'B') {
  const xml = partText(pkg, DOC);
  const out = [];
  for (const p of paragraphs(xml)) {
    const numId = numIdOf(p.xml);
    if (!numId || !p.text.trim()) continue;
    out.push({ id: idFor(out.length + 1, prefix), n: out.length + 1, numId, text: p.text, para: p });
  }
  return out;
}

// ---- the check ----

/**
 * Is `after` the same document as `before` plus insertions?
 * Returns { ok, lines } where lines is what a person should be shown either way.
 */
export function verify(beforePkg, afterPkg, { allowParts = [], items = null, config = null } = {}) {
  const lines = [];
  let ok = true;

  const before = paragraphs(partText(beforePkg, DOC)).map((p) => p.text);
  const after = paragraphs(partText(afterPkg, DOC)).map((p) => p.text);
  let i = 0;
  const added = [];
  for (const text of after) {
    if (i < before.length && text === before[i]) i += 1;
    else added.push(text);
  }
  if (i !== before.length) {
    ok = false;
    // Report the FIRST divergence only. Once the order breaks every later paragraph fails
    // to match too, and "41 of 48 missing" for one corrected typo sends whoever reads it
    // hunting a disaster that is not there.
    lines.push(`FAIL: paragraph ${i + 1} of ${before.length} is not present, verbatim, in order.`);
    lines.push(`  expected: ${JSON.stringify(before[i])}`);
    lines.push('  Everything after this point is unchecked. Fix this one and run it again.');
  } else {
    lines.push(`PASS: all ${before.length} of his paragraphs present, verbatim, in order.`);
    lines.push(`      ${added.length} paragraphs added.`);
  }

  const allowed = new Set([DOC, ...allowParts]);
  const lost = beforePkg.order.filter((n) => !afterPkg.entries.has(n));
  const gained = afterPkg.order.filter((n) => !beforePkg.entries.has(n));
  const rewritten = beforePkg.order.filter((n) => {
    if (!afterPkg.entries.has(n)) return false;
    return Buffer.compare(part(beforePkg, n), part(afterPkg, n)) !== 0;
  });
  const illegal = rewritten.filter((n) => !allowed.has(n));
  lines.push(`      parts: ${lost.length} lost, ${gained.length} added, ${rewritten.length} rewritten (${rewritten.join(', ') || 'none'}).`);
  if (lost.length) { ok = false; lines.push(`FAIL: parts of the document were dropped from the file: ${lost.join(', ')}`); }
  if (illegal.length) { ok = false; lines.push(`FAIL: parts rewritten that were not declared: ${illegal.join(', ')}`); }

  // The batched view has its own promise: each of his 43 items appears there exactly once,
  // its text carried through unchanged. Checked by exact paragraph match, not by eyeballing.
  if (items && config) {
    const texts = new Map(after.map((t) => [t, (after.filter((x) => x === t)).length]));
    const byId = new Map(items.map((it) => [it.id, it]));
    // The catch-all absorbs ids added since the batches were drawn up, so a new item is
    // parked visibly rather than dropped or filed by guess. Without one configured, an
    // unlisted id is a failure.
    const listed = [...config.batches.flatMap((b) => b.ids), ...(config._catchAllIds || [])];
    const problems = [];
    for (const it of items) {
      const composed = `${it.id}  ${it.text}`;
      const n = texts.get(composed) || 0;
      if (n !== 1) problems.push(`${it.id} appears ${n} times in the batched view, expected exactly 1`);
    }
    for (const id of listed) if (!byId.has(id)) problems.push(`${id} is in a batch but not in his list`);
    const dupes = listed.filter((x, k) => listed.indexOf(x) !== k);
    if (dupes.length) problems.push(`listed in more than one batch: ${[...new Set(dupes)].join(', ')}`);
    const missing = items.map((it) => it.id).filter((id) => !listed.includes(id));
    if (missing.length) problems.push(`not in any batch: ${missing.join(', ')}`);
    if (problems.length) { ok = false; problems.forEach((p) => lines.push(`FAIL: ${p}`)); }
    else lines.push(`PASS: all ${items.length} items in the batched view exactly once, text unchanged.`);
  }

  return { ok, lines, added };
}

// ---- writing paragraphs ----

const run = (text, rPr = '') => `<w:r>${rPr ? `<w:rPr>${rPr}</w:rPr>` : ''}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;
const para = (runs, pPr = '') => `<w:p>${pPr ? `<w:pPr>${pPr}</w:pPr>` : ''}${runs}</w:p>`;

const GREY = '<w:i/><w:color w:val="595959"/><w:sz w:val="18"/>';
const h1 = (t) => para(run(t), '<w:pStyle w:val="Heading1"/>');
const h2 = (t) => para(run(t), '<w:pStyle w:val="Heading2"/>');
const h3 = (t) => para(run(t), '<w:pStyle w:val="Heading3"/>');
const body = (t) => para(run(t));
const note = (t, indent = 0) => para(run(t, GREY), `${indent ? `<w:ind w:left="${indent}"/>` : ''}<w:spacing w:after="80"/>`);
const bullet = (t) => para(run('•  ') + run(t), '<w:ind w:left="640" w:hanging="360"/><w:spacing w:after="80"/>');
/** A status note under an item that is done or needs no agent: a bold lead line and dot points,
 *  indented under his line like the cross-reference notes. Generated from config on a rebuild. */
const STATUS_LEAD = '<w:b/><w:color w:val="1B2430"/><w:sz w:val="18"/>';
const statusBlock = (sn) => [
  para(run(sn.title, STATUS_LEAD), '<w:ind w:left="720"/><w:spacing w:before="60" w:after="40"/>'),
  ...(sn.lines || []).map((l) => para(run('•  ', GREY) + run(l, GREY), '<w:ind w:left="1080" w:hanging="360"/><w:spacing w:after="40"/>')),
].join('');
/** One line of the batched view: the bold id, then his words, untouched. */
const idLine = (id, text) => para(
  run(`${id}  `, '<w:b/>') + run(text),
  '<w:ind w:left="720" w:hanging="720"/><w:spacing w:after="80"/>',
);

// ---- the build ----

/** Renumber a numbered list so Word prints B01, B02 ... instead of 1, 2 ... */
function relabelNumbering(numXml, numId, start) {
  const numDef = numXml.match(new RegExp(`<w:num [^>]*w:numId="${numId}"[^>]*>[\\s\\S]*?</w:num>`));
  if (!numDef) throw new Error(`numbering.xml has no numId ${numId}`);
  const absId = numDef[0].match(/<w:abstractNumId\s+w:val="(\d+)"/)?.[1];
  if (absId == null) throw new Error(`numId ${numId} has no abstractNumId`);
  const absRe = new RegExp(`<w:abstractNum [^>]*w:abstractNumId="${absId}"[^>]*>[\\s\\S]*?</w:abstractNum>`);
  const abs = numXml.match(absRe);
  if (!abs) throw new Error(`numbering.xml has no abstractNum ${absId}`);
  const lvlRe = /<w:lvl w:ilvl="0"[^>]*>[\s\S]*?<\/w:lvl>/;
  const lvl = abs[0].match(lvlRe);
  if (!lvl) throw new Error(`abstractNum ${absId} has no level 0`);
  const patched = lvl[0]
    .replace(/<w:start w:val="\d+"\/>/, `<w:start w:val="${start}"/>`)
    .replace(/<w:numFmt w:val="[^"]*"\/>/, '<w:numFmt w:val="decimalZero"/>')
    .replace(/<w:lvlText w:val="[^"]*"\/>/, '<w:lvlText w:val="B%1."/>')
    .replace(/<w:ind [^>]*\/>/, '<w:ind w:left="1080" w:hanging="720"/>');
  return { xml: numXml.replace(absRe, abs[0].replace(lvlRe, patched)), abstractNumId: absId };
}

function crossRefLine(ref, byId) {
  const name = (id) => `${id} (${(byId.get(id)?.text || '').trim().split(/[.,]/)[0].slice(0, 60)})`;
  if (ref.confirm) {
    return `Cross-reference. You wrote "${ref.his}". By that number it is ${name(ref.literal)}, which is not what this item is about. By subject it is ${ref.likely.map(name).join(' and ')}. Left exactly as you wrote it. Worth you confirming which one you meant.`;
  }
  return `Cross-reference. Your "${ref.his}" is ${ref.resolved.map(name).join(' and ')}.`;
}

/**
 * Build the three-section document from his own file, by insertion only.
 *
 * Not one paragraph of his is touched, not even its formatting. That includes his two
 * trailing EMPTY numbered paragraphs: they stay in the list on purpose, because they are
 * the blank line he already types his next item on, and Word numbers them B44 and B45. He
 * types there, it becomes an item, and the printed number and the id agree with no help
 * from anyone.
 */
export function buildDocument(pkg, cfg) {
  const prefix = cfg.idPrefix || 'B';
  const items = readItems(pkg, prefix);
  if (!items.length) throw new Error('no numbered items found in the source document');
  const byId = new Map(items.map((it) => [it.id, it]));
  cfg._catchAllIds = [];   // cleared per build, so a second build cannot inherit the first's

  // Ids come from document order, so each list starts at the number of its first item.
  let numXml = partText(pkg, NUM);
  const seen = new Map();
  for (const it of items) if (!seen.has(it.numId)) seen.set(it.numId, it.n);
  const usedAbstract = new Map();
  for (const [numId, start] of seen) {
    const r = relabelNumbering(numXml, numId, start);
    if (usedAbstract.has(r.abstractNumId)) {
      throw new Error(`lists ${usedAbstract.get(r.abstractNumId)} and ${numId} share one numbering definition, so they cannot start at different ids`);
    }
    usedAbstract.set(r.abstractNumId, numId);
    numXml = r.xml;
  }
  setPart(pkg, NUM, numXml);

  let xml = partText(pkg, DOC);
  const all = paragraphs(xml);
  const inserts = [];

  // --- front matter, after his title and the blank line under it ---
  const front = [
    para(run(cfg.subtitle, '<w:i/><w:color w:val="595959"/><w:sz w:val="24"/>')),
    h1('How to read this'),
    ...cfg.howToRead.map(body),
    body(cfg.crossRefNote),
    h1(`Section 1. Your list, word for word`),
    note('Nothing in this section has been changed. The blank numbered lines at the end are where to type your next one: it takes the next id on its own.'),
  ].join('');
  const afterTitle = all[1] || all[0];
  inserts.push([afterTitle.end, front]);

  // --- a note under each cross-referencing item ---
  for (const ref of cfg.crossRefs || []) {
    const it = byId.get(ref.id);
    if (!it) throw new Error(`crossRefs names ${ref.id}, which is not in his list`);
    inserts.push([it.para.end, note(crossRefLine(ref, byId), 720)]);
  }

  // --- a status note under each item that is done, or turned out to need no agent ---
  const statusById = new Map((cfg.statusNotes || []).map((sn) => [sn.id, sn]));
  for (const sn of statusById.values()) {
    const it = byId.get(sn.id);
    if (!it) throw new Error(`statusNotes names ${sn.id}, which is not in his list`);
    inserts.push([it.para.end, statusBlock(sn)]);
  }

  // --- sections 2 and 3, after his last paragraph and before the section properties ---
  const built = new Date().toISOString().slice(0, 10);
  const tail = [h1('Section 2. The same items, batched'),
    note(`Your ${items.length} items sorted into batches of similar work, by the agent that would build them, as at ${built}. Every item appears once and only once, and the words are yours. The id is how to call one up. Anything added to section 1 after ${built} is in your list with its id and is not in a batch yet.`)];
  for (const b of cfg.batches) {
    tail.push(h2(b.title));
    if (b.what) tail.push(body(b.what));
    if (b.needs) tail.push(note(`What it needs: ${b.needs}`));
    for (const id of b.ids) {
      const it = byId.get(id);
      if (!it) throw new Error(`batch "${b.title}" names ${id}, which is not in his list`);
      tail.push(idLine(it.id, it.text));
      const sn = statusById.get(it.id);
      if (sn?.short) tail.push(note(sn.short, 720));
    }
  }
  if (cfg.catchAll) {
    const listedIds = cfg.batches.flatMap((b) => b.ids);
    const spare = items.filter((it) => !listedIds.includes(it.id));
    // Recorded on the config object so verify() checks the same set that was rendered.
    cfg._catchAllIds = spare.map((it) => it.id);
    if (spare.length) {
      tail.push(h2(cfg.catchAll.title));
      if (cfg.catchAll.what) tail.push(body(cfg.catchAll.what));
      if (cfg.catchAll.needs) tail.push(note(`What it needs: ${cfg.catchAll.needs}`));
      spare.forEach((it) => tail.push(idLine(it.id, it.text)));
    }
  }
  const g = cfg.chatgpt;
  tail.push(h1(g.label));
  g.intro.forEach((t) => tail.push(note(t)));
  tail.push(body(g.objective));
  for (const a of g.agents) { tail.push(h3(a.title)); tail.push(body(a.body)); }
  tail.push(h2(g.systemWideTitle));
  g.systemWide.forEach((t) => tail.push(bullet(t)));
  tail.push(note(`Built ${built} from your own file by tools/botlist.mjs. Every paragraph you typed was checked present, word for word, in order, before this file was saved.`));
  inserts.push([all[all.length - 1].end, tail.join('')]);

  // Apply back to front so the offsets taken above stay true.
  inserts.sort((a, b2) => b2[0] - a[0]);
  for (const ins of inserts) {
    if (ins.length === 2) xml = xml.slice(0, ins[0]) + ins[1] + xml.slice(ins[0]);
    else xml = xml.slice(0, ins[0]) + ins[2] + xml.slice(ins[1]);
  }
  setPart(pkg, DOC, xml);
  return { items, changed: changedParts(pkg) };
}

/**
 * Reword one item, and nothing else.
 *
 * WHY THIS IS A DIFFERENT CHECK. Adding is provable with the subsequence test: every
 * paragraph he typed is still there. Changing one deliberately breaks that test, so the
 * guarantee has to be stated differently and more tightly: after the edit, the list of
 * paragraphs must equal the list before it with EXACTLY the named ones substituted.
 * Nothing added, nothing removed, nothing reordered, and no second paragraph quietly
 * touched. That is what verifyAmend asserts.
 *
 * Two paragraphs change, not one, when the document has already been built: his item in
 * section 1, and the line carrying the same id in the batched view. Leaving the second
 * behind would show him his old wording under section 2 and his new wording under section
 * 1, which reads like the change did not take.
 */
export function amendItem(pkg, id, newText, prefix = 'B') {
  const items = readItems(pkg, prefix);
  const item = items.find((it) => it.id === id);
  if (!item) throw new Error(`there is no ${id} in his list (it runs ${items[0]?.id} to ${items[items.length - 1]?.id})`);
  if (!String(newText).trim()) throw new Error(`refusing to blank ${id}. Emptying an item is removing it, and removing is not something this does.`);
  if (newText === item.text) throw new Error(`${id} already reads exactly that, so there is nothing to change.`);

  const xml = partText(pkg, DOC);
  const all = paragraphs(xml);
  const composed = `${item.id}  ${item.text}`;
  const inBatched = all.filter((p) => p.text === composed);
  if (inBatched.length > 1) throw new Error(`${id} appears ${inBatched.length} times in the batched view, so this document is not in a state to edit. Rebuild it first.`);

  // Back to front, so the offsets taken above stay true.
  const edits = [];
  if (inBatched.length) edits.push({ para: inBatched[0], xml: idLine(item.id, newText), text: `${item.id}  ${newText}` });
  edits.push({ para: item.para, xml: rewriteParagraphText(item.para.xml, newText), text: newText });
  edits.sort((a, b) => b.para.start - a.para.start);

  let out = xml;
  for (const e of edits) out = out.slice(0, e.para.start) + e.xml + out.slice(e.para.end);
  setPart(pkg, DOC, out);
  return {
    id: item.id,
    was: item.text,
    now: newText,
    expected: all.map((p) => {
      const hit = edits.find((e) => e.para.start === p.start);
      return hit ? hit.text : p.text;
    }),
  };
}

/** Swap a paragraph's words, keeping its own paragraph and character formatting. */
function rewriteParagraphText(pXml, text) {
  const pPr = pXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/)?.[0] || '';
  const rPr = pXml.match(/<w:r\b[^>]*>\s*<w:rPr>([\s\S]*?)<\/w:rPr>/)?.[1] || '';
  return `<w:p>${pPr}${run(text, rPr)}</w:p>`;
}

/**
 * After an amend: the paragraphs must be exactly what they were, with only the substitutions
 * the amend declared. Anything else, in either direction, fails.
 */
export function verifyAmend(beforePkg, afterPkg, expected) {
  const lines = [];
  let ok = true;
  const after = paragraphs(partText(afterPkg, DOC)).map((p) => p.text);
  if (after.length !== expected.length) {
    ok = false;
    lines.push(`FAIL: the document had ${expected.length} paragraphs and now has ${after.length}. An amend must not add or remove any.`);
  } else {
    const off = after.map((t, i) => (t === expected[i] ? null : i)).filter((i) => i !== null);
    if (off.length) {
      ok = false;
      lines.push(`FAIL: ${off.length} paragraph(s) do not match what the change said it would write.`);
      for (const i of off.slice(0, 3)) {
        lines.push(`  paragraph ${i + 1} expected: ${JSON.stringify(expected[i])}`);
        lines.push(`  paragraph ${i + 1} actually: ${JSON.stringify(after[i])}`);
      }
    } else {
      lines.push(`PASS: ${expected.length} paragraphs, only the change asked for, nothing added, removed or reordered.`);
    }
  }
  const lost = beforePkg.order.filter((n) => !afterPkg.entries.has(n));
  const rewritten = beforePkg.order.filter((n) => afterPkg.entries.has(n) && Buffer.compare(part(beforePkg, n), part(afterPkg, n)) !== 0);
  const illegal = rewritten.filter((n) => n !== DOC);
  lines.push(`      parts: ${lost.length} lost, ${rewritten.length} rewritten (${rewritten.join(', ') || 'none'}).`);
  if (lost.length) { ok = false; lines.push(`FAIL: parts dropped from the file: ${lost.join(', ')}`); }
  if (illegal.length) { ok = false; lines.push(`FAIL: parts rewritten that a change may not touch: ${illegal.join(', ')}`); }
  return { ok, lines };
}

/**
 * Put his current items onto the pristine base, so a rebuild can regenerate sections 2 and
 * 3 without inheriting the last build's copy of them.
 *
 * WHY IT WORKS THIS WAY. Once the file on his Desktop holds all three sections, rebuilding
 * it in place would mean recognising which paragraphs we inserted last time and cutting
 * them out. Matching our own output back out of a document a person has since edited is
 * the fragile kind of clever. Starting from the base every time avoids the question, and
 * the only thing that has to survive the trip is his items, which are carried over as
 * their own paragraph XML so his formatting and any wording he changed come with them.
 *
 * It refuses rather than guesses if items have gone missing: fewer items live than in the
 * base means one was deleted, and a rebuild is not the place to decide that.
 */
export function reconcile(basePkg, liveItems) {
  const baseItems = readItems(basePkg);
  if (!baseItems.length) throw new Error('the base document has no numbered items');
  if (liveItems.length < baseItems.length) {
    throw new Error(`his file has ${liveItems.length} items and the base has ${baseItems.length}, so ${baseItems.length - liveItems.length} have been deleted since. Rebuilding would put them back. Check with him, then move the base on.`);
  }
  let xml = partText(basePkg, DOC);
  const reworded = [];
  // Back to front, so the offsets taken from the base stay true as we go.
  for (let i = baseItems.length - 1; i >= 0; i--) {
    const b = baseItems[i];
    const l = liveItems[i];
    if (b.text === l.text) continue;
    reworded.push({ id: b.id, was: b.text, now: l.text });
    xml = xml.slice(0, b.para.start) + l.para.xml + xml.slice(b.para.end);
  }
  const extras = liveItems.slice(baseItems.length);
  if (extras.length) {
    // Recomputed after the replacements above, and inserted after his last item so the new
    // ones land at the end of section 1 rather than after his blank lines.
    let last = null;
    for (const p of paragraphs(xml)) if (numIdOf(p.xml) && p.text.trim()) last = p;
    xml = xml.slice(0, last.end) + extras.map((e) => e.para.xml).join('') + xml.slice(last.end);
  }
  setPart(basePkg, DOC, xml);
  return { reworded: reworded.reverse(), added: extras.map((e) => ({ id: e.id, text: e.text })) };
}

// ---- adding an item ----

/**
 * Append items to the end of his list, using his own last list item as the template so the
 * new one carries exactly his formatting. Returns the ids given out.
 */
export function appendItems(pkg, texts) {
  const prefix = 'B';
  const items = readItems(pkg, prefix);
  const last = items[items.length - 1];
  if (!last) throw new Error('no numbered items found, so there is no list to add to');
  const pPr = last.para.xml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/)?.[0] || '';
  const rPr = last.para.xml.match(/<w:r>\s*<w:rPr>([\s\S]*?)<\/w:rPr>/)?.[1] || '';
  const block = texts.map((t) => para(run(t, rPr), pPr.replace(/^<w:pPr>|<\/w:pPr>$/g, '') ? pPr.slice(7, -8) : '')).join('');
  let xml = partText(pkg, DOC);
  xml = xml.slice(0, last.para.end) + block + xml.slice(last.para.end);
  setPart(pkg, DOC, xml);
  return texts.map((t, k) => ({ id: idFor(items.length + 1 + k, prefix), text: t }));
}

// ---- cli ----

function cli(argv) {
  const [cmd, ...rest] = argv;
  const flag = (name, fallback = null) => {
    const i = rest.indexOf(`--${name}`);
    return i >= 0 ? rest[i + 1] : fallback;
  };
  const has = (name) => rest.includes(`--${name}`);
  const positional = rest.filter((a, i) => !a.startsWith('--') && !(i > 0 && rest[i - 1].startsWith('--') && !['batches', 'dry-run', 'force'].includes(rest[i - 1].slice(2))));
  const cfg = loadConfig();
  // Where to read his list from. The frozen copy in the client folder on Jaiah's Mac is
  // the default; on the mini that folder does not exist, so the last copy `stage`
  // downloaded stands in. Never silently read nothing.
  const source = () => {
    const explicit = flag('source');
    if (explicit) return path.resolve(explicit);
    for (const c of [path.resolve(cfg._dir, cfg.frozenSource), path.join(ROOT, 'work/botlist/current.docx')]) {
      if (fs.existsSync(c)) return c;
    }
    throw new Error(`no copy of his list to read. Pass --source <docx>, or run "stage" first to download one from ${cfg.onedrivePath}.`);
  };

  if (cmd === 'items') {
    const file = positional[0] || source();
    const items = readItems(openDocx(file), cfg.idPrefix);
    console.log(`${items.length} items in ${file}`);
    items.forEach((it) => console.log(`${it.id}  ${it.text.trim()}`));
    return 0;
  }

  if (cmd === 'batches') {
    const items = readItems(openDocx(source()), cfg.idPrefix);
    const byId = new Map(items.map((it) => [it.id, it]));
    const listed = cfg.batches.flatMap((b) => b.ids);
    for (const b of cfg.batches) {
      console.log(`\n${b.title}`);
      b.ids.forEach((id) => console.log(`  ${id}  ${(byId.get(id)?.text || '*** NOT IN HIS LIST ***').trim()}`));
    }
    const missing = items.map((it) => it.id).filter((id) => !listed.includes(id));
    const dupes = [...new Set(listed.filter((x, k) => listed.indexOf(x) !== k))];
    console.log(`\n${listed.length} listed, ${items.length} in his list. missing: ${missing.join(', ') || 'none'}. twice: ${dupes.join(', ') || 'none'}`);
    return missing.length || dupes.length ? 1 : 0;
  }

  if (cmd === 'build') {
    const src = source();
    const out = flag('out') || path.join(ROOT, 'work/botlist/built.docx');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const pkg = openDocx(src);
    const { items, changed } = buildDocument(pkg, cfg);
    saveDocx(pkg, out);
    const res = verify(openDocx(src), openDocx(out), { allowParts: [NUM], items, config: cfg });
    res.lines.forEach((l) => console.log(l));
    console.log(`      parts changed on purpose: ${changed.join(', ')}`);
    if (!res.ok) { console.log(`\nNOT SAVED AS GOOD: ${out} failed its own check.`); return 1; }
    console.log(`\nBuilt ${out} from ${src}.`);
    return 0;
  }

  if (cmd === 'verify') {
    const [before, after] = positional;
    if (!before || !after) { console.log('usage: verify <before.docx> <after.docx> [--allow <part>] [--batches]'); return 1; }
    const allowParts = rest.reduce((acc, a, i) => (a === '--allow' ? [...acc, rest[i + 1]] : acc), []);
    const beforePkg = openDocx(before);
    const opts = { allowParts };
    if (has('batches')) { opts.items = readItems(beforePkg, cfg.idPrefix); opts.config = cfg; }
    const res = verify(beforePkg, openDocx(after), opts);
    res.lines.forEach((l) => console.log(l));
    return res.ok ? 0 : 1;
  }

  if (cmd === 'stage') {
    const text = positional.join(' ').trim();
    if (!text) { console.log('usage: stage "<what he wants added>" [--from <local docx>] [--out <local docx>]'); return 1; }
    const dir = path.join(ROOT, 'work/botlist');
    fs.mkdirSync(dir, { recursive: true });
    let from = flag('from');
    if (!from) {
      // Read only, and already on the agent's allow list. Doing it here rather than in the
      // skill is what guarantees the etag in work/onedrive-versions.json belongs to the
      // exact copy being edited, which is what makes the put below refuse to clobber him.
      from = path.join(dir, 'current.docx');
      const got = files(['get', cfg.onedrivePath, '--to', from]);
      if (!got.ok) throw new Error(`could not download ${cfg.onedrivePath}: ${got.err || got.out}`);
      console.log(got.out);
    }
    const out = flag('out') || path.join(dir, 'updated.docx');
    const pkg = openDocx(from);
    const added = appendItems(pkg, [text]);
    saveDocx(pkg, out);
    const res = verify(openDocx(from), openDocx(out), { allowParts: [] });
    res.lines.forEach((l) => console.log(l));
    if (!res.ok) { console.log('\nNot putting anything back: the check failed.'); return 1; }
    added.forEach((a) => console.log(`\nAdded ${a.id}: ${a.text}`));
    if (flag('from')) {
      // Staged from a local file, so this run has no idea which OneDrive path it belongs
      // to. Printing the put command for his list here would invite someone to upload
      // whatever local file they happened to stage over the top of it.
      console.log(`\nStaged from a local file (${from}). No put command is implied: run "stage" with no --from when the intention is to update ${cfg.onedrivePath}.`);
      return 0;
    }
    console.log(`\nReady. To put it back (this is the step he approves on Telegram):`);
    console.log(`  node tools/files.mjs put ${JSON.stringify(out)} ${JSON.stringify(cfg.onedrivePath)}`);
    return 0;
  }

  if (cmd === 'amend') {
    const [id, ...words] = positional;
    const text = words.join(' ').trim();
    if (!id || !text) { console.log('usage: amend <id> "<his new wording>" [--from <local docx>] [--out <local docx>]'); return 1; }
    const dir = path.join(ROOT, 'work/botlist');
    fs.mkdirSync(dir, { recursive: true });
    let from = flag('from');
    if (!from) {
      from = path.join(dir, 'current.docx');
      const got = files(['get', cfg.onedrivePath, '--to', from]);
      if (!got.ok) throw new Error(`could not download ${cfg.onedrivePath}: ${got.err || got.out}`);
      console.log(got.out);
    }
    const out = flag('out') || path.join(dir, 'updated.docx');
    const pkg = openDocx(from);
    const change = amendItem(pkg, id.toUpperCase(), text, cfg.idPrefix);
    saveDocx(pkg, out);
    const res = verifyAmend(openDocx(from), openDocx(out), change.expected);
    res.lines.forEach((l) => console.log(l));
    if (!res.ok) { console.log('\nNot putting anything back: the check failed.'); return 1; }
    console.log(`\n${change.id} was: ${JSON.stringify(change.was)}`);
    console.log(`${change.id} now: ${JSON.stringify(change.now)}`);
    // The cross-reference notes are Jaiah's annotation, generated from config on a rebuild.
    // If he rewords an item that carries one, the note under it can now contradict the line
    // above it, and nobody would know until a person read both.
    const ref = (cfg.crossRefs || []).find((r) => r.id === change.id);
    if (ref) {
      console.log(`\n⚠️  ${change.id} carries a cross-reference note about his "${ref.his}". That note is`);
      console.log(`    unchanged and may now contradict the new wording. Tell him it is there and that`);
      console.log(`    Jaiah will settle it; it is regenerated from config/botlist.json on a rebuild.`);
    }
    if (flag('from')) {
      console.log(`\nStaged from a local file (${from}). No put command is implied: run "amend" with no --from when the intention is to update ${cfg.onedrivePath}.`);
      return 0;
    }
    console.log(`\nRead it back to him before putting it back. This is the step he approves on Telegram:`);
    console.log(`  node tools/files.mjs put ${JSON.stringify(out)} ${JSON.stringify(cfg.onedrivePath)}`);
    return 0;
  }

  if (cmd === 'rebuild') {
    // Jaiah's command, from his Mac, because it needs the pristine base in the client
    // folder. It regenerates sections 2 and 3 of the ONE file on his Desktop from his
    // current items. The agent never runs it: adding an item does not need it.
    const dir = path.join(ROOT, 'work/botlist');
    fs.mkdirSync(dir, { recursive: true });
    const base = source();
    let live = flag('live');
    if (!live) {
      live = path.join(dir, `pre-rebuild-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.docx`);
      const got = files(['get', cfg.onedrivePath, '--to', live]);
      if (!got.ok) throw new Error(`could not download ${cfg.onedrivePath}: ${got.err || got.out}`);
      console.log(got.out);
    }
    const livePkg = openDocx(live);
    const liveItems = readItems(livePkg, cfg.idPrefix);
    const liveParas = paragraphs(partText(livePkg, DOC)).length;

    const pkg = openDocx(base);
    const moved = reconcile(pkg, liveItems);
    const { items } = buildDocument(pkg, cfg);
    const out = flag('out') || path.join(dir, 'rebuilt.docx');
    saveDocx(pkg, out);

    // Checked against the base AND against his live file, because the base only proves the
    // 43 he started with and the live file is what he has in front of him today.
    const vsBase = verify(openDocx(base), openDocx(out), { allowParts: [NUM], items, config: cfg });
    vsBase.lines.forEach((l) => console.log(l));
    const builtTexts = paragraphs(partText(openDocx(out), DOC)).map((p) => p.text);
    const lost = liveItems.filter((it) => !builtTexts.includes(it.text));
    if (lost.length) {
      console.log(`FAIL: ${lost.length} item(s) in his file are not in the rebuild: ${lost.map((l) => l.id).join(', ')}`);
      return 1;
    }
    console.log(`PASS: all ${liveItems.length} items from his file present, verbatim.`);
    if (!vsBase.ok) { console.log('\nNot putting anything back: the check failed.'); return 1; }

    moved.added.forEach((a) => console.log(`      carried over from his file: ${a.id} ${JSON.stringify(a.text)}`));
    moved.reworded.forEach((r) => console.log(`      he reworded ${r.id}, his wording kept: ${JSON.stringify(r.now)}`));
    if (cfg._catchAllIds?.length) console.log(`      parked in "${cfg.catchAll.title}": ${cfg._catchAllIds.join(', ')}`);
    console.log(`\n⚠️  A rebuild regenerates sections 2 and 3 from scratch. His items are carried over and`);
    console.log(`    checked above; free text typed OUTSIDE the numbered list is not. His file as it was`);
    console.log(`    a moment ago (${liveParas} paragraphs) is kept at ${live}, and OneDrive keeps its own versions.`);
    console.log(`\nRebuilt ${out}. To put it back over his file (the step he approves on Telegram):`);
    console.log(`  node tools/files.mjs put ${JSON.stringify(out)} ${JSON.stringify(cfg.onedrivePath)}`);
    return 0;
  }

  console.log('usage: items [docx] | batches | build [--out <docx>] | rebuild [--live <docx>] | verify <before> <after> [--allow <part>] [--batches] | stage "<text>" | amend <id> "<text>"');
  return 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try { process.exit(cli(process.argv.slice(2))); }
  catch (e) { console.error(String(e.message || e)); process.exit(1); }
}
