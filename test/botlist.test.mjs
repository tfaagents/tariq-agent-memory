// The "loses two sentences" guarantee, as tests.
//
// Tariq will not let a bot near his list unless it demonstrably keeps his words. These
// tests are that demonstration. The ones that matter most are the tamper tests: they make
// a change of exactly the kind a helpful model makes on its own, a corrected typo, a
// tidied merge, a reorder, and assert the checker refuses it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  openDocx, newDocx, partText, setPart, saveDocx, paragraphs, numIdOf,
} from '../tools/lib/docx.mjs';
import {
  readItems, verify, buildDocument, appendItems, reconcile, amendItem, verifyAmend,
  loadConfig, idFor, ROOT,
} from '../tools/botlist.mjs';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'botlist-test-'));
const at = (n) => path.join(tmp, n);
const cfg = loadConfig();
const FROZEN = path.resolve(path.dirname(path.join(ROOT, 'config/x')), cfg.frozenSource);
const haveFrozen = fs.existsSync(FROZEN);

// ---- a small document of our own, so the suite stands up with no client folder ----

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`;
const RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
const NUMBERING = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum><w:abstractNum w:abstractNumId="1"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="1"/></w:num><w:num w:numId="2"><w:abstractNumId w:val="0"/></w:num></w:numbering>`;
const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/></w:style></w:styles>`;

const LIST_A = ['first thing', 'second thing with a calander typo', 'third thing'];
const LIST_B = ['fourth thing', 'fifth thing'];

function miniDoc() {
  const item = (t, numId) => `<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="${numId}"/></w:numPr></w:pPr><w:r><w:t xml:space="preserve">${t}</w:t></w:r></w:p>`;
  const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>My list</w:t></w:r></w:p><w:p/>${LIST_A.map((t) => item(t, 1)).join('')}<w:p><w:r><w:t xml:space="preserve">a heading line - </w:t></w:r></w:p>${LIST_B.map((t) => item(t, 2)).join('')}${item('', 2)}<w:sectPr/></w:body></w:document>`;
  return newDocx({
    '[Content_Types].xml': CONTENT_TYPES,
    '_rels/.rels': RELS,
    'word/document.xml': doc,
    'word/numbering.xml': NUMBERING,
    'word/styles.xml': STYLES,
  });
}

const MINI_CFG = {
  idPrefix: 'B',
  subtitle: 'sub',
  howToRead: ['how'],
  crossRefNote: 'note',
  crossRefs: [{ id: 'B01', his: 'above', resolved: ['B02'] }],
  batches: [
    { title: 'Batch 1', what: 'w', needs: 'n', ids: ['B01', 'B02'] },
    { title: 'Batch 2', what: 'w', needs: 'n', ids: ['B03', 'B04', 'B05'] },
  ],
  chatgpt: {
    label: 'Section 3', intro: ['i'], objective: 'o',
    agents: [{ title: '1. A', body: 'b' }], systemWideTitle: 'S', systemWide: ['s'],
  },
};

/** Save a package to a file and reopen it, the way every real caller does. */
function roundTrip(pkg, name) {
  saveDocx(pkg, at(name));
  return openDocx(at(name));
}

/**
 * Rewrite the one paragraph whose text is exactly `text`, and nothing else.
 *
 * Targeting the paragraph rather than doing a string replace over the whole part matters:
 * once the batched view and the cross-reference notes exist, his words appear in several
 * places in document.xml, and a naive replace hits the wrong one. That is the same class
 * of mistake the paragraph-level check below is built to catch.
 */
function tamperParagraph(file, out, text, rewrite) {
  const pkg = openDocx(file);
  let xml = partText(pkg, 'word/document.xml');
  const ps = paragraphs(xml);
  const p = ps.find((q) => q.text === text);
  assert.ok(p, `no paragraph reads exactly ${JSON.stringify(text)}`);
  xml = xml.slice(0, p.start) + rewrite(p.xml) + xml.slice(p.end);
  setPart(pkg, 'word/document.xml', xml);
  saveDocx(pkg, out);
  return out;
}

// ---- the zip layer ----

