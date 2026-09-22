// The attachment rules as tests: what gets picked, what the file is called, where it may
// land, and what is refused before a byte is fetched.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pick, safeName, uniquePath, withinWork, blocker, describe, kindLabel, kb, SIZE_CAP } from '../tools/lib/attachments.mjs';

const pdf = { id: 'a1', name: 'TFA Constructions - Current Company Extract.pdf', contentType: 'application/pdf', size: 146_000, isInline: false, type: 'file' };
const logo = { id: 'a2', name: 'image001.png', contentType: 'image/png', size: 9_000, isInline: true, type: 'file' };
const xlsx = { id: 'a3', name: 'Flow Tracker.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 40_000, isInline: false, type: 'file' };
const link = { id: 'a4', name: 'Tender.docx', contentType: null, size: 0, isInline: false, type: 'reference' };
const list = [pdf, logo, xlsx];

test('default and "all" take every attachment that is not an inline image', () => {
  assert.deepEqual(pick(list).picked.map((a) => a.id), ['a1', 'a3']);
  assert.deepEqual(pick(list, 'all').picked.map((a) => a.id), ['a1', 'a3']);
});

test('a number picks by listing position, inline ones included', () => {
  assert.deepEqual(pick(list, '2').picked, [logo]);
  assert.deepEqual(pick(list, 3).picked, [xlsx]);
  assert.match(pick(list, '9').why, /has 3/);
});

test('a name picks exactly, then by unique part, and refuses an ambiguous part', () => {
  assert.deepEqual(pick(list, 'flow tracker.xlsx').picked, [xlsx]);
  assert.deepEqual(pick(list, 'extract').picked, [pdf]);
  assert.match(pick(list, 'nothing like it').why, /No attachment called/);
  const two = [pdf, { ...xlsx, name: 'Extract of tenders.xlsx' }];
  assert.match(pick(two, 'extract').why, /matches 2/);
  assert.equal(pick(two, 'extract').picked.length, 0);
});

test('an email with nothing, or only signature images, says so', () => {
  assert.match(pick([]).why, /No attachments/);
  assert.match(pick([logo]).why, /Only inline images/);
  assert.deepEqual(pick([logo], '1').picked, [logo]);
});

test('file names cannot escape the folder and are never empty', () => {
  assert.equal(safeName('../../tools/mail.mjs'), 'tools mail.mjs');
  assert.equal(safeName('..\\..\\x.pdf'), 'x.pdf');
  assert.equal(safeName('  '), 'attachment');
  assert.equal(safeName(null, 'attachment-2'), 'attachment-2');
  assert.equal(safeName('.hidden'), 'hidden');
  assert.equal(safeName('C:\\Users\\k\\Extract.pdf'), 'C Users k Extract.pdf');
  const long = safeName(`${'a'.repeat(200)}.pdf`);
  assert.ok(long.length <= 120 && long.endsWith('.pdf'));
});

test('a second file of the same name gets a number, the original is not overwritten', () => {
  const taken = new Set([path.join('/w', 'Extract.pdf'), path.join('/w', 'Extract (2).pdf')]);
  assert.equal(uniquePath('/w', 'Extract.pdf', (p) => taken.has(p)), path.join('/w', 'Extract (3).pdf'));
  assert.equal(uniquePath('/w', 'New.pdf', (p) => taken.has(p)), path.join('/w', 'New.pdf'));
});

test('downloads land under work/ and nowhere else', () => {
  const root = '/Users/x/tariq-agent';
  assert.equal(withinWork(root), path.join(root, 'work/inbox'));
  assert.equal(withinWork(root, 'work/tenders'), path.join(root, 'work/tenders'));
  assert.equal(withinWork(root, 'work'), path.join(root, 'work'));
  assert.equal(withinWork(root, 'tools'), null);
  assert.equal(withinWork(root, 'work/../tools'), null);
  assert.equal(withinWork(root, '/tmp'), null);
  assert.equal(withinWork(root, 'workspace'), null);
});

test('a OneDrive link and an oversized file are refused before any bytes move', () => {
  assert.match(blocker(link), /link to a file/);
  assert.match(blocker({ ...pdf, size: SIZE_CAP + 1 }), /too big to send on Telegram/);
  assert.equal(blocker(pdf), null);
});

test('sizes: bytes under a kilobyte are bytes, an empty file is not "1 KB"', () => {
  assert.equal(kb(0), '0 B');
  assert.equal(kb(500), '500 B');
  assert.equal(kb(9_000), '9 KB');
  assert.equal(kb(3 * 1024 * 1024), '3.0 MB');
});

test('the listing line says what kind of file it is and how big', () => {
  assert.equal(describe(pdf, 0), '1. TFA Constructions - Current Company Extract.pdf (PDF, 143 KB)');
  assert.match(describe(logo, 1), /^2\. image001\.png \(image, 9 KB, inline image/);
  assert.equal(kindLabel(xlsx), 'spreadsheet');
  assert.equal(kindLabel(link), 'link to a file in OneDrive or SharePoint');
  assert.equal(kindLabel({ name: 'x.dwg', contentType: 'application/octet-stream' }), 'DWG');
  assert.equal(kindLabel({ name: 'forwarded', type: 'item' }), 'attached email');
});
