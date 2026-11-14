const test = require('node:test');
const assert = require('node:assert/strict');
const { cloneDefaults } = require('../server/defaults');

test('default data contains the frontend collections', () => {
  const data = cloneDefaults();
  for (const key of ['tasks', 'habits', 'habitLogs', 'subjects', 'assignments', 'schedule', 'journalEntries', 'settings']) {
    assert.ok(Object.hasOwn(data, key), `missing ${key}`);
  }
});

test('default snapshots are independent', () => {
  const first = cloneDefaults();
  const second = cloneDefaults();
  first.tasks.push({id: 'task'});
  assert.equal(second.tasks.length, 0);
});