test('a package with no changes writes back byte for byte', () => {
  const src = at('mini.docx');
  saveDocx(miniDoc(), src);
  saveDocx(openDocx(src), at('mini-again.docx'));
  assert.equal(Buffer.compare(fs.readFileSync(src), fs.readFileSync(at('mini-again.docx'))), 0);
});

test('his own file writes back byte for byte', { skip: !haveFrozen && 'no frozen copy of his list here' }, () => {
  saveDocx(openDocx(FROZEN), at('frozen-again.docx'));
  assert.equal(Buffer.compare(fs.readFileSync(FROZEN), fs.readFileSync(at('frozen-again.docx'))), 0);
});

test('a changed part is the only part that changes', () => {
  const pkg = miniDoc();
  const before = { ...Object.fromEntries(pkg.order.map((n) => [n, partText(pkg, n)])) };
  setPart(pkg, 'word/document.xml', partText(pkg, 'word/document.xml').replace('My list', 'My list!'));
  const after = roundTrip(pkg, 'changed.docx');
  for (const n of pkg.order) {
    if (n === 'word/document.xml') assert.notEqual(partText(after, n), before[n]);
    else assert.equal(partText(after, n), before[n]);
  }
});

// ---- reading his items ----

test('an item is a non-empty paragraph in a numbered list, and nothing else', () => {
  const items = readItems(roundTrip(miniDoc(), 'read.docx'));
  assert.deepEqual(items.map((i) => i.id), ['B01', 'B02', 'B03', 'B04', 'B05']);
  assert.deepEqual(items.map((i) => i.text), [...LIST_A, ...LIST_B]);
});

test('ids are zero padded and stable', () => {
  assert.equal(idFor(1), 'B01');
  assert.equal(idFor(9), 'B09');
  assert.equal(idFor(43), 'B43');
});

test('his list reads as 43 items, first and last exactly as he typed them', { skip: !haveFrozen && 'no frozen copy of his list here' }, () => {
  const items = readItems(openDocx(FROZEN), cfg.idPrefix);
  assert.equal(items.length, 43);
  assert.equal(items[0].id, 'B01');
  assert.equal(items[42].id, 'B43');
  assert.equal(items[0].text, 'Save files in right spot, save and load notes or reminders');
  assert.equal(items[42].text, 'Create an agent to actually do our own estimating');
  // The unnumbered line between his two lists is a heading, not an item.
  assert.ok(!items.some((i) => i.text.startsWith('CreateAgent for doing random shit')));
});

// ---- the build, and the check that guards it ----

test('the built document keeps every paragraph and carries every item once', () => {
  const src = at('build-src.docx');
  saveDocx(miniDoc(), src);
  const pkg = openDocx(src);
  const { items } = buildDocument(pkg, MINI_CFG);
  saveDocx(pkg, at('build-out.docx'));
  const res = verify(openDocx(src), openDocx(at('build-out.docx')), {
    allowParts: ['word/numbering.xml'], items, config: MINI_CFG,
  });
  assert.ok(res.ok, res.lines.join('\n'));
  assert.ok(res.added.length > 0);
});

test('the build renumbers each list so Word prints the permanent id', () => {
  const pkg = miniDoc();
  buildDocument(pkg, MINI_CFG);
  const num = partText(pkg, 'word/numbering.xml');
  assert.match(num, /<w:lvlText w:val="B%1\."\/>/);
  assert.match(num, /<w:numFmt w:val="decimalZero"\/>/);
  // The second list starts where its first item's id says it does, not at 1.
  assert.match(num, /<w:start w:val="4"\/>/);
});

test('his blank numbered lines stay in the list, because that is where he types the next one', () => {
  // They render as the next id with nothing after them. He types there, it becomes an item,
  // and the number Word prints and the id this tool gives out are the same thing.
  const before = paragraphs(partText(miniDoc(), 'word/document.xml'))
    .filter((p) => !p.text.trim() && numIdOf(p.xml)).length;
  assert.ok(before > 0, 'the fixture needs a blank numbered line');
  const pkg = miniDoc();
  buildDocument(pkg, MINI_CFG);
  const after = paragraphs(partText(pkg, 'word/document.xml'))
    .filter((p) => !p.text.trim() && numIdOf(p.xml)).length;
  assert.equal(after, before);
});

