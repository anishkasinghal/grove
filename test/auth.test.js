const test = require('node:test');
const assert = require('node:assert/strict');
const { hashPassword, verifyPassword, createToken, verifyToken } = require('../server/auth');
const { getConfig, assertConfig } = require('../server/config');

test('password hashes verify without exposing the original password', async () => {
  const hash = await hashPassword('correct horse battery staple');
  assert.notEqual(hash, 'correct horse battery staple');
  assert.equal(await verifyPassword('correct horse battery staple', hash), true);
  assert.equal(await verifyPassword('wrong password', hash), false);
});

test('JWT tokens round-trip the user id', () => {
  const token = createToken({ id: 'user-1', email: 'user@example.com' }, 'test-secret');
  assert.equal(verifyToken(token, 'test-secret').sub, 'user-1');
});

test('configuration requires database and JWT settings', () => {
  assert.throws(() => assertConfig(getConfig({})), /DATABASE_URL, JWT_SECRET/);
  assert.doesNotThrow(() => assertConfig(getConfig({DATABASE_URL: 'postgres://db', JWT_SECRET: 'secret'})));
});
