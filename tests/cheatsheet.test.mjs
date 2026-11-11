import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHEATSHEET } from '../web/js/cheatsheet.js';

const allItems = CHEATSHEET.flatMap((g) => g.items);

test('总条目 ≥ 60，8 个分组', () => {
  assert.ok(allItems.length >= 60, `只有 ${allItems.length} 条`);
  assert.ok(CHEATSHEET.length >= 8, `只有 ${CHEATSHEET.length} 组`);
});

test('分组 id 唯一、条目 syntax 非空', () => {
  const ids = new Set();
  for (const g of CHEATSHEET) {
    assert.ok(!ids.has(g.id), `重复分组 id: ${g.id}`);
    ids.add(g.id);
    assert.ok(g.title && g.title.zh && g.title.en, `${g.id} 缺双语标题`);
    for (const it of g.items) {
      assert.equal(typeof it.syntax, 'string');
      assert.ok(it.syntax.length > 0, `${g.id} 有空 syntax 条目`);
      assert.ok(it.desc && it.desc.zh && it.desc.en, `${g.id}/${it.syntax} 缺双语说明`);
    }
  }
});

test('Unicode 属性组含 \\p{Script=Han} 且注明需要 u', () => {
  const hit = allItems.find((it) => it.syntax === '\\p{Script=Han}');
  assert.ok(hit, '缺 \\p{Script=Han} 条目');
  const note = JSON.stringify(hit.note || hit.desc);
  assert.ok(note.includes('u'), '\\p{Script=Han} 条目未注明需要 u 标志');
});

test('断言组含后顾 lookbehind 且注明 JS 可用', () => {
  const hit = allItems.find((it) => (it.syntax || '').includes('(?<='));
  assert.ok(hit, '缺 (?<= 条目');
  const note = JSON.stringify(hit.note || hit.desc);
  assert.ok(note.includes('JS'), 'lookbehind 条目未注明 JS 可用性');
});