// ---- rebuilding the one file without duplicating what we inserted ----

// The shipped config has a catch-all, so the rebuild tests use one too: an item he typed
// himself belongs to no batch yet, and it has to land somewhere visible.
const REBUILD_CFG = { ...MINI_CFG, catchAll: { title: 'Batch 14. Added since', what: 'w', needs: 'n' } };

/** His file as it stands after a build, plus something he typed into it himself. */
function liveAfterTyping(base, typed) {
  const pkg = openDocx(base);
  buildDocument(pkg, REBUILD_CFG);
  if (typed) appendItems(pkg, [typed]);
  return pkg;
}

test('a rebuild regenerates sections 2 and 3 instead of adding a second copy', () => {
  const base = at('rb-base.docx');
  saveDocx(miniDoc(), base);
  const live = roundTrip(liveAfterTyping(base, 'something he typed himself'), 'rb-live.docx');
  const pkg = openDocx(base);
  const moved = reconcile(pkg, readItems(live));
  const { items } = buildDocument(pkg, REBUILD_CFG);
  saveDocx(pkg, at('rb-out.docx'));

  const texts = paragraphs(partText(openDocx(at('rb-out.docx')), 'word/document.xml')).map((p) => p.text);
  assert.equal(texts.filter((t) => t.startsWith('Section 2')).length, 1, 'sections must not be duplicated');
  assert.equal(texts.filter((t) => t === 'Section 3').length, 1);
  assert.deepEqual(moved.added.map((a) => a.id), ['B06']);
  assert.equal(items.length, 6);
  assert.ok(texts.includes('something he typed himself'));
  const res = verify(openDocx(base), openDocx(at('rb-out.docx')), {
    allowParts: ['word/numbering.xml'], items, config: REBUILD_CFG,
  });
  assert.ok(res.ok, res.lines.join('\n'));
  assert.ok(texts.includes('B06  something he typed himself'), 'it must be parked in the batched view');
});

test('rebuilding twice over is stable', () => {
  const base = at('rb2-base.docx');
  saveDocx(miniDoc(), base);
  let live = roundTrip(liveAfterTyping(base, 'typed once'), 'rb2-live.docx');
  const out = [];
  for (const n of [1, 2]) {
    const pkg = openDocx(base);
    reconcile(pkg, readItems(live));
    buildDocument(pkg, REBUILD_CFG);
    live = roundTrip(pkg, `rb2-out${n}.docx`);
    out.push(paragraphs(partText(live, 'word/document.xml')).map((p) => p.text));
  }
  assert.deepEqual(out[0], out[1], 'a second rebuild must not change anything');
  assert.equal(out[1].filter((t) => t.startsWith('Section 2')).length, 1);
});

test('a rebuild keeps his wording when he reworded one of his own items', () => {
  const base = at('rb3-base.docx');
  saveDocx(miniDoc(), base);
  const pkg0 = openDocx(base);
  buildDocument(pkg0, REBUILD_CFG);
  saveDocx(pkg0, at('rb3-built.docx'));
  tamperParagraph(at('rb3-built.docx'), at('rb3-live.docx'), 'third thing',
    (x) => x.replace('third thing', 'third thing, and I mean the whole yard'));
  const pkg = openDocx(base);
  const moved = reconcile(pkg, readItems(openDocx(at('rb3-live.docx'))));
  buildDocument(pkg, REBUILD_CFG);
  assert.deepEqual(moved.reworded.map((r) => r.id), ['B03']);
  const texts = paragraphs(partText(pkg, 'word/document.xml')).map((p) => p.text);
  assert.ok(texts.includes('third thing, and I mean the whole yard'));
  assert.ok(!texts.includes('third thing'), 'the base wording must not come back');
});

test('a rebuild refuses rather than putting back an item he deleted', () => {
  const base = at('rb4-base.docx');
  saveDocx(miniDoc(), base);
  const short = readItems(openDocx(base)).slice(0, 3);
  assert.throws(() => reconcile(openDocx(base), short), /deleted since/);
});

