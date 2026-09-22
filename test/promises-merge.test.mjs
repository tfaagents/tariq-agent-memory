// The promise list must not lose an open promise just because it fell out of the scan window
// or the model did not return it this time (wall r-20260917-01).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeOpen, expired } from '../tools/lib/promises-merge.mjs';

const fp = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').slice(0, 8).join(' ');
const NOW = Date.parse('2026-09-20T12:00:00+10:00');
const day = (n) => new Date(NOW - n * 864e5).toISOString();
const P = (id, promise, extra = {}) => ({ id, promise, status: 'open', sentAt: day(3), due: null, ...extra });

test('a promise older than the window is carried across, once per save', () => {
  const stamford = P('m1', 'circle back to Grant on Dan St with the QS report', { sentAt: day(16), due: '2026-09-30' });
  const fresh = [P('m2', 'send Heather the work experience form')];
  const { open, carried } = mergeOpen([stamford], fresh, { fingerprint: fp, now: NOW });
  assert.equal(carried, 1);
  assert.equal(open.length, 2);
  assert.equal(open[1].id, 'm1');
  assert.equal(open[1].carried, 1);
  const again = mergeOpen(open, fresh, { fingerprint: fp, now: NOW });
  assert.equal(again.open.filter((p) => p.id === 'm1').length, 1, 'never duplicated');
  assert.equal(again.open.find((p) => p.id === 'm1').carried, 2);
});

test('a promise the new scan returned again is taken from the new scan, not duplicated', () => {
  const prev = [P('m1', 'send the revised quote for Bardon Rd')];
  const fresh = [P('m1', 'Send the revised quote for Bardon Rd', { due: '2026-09-25' })];
  const { open, carried } = mergeOpen(prev, fresh, { fingerprint: fp, now: NOW });
  assert.equal(carried, 0);
  assert.equal(open.length, 1);
  assert.equal(open[0].due, '2026-09-25');
});

test('a promise closed with done is not carried', () => {
  const prev = [P('m1', 'ring the QS')];
  const { open, carried } = mergeOpen(prev, [], { fingerprint: fp, now: NOW, isClosed: (p) => p.id === 'm1' });
  assert.equal(carried, 0);
  assert.equal(open.length, 0);
});

test('a previous promise already marked done is not carried', () => {
  const prev = [{ ...P('m1', 'ring the QS'), status: 'done' }];
  assert.equal(mergeOpen(prev, [], { fingerprint: fp, now: NOW }).carried, 0);
});

test('expiry: 30 days past a due date, or 45 days from when he made it with no date', () => {
  assert.equal(expired({ due: '2026-08-01' }, NOW), true);
  assert.equal(expired({ due: '2026-09-01' }, NOW), false);
  assert.equal(expired({ due: null, sentAt: day(46) }, NOW), true);
  assert.equal(expired({ due: null, sentAt: day(44) }, NOW), false);
  assert.equal(expired({ due: null, sentAt: null }, NOW), false);
});

test('an expired open promise is dropped, a live one kept', () => {
  const prev = [P('old', 'leave it with me', { sentAt: day(50) }), P('live', 'come back to you', { sentAt: day(20) })];
  const { open, carried } = mergeOpen(prev, [], { fingerprint: fp, now: NOW });
  assert.equal(carried, 1);
  assert.equal(open[0].id, 'live');
});
