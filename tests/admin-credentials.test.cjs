const assert = require('node:assert/strict');
const { test } = require('node:test');
const { scryptSync } = require('node:crypto');
const loadTs = require('./load-ts.cjs');
const { verifyCredentials, credentialVersion, createLoginLimiter } = loadTs('lib/admin-credentials.ts');
const salt = 'a'.repeat(32);
const password = 'test-only-password-123!';
const hash = scryptSync(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString('hex');
const env = { ADMIN_USERNAME: 'writer', ADMIN_PASSWORD_HASH: `scrypt:${salt}:${hash}` };

test('only matching username and password authenticate; malformed input fails closed', async () => {
  assert.equal(await verifyCredentials({ username: 'writer', password }, env), true);
  for (const input of [undefined, {}, { username: 'wrong', password }, { username: 'writer', password: 'wrong' }, { username: 'writer', password: {} }, { username: 'writer', password: 'x'.repeat(1025) }])
    assert.equal(await verifyCredentials(input, env), false);
  assert.equal(await verifyCredentials({ username: 'writer', password }, {}), false);
  assert.equal(await verifyCredentials({ username: 'writer', password }, { ...env, ADMIN_PASSWORD_HASH: 'malformed' }), false);
});

test('changing either admin credential invalidates the previous session version', () => {
  assert.notEqual(credentialVersion(env), credentialVersion({ ...env, ADMIN_USERNAME: 'other' }));
  assert.notEqual(credentialVersion(env), credentialVersion({ ...env, ADMIN_PASSWORD_HASH: 'new-hash' }));
  assert.equal(credentialVersion(env), credentialVersion({ ...env }));
});

test('attempts are reserved before verification and recover after a minute', () => {
  const take = createLoginLimiter();
  for (let i = 0; i < 5; i++) assert.equal(take(1000), true);
  assert.equal(take(1000), false);
  assert.equal(take(60999), false);
  assert.equal(take(61000), true);
});