test('his real list builds and passes its own check', { skip: !haveFrozen && 'no frozen copy of his list here' }, () => {
  const pkg = openDocx(FROZEN);
  const { items } = buildDocument(pkg, cfg);
  saveDocx(pkg, at('real-built.docx'));
  const res = verify(openDocx(FROZEN), openDocx(at('real-built.docx')), {
    allowParts: ['word/numbering.xml'], items, config: cfg,
  });
  assert.ok(res.ok, res.lines.join('\n'));
  assert.equal(items.length, 43);
});

test('the check is about content, not about compressed bytes', () => {
  // The mini runs Node 24 with zlib 1.3.2.1 and Jaiah's Mac runs Node 25 with zlib 1.2.12,
  // so the same document deflates to different bytes on each. The check compares parts
  // after decompression, otherwise a build on one machine would look like tampering to the
  // other.
  const src = at('zlib-src.docx');
  saveDocx(miniDoc(), src);
  const pkg = openDocx(src);
  setPart(pkg, 'word/document.xml', partText(pkg, 'word/document.xml'));   // recompress, same text
  saveDocx(pkg, at('zlib-out.docx'));
  const res = verify(openDocx(src), openDocx(at('zlib-out.docx')), {});
  assert.ok(res.ok, res.lines.join('\n'));
  assert.match(res.lines.join('\n'), /0 lost, 0 added, 0 rewritten/);
});

test('building the same source twice gives the same document', () => {
  const src = at('repro-src.docx');
  saveDocx(miniDoc(), src);
  const one = openDocx(src); buildDocument(one, MINI_CFG); saveDocx(one, at('repro-1.docx'));
  const two = openDocx(src); buildDocument(two, MINI_CFG); saveDocx(two, at('repro-2.docx'));
  const a = openDocx(at('repro-1.docx')), b = openDocx(at('repro-2.docx'));
  assert.deepEqual(a.order, b.order);
  for (const n of a.order) assert.equal(partText(a, n), partText(b, n), n);
});

// ---- the tamper tests: the reason this file exists ----

test('a single silently corrected typo in the built document fails the check', () => {
  const src = at('tamper-src.docx');
  saveDocx(miniDoc(), src);
  const pkg = openDocx(src);
  buildDocument(pkg, MINI_CFG);
  saveDocx(pkg, at('tamper-built.docx'));
  // The built document passes, as the build test above asserts. Now be helpful: fix his
  // typo in section 1, exactly the edit a model makes without being asked.
  tamperParagraph(at('tamper-built.docx'), at('tamper-fixed.docx'),
    'second thing with a calander typo',
    (x) => x.replace('calander', 'calendar'));
  const res = verify(openDocx(src), openDocx(at('tamper-fixed.docx')), { allowParts: ['word/numbering.xml'] });
  assert.equal(res.ok, false);
  assert.match(res.lines.join('\n'), /not present, verbatim, in order/);
  assert.match(res.lines.join('\n'), /calander/);
});

test('a corrected typo fails even when his words still appear elsewhere in the file', () => {
  // The batched view repeats every item. A checker that only asked "is this text anywhere
  // in the document" would be satisfied by the copy in section 2 and would pass this.
  const src = at('tamper2-src.docx');
  saveDocx(miniDoc(), src);
  const pkg = openDocx(src);
  buildDocument(pkg, MINI_CFG);
  saveDocx(pkg, at('tamper2-built.docx'));
  const after = partText(openDocx(at('tamper2-built.docx')), 'word/document.xml');
  assert.ok(after.split('second thing with a calander typo').length - 1 >= 2,
    'this test is only meaningful while his words appear more than once');
  tamperParagraph(at('tamper2-built.docx'), at('tamper2-out.docx'),
    'second thing with a calander typo',
    (x) => x.replace('second thing with a calander typo', 'Second thing with a calendar typo.'));
  const res = verify(openDocx(src), openDocx(at('tamper2-out.docx')), { allowParts: ['word/numbering.xml'] });
  assert.equal(res.ok, false);
});

