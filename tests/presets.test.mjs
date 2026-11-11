import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES, PRESETS } from '../web/js/presets.js';

function preset(id) {
  const p = PRESETS.find((x) => x.id === id);
  assert.ok(p, `缺少预设条目 ${id}`);
  return p;
}

test('至少 30 条，六类齐全', () => {
  assert.ok(PRESETS.length >= 30, `只有 ${PRESETS.length} 条`);
  const ids = new Set(CATEGORIES.map((c) => c.id));
  assert.deepEqual([...ids].sort(), ['code', 'date', 'file', 'form', 'network', 'number']);
});

test('id 无重复且 kebab-case；category 都在 CATEGORIES 中', () => {
  const seen = new Set();
  for (const p of PRESETS) {
    assert.ok(!seen.has(p.id), `重复 id: ${p.id}`);
    assert.match(p.id, /^[a-z0-9]+(-[a-z0-9]+)*$/, `id 非 kebab-case: ${p.id}`);
    seen.add(p.id);
    assert.ok(CATEGORIES.some((c) => c.id === p.category), `${p.id} 的 category 非法`);
  }
});

test('每条可编译且 sample 非空', () => {
  for (const p of PRESETS) {
    assert.doesNotThrow(() => new RegExp(p.pattern, p.flags), `${p.id} 编译失败`);
    assert.equal(typeof p.sample, 'string');
    assert.ok(p.sample.length > 0, `${p.id} sample 为空`);
  }
});

test('email 行为', () => {
  const re = new RegExp(preset('email').pattern, preset('email').flags);
  assert.equal(re.test('a@b.co'), true);
  assert.equal(re.test('a@b'), false);
});

test('cn-mobile 行为', () => {
  const p = preset('cn-mobile');
  const re = new RegExp(p.pattern, p.flags);
  assert.equal(re.test('13800138000'), true);
  assert.equal(re.test('12345678901'), false);
});

test('ipv4 行为', () => {
  const re = new RegExp(preset('ipv4').pattern, preset('ipv4').flags);
  assert.equal(re.test('192.168.1.1'), true);
});

test('uuid 行为', () => {
  const re = new RegExp(preset('uuid').pattern, preset('uuid').flags);
  assert.equal(re.test('550e8400-e29b-41d4-a716-446655440000'), true);
});

test('date-iso 行为', () => {
  const re = new RegExp(preset('date-iso').pattern, preset('date-iso').flags);
  assert.equal(re.test('2026-11-12'), true);
});

test('误判注记：身份证与手机号必带 note', () => {
  for (const id of ['idcard-18', 'idcard-15', 'cn-mobile', 'intl-mobile', 'ipv4']) {
    const p = preset(id);
    assert.ok(p.note && p.note.zh && p.note.en, `${id} 缺少误判注记`);
  }
});

test('双语字段完整', () => {
  for (const p of PRESETS) {
    assert.ok(p.name && p.name.zh && p.name.en, `${p.id} 缺双语名称`);
  }
  for (const c of CATEGORIES) {
    assert.ok(c.name && c.name.zh && c.name.en, `分类 ${c.id} 缺双语名称`);
  }
});
