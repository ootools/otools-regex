import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../web/js/store.js';

function fakeStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

test('loadState: 空存储返回全默认值', () => {
  const s = createStore({ storage: fakeStorage() });
  assert.deepEqual(s.loadState(), {
    pattern: '',
    flags: 'g',
    text: '',
    batchText: '',
    replacement: '',
    skipEmpty: true,
    tab: 'tester',
    history: [],
  });
});

test('saveState: 浅合并持久化，新实例同存储可读回', () => {
  const storage = fakeStorage();
  const s1 = createStore({ storage });
  s1.saveState({ pattern: 'a+', tab: 'batch' });
  const s2 = createStore({ storage });
  const st = s2.loadState();
  assert.equal(st.pattern, 'a+');
  assert.equal(st.tab, 'batch');
  assert.equal(st.flags, 'g'); // 未写的键保持默认
});

test('addHistory: 置顶 + 去重', () => {
  const s = createStore({ storage: fakeStorage() });
  assert.deepEqual(s.addHistory('a'), ['a']);
  assert.deepEqual(s.addHistory('a'), ['a']);
  assert.deepEqual(s.addHistory('b'), ['b', 'a']);
});

test('addHistory: 上限 20，最新在头', () => {
  const s = createStore({ storage: fakeStorage() });
  let last;
  for (let i = 1; i <= 21; i++) last = s.addHistory('p' + i);
  assert.equal(last.length, 20);
  assert.equal(last[0], 'p21');
  assert.equal(last[19], 'p2'); // p1 被挤出
});

test('addHistory: 空 pattern 不入', () => {
  const s = createStore({ storage: fakeStorage() });
  assert.deepEqual(s.addHistory(''), []);
});