test('a dropped item fails the check', () => {
  const src = at('drop-src.docx');
  saveDocx(miniDoc(), src);
  const pkg = openDocx(src);
  let xml = partText(pkg, 'word/document.xml');
  const ps = paragraphs(xml);
  const gone = ps.find((p) => p.text === 'third thing');
  xml = xml.slice(0, gone.start) + xml.slice(gone.end);
  setPart(pkg, 'word/document.xml', xml);
  saveDocx(pkg, at('drop-out.docx'));
  const res = verify(openDocx(src), openDocx(at('drop-out.docx')), {});
  assert.equal(res.ok, false);
  assert.match(res.lines.join('\n'), /third thing/);
});

test('two items swapped fails the check even though nothing is missing', () => {
  const src = at('swap-src.docx');
  saveDocx(miniDoc(), src);
  const pkg = openDocx(src);
  let xml = partText(pkg, 'word/document.xml');
  const ps = paragraphs(xml);
  const a = ps.find((p) => p.text === 'first thing');
  const b = ps.find((p) => p.text === 'third thing');
  xml = xml.slice(0, a.start) + b.xml + xml.slice(a.end, b.start) + a.xml + xml.slice(b.end);
  setPart(pkg, 'word/document.xml', xml);
  saveDocx(pkg, at('swap-out.docx'));
  const res = verify(openDocx(src), openDocx(at('swap-out.docx')), {});
  assert.equal(res.ok, false);
});

test('two items merged into one paragraph fails the check', () => {
  const src = at('merge-src.docx');
  saveDocx(miniDoc(), src);
  const pkg = openDocx(src);
  let xml = partText(pkg, 'word/document.xml');
  const ps = paragraphs(xml);
  const a = ps.find((p) => p.text === 'first thing');
  const b = ps.find((p) => p.text === 'second thing with a calander typo');
  const merged = a.xml.replace('first thing', 'first thing. second thing with a calander typo');
  xml = xml.slice(0, a.start) + merged + xml.slice(b.end);
  setPart(pkg, 'word/document.xml', xml);
  saveDocx(pkg, at('merge-out.docx'));
  const res = verify(openDocx(src), openDocx(at('merge-out.docx')), {});
  assert.equal(res.ok, false);
});

test('an insert in the middle is legal, because it is a subsequence test and not a prefix test', () => {
  const src = at('insert-src.docx');
  saveDocx(miniDoc(), src);
  const pkg = openDocx(src);
  let xml = partText(pkg, 'word/document.xml');
  const ps = paragraphs(xml);
  const mid = ps.find((p) => p.text === 'second thing with a calander typo');
  xml = xml.slice(0, mid.end) + '<w:p><w:r><w:t>a note we added</w:t></w:r></w:p>' + xml.slice(mid.end);
  setPart(pkg, 'word/document.xml', xml);
  saveDocx(pkg, at('insert-out.docx'));
  const res = verify(openDocx(src), openDocx(at('insert-out.docx')), {});
  assert.ok(res.ok, res.lines.join('\n'));
  assert.deepEqual(res.added, ['a note we added']);
});

test('rewriting anything but the declared parts fails the check', () => {
  const src = at('styles-src.docx');
  saveDocx(miniDoc(), src);
  const pkg = openDocx(src);
  setPart(pkg, 'word/styles.xml', partText(pkg, 'word/styles.xml').replace('heading 1', 'heading one'));
  saveDocx(pkg, at('styles-out.docx'));
  const res = verify(openDocx(src), openDocx(at('styles-out.docx')), {});
  assert.equal(res.ok, false);
  assert.match(res.lines.join('\n'), /not declared: word\/styles\.xml/);
});

test('a dropped part fails the check', () => {
  const src = at('part-src.docx');
  saveDocx(miniDoc(), src);
  const pkg = openDocx(src);
  pkg.order = pkg.order.filter((n) => n !== 'word/styles.xml');
  pkg.entries.delete('word/styles.xml');
  saveDocx(pkg, at('part-out.docx'));
  const res = verify(openDocx(src), openDocx(at('part-out.docx')), {});
  assert.equal(res.ok, false);
  assert.match(res.lines.join('\n'), /dropped from the file/);
});

// ---- the batched view has to account for every item ----

