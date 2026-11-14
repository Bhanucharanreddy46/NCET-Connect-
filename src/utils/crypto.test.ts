import test from 'node:test';
import assert from 'node:assert/strict';
import { decryptPayload, encryptPayload } from './crypto';

test('AES-GCM encryptPayload and decryptPayload round-trip cleanly', async () => {
  const secret = 'ncet-connect-thread-secret-2026';
  const message = 'Hi Priya, your Atlassian SDE interview is confirmed for Tuesday 11:00 AM.';
  const encrypted = await encryptPayload(message, secret);
  assert.equal(encrypted.algorithm, 'AES-GCM-256');
  assert.notEqual(encrypted.ciphertext, message);
  assert.ok(encrypted.iv.length > 0);

  const decrypted = await decryptPayload(encrypted.ciphertext, encrypted.iv, secret);
  assert.equal(decrypted, message);
});

test('decryptPayload rejects wrong key', async () => {
  const encrypted = await encryptPayload('Confidential Transcript GPA 9.34', 'correct-seed');
  await assert.rejects(() => decryptPayload(encrypted.ciphertext, encrypted.iv, 'wrong-seed'));
});
