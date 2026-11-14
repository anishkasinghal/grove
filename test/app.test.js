const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../server/app');

const pool = {
  query: async () => ({rows: []}),
  connect: async () => ({query: async () => {}, release: () => {}})
};

test('health endpoint is available without an account', async () => {
  const response = await request(createApp({
    pool,
    config: {jwtSecret: 'test-secret', googleClientId: '', googleClientSecret: ''}
  })).get('/api/health');
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, {ok: true});
});

test('health endpoint allows a local frontend origin', async () => {
  const response = await request(createApp({
    pool,
    config: {jwtSecret: 'test-secret', googleClientId: '', googleClientSecret: ''}
  })).get('/api/health').set('Origin', 'http://localhost:5500');
  assert.equal(response.status, 200);
  assert.equal(response.headers['access-control-allow-origin'], 'http://localhost:5500');
});

test('the backend serves the frontend entry point', async () => {
  const response = await request(createApp({
    pool,
    config: {jwtSecret: 'test-secret', googleClientId: '', googleClientSecret: ''}
  })).get('/index.html');
  assert.equal(response.status, 200);
  assert.match(response.text, /Grove — Student OS/);
});

test('data endpoints require authentication', async () => {
  const response = await request(createApp({
    pool,
    config: {jwtSecret: 'test-secret', googleClientId: '', googleClientSecret: ''}
  })).get('/api/data');
  assert.equal(response.status, 401);
});