test('an item left out of every batch fails the check', () => {
  const src = at('cover-src.docx');
  saveDocx(miniDoc(), src);
  const short = { ...MINI_CFG, batches: [{ title: 'B1', ids: ['B01', 'B02'] }, { title: 'B2', ids: ['B03', 'B04'] }] };
  const pkg = openDocx(src);
  const { items } = buildDocument(pkg, short);
  saveDocx(pkg, at('cover-out.docx'));
  const res = verify(openDocx(src), openDocx(at('cover-out.docx')), {
    allowParts: ['word/numbering.xml'], items, config: short,
  });
  assert.equal(res.ok, false);
  assert.match(res.lines.join('\n'), /not in any batch: B05/);
});

test('an item listed in two batches fails the check', () => {
  const src = at('dupe-src.docx');
  saveDocx(miniDoc(), src);
  const twice = { ...MINI_CFG, batches: [{ title: 'B1', ids: ['B01', 'B02', 'B03'] }, { title: 'B2', ids: ['B03', 'B04', 'B05'] }] };
  const pkg = openDocx(src);
  const { items } = buildDocument(pkg, twice);
  saveDocx(pkg, at('dupe-out.docx'));
  const res = verify(openDocx(src), openDocx(at('dupe-out.docx')), {
    allowParts: ['word/numbering.xml'], items, config: twice,
  });
  assert.equal(res.ok, false);
  assert.match(res.lines.join('\n'), /more than one batch: B03/);
});

test('a batch naming an id he never wrote is refused at build time', () => {
  const bad = { ...MINI_CFG, batches: [{ title: 'B1', ids: ['B01', 'B99'] }] };
  assert.throws(() => buildDocument(miniDoc(), bad), /B99/);
});

test('the shipped batch list covers his real list exactly once', { skip: !haveFrozen && 'no frozen copy of his list here' }, () => {
  const items = readItems(openDocx(FROZEN), cfg.idPrefix);
  const listed = cfg.batches.flatMap((b) => b.ids);
  assert.deepEqual([...listed].sort(), items.map((i) => i.id).sort());
  assert.equal(new Set(listed).size, listed.length);
  for (const r of cfg.crossRefs) {
    assert.ok(items.some((i) => i.id === r.id), `crossRef ${r.id} is not one of his items`);
    for (const id of [...(r.resolved || []), ...(r.likely || []), ...(r.literal ? [r.literal] : [])]) {
      assert.ok(items.some((i) => i.id === id), `crossRef ${r.id} points at ${id}, which is not one of his items`);
    }
  }
});

test('an item added since the batches were drawn up is parked, not dropped', () => {
  const src = at('catch-src.docx');
  const pkg0 = miniDoc();
  appendItems(pkg0, ['something he thought of yesterday']);
  saveDocx(pkg0, src);
  const withCatch = { ...MINI_CFG, catchAll: { title: 'Batch 14. Added since', what: 'w', needs: 'n' } };
  const pkg = openDocx(src);
  const { items } = buildDocument(pkg, withCatch);
  saveDocx(pkg, at('catch-out.docx'));
  assert.equal(items.length, 6);
  assert.deepEqual(withCatch._catchAllIds, ['B06']);
  const res = verify(openDocx(src), openDocx(at('catch-out.docx')), {
    allowParts: ['word/numbering.xml'], items, config: withCatch,
  });
  assert.ok(res.ok, res.lines.join('\n'));
  const texts = paragraphs(partText(openDocx(at('catch-out.docx')), 'word/document.xml')).map((p) => p.text);
  assert.ok(texts.includes('Batch 14. Added since'));
  assert.ok(texts.includes('B06  something he thought of yesterday'));
});

test('the catch-all heading is left out when there is nothing in it', () => {
  const withCatch = { ...MINI_CFG, catchAll: { title: 'Batch 14. Added since', what: 'w', needs: 'n' } };
  const pkg = miniDoc();
  buildDocument(pkg, withCatch);
  const texts = paragraphs(partText(pkg, 'word/document.xml')).map((p) => p.text);
  assert.ok(!texts.includes('Batch 14. Added since'));
  assert.deepEqual(withCatch._catchAllIds, []);
});

