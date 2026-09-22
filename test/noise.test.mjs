// The OneDrive rule, as a test: the alert that went into the brief twice must be filtered,
// and the same alert addressed to Tariq himself must not be.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadNoise, noiseReason } from '../tools/lib/noise.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rules = loadNoise(ROOT);

test('config/noise.json loads and has the OneDrive rule', () => {
  assert.ok(rules.length >= 1);
  assert.ok(rules.some((r) => r.from === 'sharepointonline.com' && r.notTo));
});

test('the OneDrive storage alert addressed to the dormant account is filtered', () => {
  const row = { from: 'no-reply@sharepointonline.com', subject: 'Your OneDrive is out of storage space', to: ['dan@tfaconstructions.com.au'] };
  assert.match(noiseReason(row, rules) || '', /OneDrive storage alert/);
});

test('the same alert addressed to Tariq himself is NOT filtered', () => {
  const row = { from: 'no-reply@sharepointonline.com', subject: 'Your OneDrive is out of storage space', to: ['tariq@tfaconstructions.com.au'] };
  assert.equal(noiseReason(row, rules), null);
});

test('a notTo rule cannot fire when the To: line is unknown', () => {
  const row = { from: 'no-reply@sharepointonline.com', subject: 'Your OneDrive is out of storage space', to: [] };
  assert.equal(noiseReason(row, rules), null);
});

test('a real email from a person is never filtered', () => {
  const row = { from: 'heather@tfaconstructions.com.au', subject: 'ABA for payment today', to: ['tariq@tfaconstructions.com.au'] };
  assert.equal(noiseReason(row, rules), null);
});

test('a rule with neither from nor subject never matches', () => {
  const row = { from: 'anyone@example.com', subject: 'anything', to: ['someone@else.com'] };
  assert.equal(noiseReason(row, [{ notTo: 'tariq@tfaconstructions.com.au', why: 'bad rule' }]), null);
});