test('a second build does not inherit the first build\'s parked ids', () => {
  const withCatch = { ...MINI_CFG, catchAll: { title: 'Batch 14. Added since', what: 'w', needs: 'n' } };
  const one = miniDoc();
  appendItems(one, ['extra']);
  buildDocument(one, withCatch);
  assert.deepEqual(withCatch._catchAllIds, ['B06']);
  buildDocument(miniDoc(), withCatch);
  assert.deepEqual(withCatch._catchAllIds, []);
});

// ---- changing one item, and only that one ----

test('changing an item rewrites that item and nothing else', () => {
  const src = at('am-src.docx');
  saveDocx(miniDoc(), src);
  const pkg = openDocx(src);
  const change = amendItem(pkg, 'B02', 'second thing, reworded by him');
  const out = roundTrip(pkg, 'am-out.docx');
  const res = verifyAmend(openDocx(src), out, change.expected);
  assert.ok(res.ok, res.lines.join('\n'));
  assert.equal(change.was, 'second thing with a calander typo');
  const items = readItems(out);
  assert.equal(items.length, 5, 'the item count must not move');
  assert.equal(items[1].id, 'B02');
  assert.equal(items[1].text, 'second thing, reworded by him');
  assert.deepEqual(items.map((i) => i.id), ['B01', 'B02', 'B03', 'B04', 'B05'], 'ids must not shift');
});

test('changing an item keeps its own formatting', () => {
  const src = at('am2-src.docx');
  saveDocx(miniDoc(), src);
  const before = paragraphs(partText(openDocx(src), 'word/document.xml')).find((p) => p.text === 'third thing');
  const pkg = openDocx(src);
  amendItem(pkg, 'B03', 'third thing, longer now');
  const after = paragraphs(partText(pkg, 'word/document.xml')).find((p) => p.text === 'third thing, longer now');
  assert.equal(
    before.xml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/)[0],
    after.xml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/)[0],
    'the paragraph properties, including its list membership, must be untouched',
  );
  assert.equal(numIdOf(after.xml), numIdOf(before.xml));
});

test('changing an item in a built document updates the batched line too', () => {
  const src = at('am3-src.docx');
  const pkg0 = miniDoc();
  buildDocument(pkg0, REBUILD_CFG);
  saveDocx(pkg0, src);
  const pkg = openDocx(src);
  const change = amendItem(pkg, 'B04', 'fourth thing, his new words');
  const out = roundTrip(pkg, 'am3-out.docx');
  const res = verifyAmend(openDocx(src), out, change.expected);
  assert.ok(res.ok, res.lines.join('\n'));
  const texts = paragraphs(partText(out, 'word/document.xml')).map((p) => p.text);
  assert.ok(texts.includes('fourth thing, his new words'), 'section 1');
  assert.ok(texts.includes('B04  fourth thing, his new words'), 'the batched view must not keep the old wording');
  assert.ok(!texts.some((t) => t.includes('fourth thing') && t !== 'fourth thing, his new words' && t !== 'B04  fourth thing, his new words'));
});

test('a change must not be a way to smuggle in a second edit', () => {
  const src = at('am4-src.docx');
  saveDocx(miniDoc(), src);
  const pkg = openDocx(src);
  const change = amendItem(pkg, 'B02', 'second thing, reworded');
  // Helpful on the way past: fix the unrelated item's typo too.
  setPart(pkg, 'word/document.xml',
    partText(pkg, 'word/document.xml').replace('first thing', 'First thing'));
  const res = verifyAmend(openDocx(src), roundTrip(pkg, 'am4-out.docx'), change.expected);
  assert.equal(res.ok, false);
  assert.match(res.lines.join('\n'), /do not match what the change said it would write/);
});

test('a change that adds or drops a paragraph fails', () => {
  const src = at('am5-src.docx');
  saveDocx(miniDoc(), src);
  const pkg = openDocx(src);
  const change = amendItem(pkg, 'B02', 'second thing, reworded');
  setPart(pkg, 'word/document.xml',
    partText(pkg, 'word/document.xml').replace('<w:sectPr/>', '<w:p><w:r><w:t>sneaked in</w:t></w:r></w:p><w:sectPr/>'));
  const res = verifyAmend(openDocx(src), roundTrip(pkg, 'am5-out.docx'), change.expected);
  assert.equal(res.ok, false);
  assert.match(res.lines.join('\n'), /must not add or remove any/);
});

test('changing refuses an id he never wrote, a blank, and a no-op', () => {
  assert.throws(() => amendItem(miniDoc(), 'B99', 'anything'), /no B99/);
  assert.throws(() => amendItem(miniDoc(), 'B02', '   '), /Emptying an item is removing it/);
  assert.throws(() => amendItem(miniDoc(), 'B02', 'second thing with a calander typo'), /nothing to change/);
});

test('a rebuild after a change carries his new wording, not the base wording', () => {
  const base = at('am6-base.docx');
  saveDocx(miniDoc(), base);
  const pkg0 = openDocx(base);
  buildDocument(pkg0, REBUILD_CFG);
  const live0 = roundTrip(pkg0, 'am6-built.docx');
  const pkg1 = openDocx(at('am6-built.docx'));
  amendItem(pkg1, 'B05', 'fifth thing, as he says it now');
  const live = roundTrip(pkg1, 'am6-live.docx');
  const pkg = openDocx(base);
  const moved = reconcile(pkg, readItems(live));
  buildDocument(pkg, REBUILD_CFG);
  assert.deepEqual(moved.reworded.map((r) => r.id), ['B05']);
  const texts = paragraphs(partText(pkg, 'word/document.xml')).map((p) => p.text);
  assert.ok(texts.includes('fifth thing, as he says it now'));
  assert.ok(!texts.includes('fifth thing'));
  assert.ok(live0);
});

// ---- adding an item ----

test('adding an item gives it the next id and changes nothing else', () => {
  const src = at('add-src.docx');
  saveDocx(miniDoc(), src);
  const pkg = openDocx(src);
  const added = appendItems(pkg, ['a brand new thing he said on the phone']);
  saveDocx(pkg, at('add-out.docx'));
  assert.deepEqual(added, [{ id: 'B06', text: 'a brand new thing he said on the phone' }]);
  const res = verify(openDocx(src), openDocx(at('add-out.docx')), { allowParts: [] });
  assert.ok(res.ok, res.lines.join('\n'));
  const items = readItems(openDocx(at('add-out.docx')));
  assert.equal(items.length, 6);
  assert.equal(items[5].id, 'B06');
  assert.equal(items[5].text, 'a brand new thing he said on the phone');
});

test('an added item lands at the end of his list, not after his blank lines', () => {
  const pkg = miniDoc();
  appendItems(pkg, ['tail item']);
  const ps = paragraphs(partText(pkg, 'word/document.xml'));
  const i = ps.findIndex((p) => p.text === 'tail item');
  assert.equal(ps[i - 1].text, 'fifth thing');
  assert.equal(ps[i + 1].text, '');
});

test('text with XML characters in it survives being added', () => {
  const pkg = miniDoc();
  const nasty = 'quotes & <angles> and a "quote" plus an apostrophe’s curl';
  appendItems(pkg, [nasty]);
  const items = readItems(roundTrip(pkg, 'nasty.docx'));
  assert.equal(items[items.length - 1].text, nasty);
});

test('adding to a document that has already been built still appends to section 1', () => {
  const src = at('twice-src.docx');
  saveDocx(miniDoc(), src);
  const built = openDocx(src);
  buildDocument(built, MINI_CFG);
  saveDocx(built, at('twice-built.docx'));
  const pkg = openDocx(at('twice-built.docx'));
  const added = appendItems(pkg, ['later thought']);
  assert.deepEqual(added.map((a) => a.id), ['B06']);
  const ps = paragraphs(partText(pkg, 'word/document.xml'));
  const i = ps.findIndex((p) => p.text === 'later thought');
  const sectionTwo = ps.findIndex((p) => p.text.startsWith('Section 2'));
  assert.ok(i < sectionTwo, 'the new item must sit in section 1, above the batched view');
  const res = verify(openDocx(at('twice-built.docx')), roundTrip(pkg, 'twice-out.docx'), { allowParts: [] });
  assert.ok(res.ok, res.lines.join('\n'));
});
