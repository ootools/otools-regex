import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  compileRegex,
  matchAll,
  replacePreview,
  findReplaceIssues,
  batchValidate,
  describeError,
} from '../web/js/engine/core.js';

test('compileRegex: 合法 pattern + g flag', () => {
  const r = compileRegex('\\d+', 'g');
  assert.equal(r.ok, true);
  assert.equal(r.re.global, true);
});

test('compileRegex: 未闭合括号 → 中文错误', () => {
  const r = compileRegex('(', '');
  assert.equal(r.ok, false);
  assert.ok(r.message.includes('括号'));
});

test('compileRegex: 未知 flag 拒绝', () => {
  const r = compileRegex('a', 'gx');
  assert.equal(r.ok, false);
});

test('compileRegex: 重复 flag 拒绝', () => {
  const r = compileRegex('a', 'gg');
  assert.equal(r.ok, false);
});

test('compileRegex: 重名命名组拒绝', () => {
  const r = compileRegex('(?<a>x)(?<a>y)', '');
  assert.equal(r.ok, false);
});

test('matchAll: 基础多匹配', () => {
  const r = matchAll('\\w+', 'g', 'ab cd');
  assert.equal(r.matches[0].index, 0);
  assert.equal(r.matches[0].text, 'ab');
  assert.equal(r.matches[1].index, 3);
  assert.equal(r.total, 2);
  assert.equal(r.truncated, false);
});

test('matchAll: limit 截断但 total 跑满', () => {
  const r = matchAll('\\w+', 'g', 'ab cd', { limit: 1 });
  assert.equal(r.matches.length, 1);
  assert.equal(r.total, 2);
  assert.equal(r.truncated, true);
});

test('matchAll: 编号组 + 命名组', () => {
  const r = matchAll('(\\d+)-(?<unit>[a-z]+)', 'g', '12-ab 34-cd');
  assert.deepEqual(r.matches[0].groups, [{ number: 1, value: '12', start: null, end: null }]);
  assert.deepEqual(r.matches[0].named, [{ name: 'unit', value: 'ab', start: null, end: null }]);
});

test('matchAll: 未参与匹配的组为 null', () => {
  const r = matchAll('(x)?y', 'g', 'y');
  assert.equal(r.matches[0].groups[0].value, null);
});

test('matchAll: d flag 提供起止索引', () => {
  const r = matchAll('\\w', 'gd', 'ab');
  assert.equal(r.matches[0].start, 0);
  assert.equal(r.matches[0].end, 1);
});

test('matchAll: 无 d 时索引为 null', () => {
  const r = matchAll('\\w', 'g', 'ab');
  assert.equal(r.matches[0].start, null);
});

test('matchAll: 无 g 仅首个匹配', () => {
  const r = matchAll('\\d', '', 'ab1cd2');
  assert.equal(r.matches.length, 1);
  assert.equal(r.total, 1);
  assert.equal(r.matches[0].text, '1');
});

test('matchAll: 空 pattern 零宽匹配', () => {
  const r = matchAll('', 'g', 'ab');
  assert.equal(r.total, 3);
  for (const m of r.matches) assert.equal(m.text, '');
});

test('replacePreview: g 替换全部', () => {
  assert.deepEqual(replacePreview('o', 'g', 'foo', '0'), { result: 'f00', count: 2 });
});

test('replacePreview: 无 g 仅第一处', () => {
  assert.deepEqual(replacePreview('o', '', 'foo', '0'), { result: 'f0o', count: 1 });
});

test('replacePreview: 无匹配 count 0', () => {
  assert.deepEqual(replacePreview('x', '', 'foo', '0'), { result: 'foo', count: 0 });
});

test('replacePreview: 原生 $ 语义', () => {
  assert.deepEqual(replacePreview('(a)(b)', 'g', 'ab', '$2$1'), { result: 'ba', count: 1 });
});

test('findReplaceIssues: 命名组拼错', () => {
  assert.deepEqual(findReplaceIssues('(?<year>\\d{4})', '', '$<moth>'), [
    { type: 'name', ref: 'moth' },
  ]);
});

test('findReplaceIssues: 组号越界', () => {
  assert.deepEqual(findReplaceIssues('(a)', '', '$5'), [{ type: 'index', ref: '5' }]);
});

test('findReplaceIssues: 合法引用为空', () => {
  assert.deepEqual(findReplaceIssues('(?<y>\\d)', '', '$<y> ok'), []);
});

test('batchValidate: 默认跳过空行', () => {
  const r = batchValidate('^\\d+$', 'g', '123\nabc\n\n456');
  assert.deepEqual(
    r.rows.map((x) => ({ no: x.no, ok: x.ok })),
    [{ no: 1, ok: true }, { no: 2, ok: false }, { no: 4, ok: true }]
  );
  assert.equal(r.rows[0].text, '123');
  assert.equal(r.passed, 2);
  assert.equal(r.failed, 1);
  assert.equal(r.total, 3);
});

test('batchValidate: 不跳空行时空行算失败', () => {
  const r = batchValidate('^\\d+$', 'g', '123\nabc\n\n456', { skipEmpty: false });
  assert.equal(r.rows.length, 4);
  assert.equal(r.failed, 2);
});

test('batchValidate: limit 截断但 total 跑满', () => {
  const r = batchValidate('^\\d+$', 'g', '1\n2\n3\n4', { limit: 2 });
  assert.equal(r.truncated, true);
  assert.equal(r.total, 4);
});

test('batchValidate: 空文本', () => {
  const r = batchValidate('^\\d+$', 'g', '');
  assert.equal(r.rows.length, 0);
  assert.equal(r.passed, 0);
  assert.equal(r.failed, 0);
  assert.equal(r.total, 0);
});

test('describeError: 括号未闭合映射', () => {
  assert.ok(describeError(new SyntaxError('Unterminated group')).includes('括号'));
});

test('describeError: 量词无对象映射', () => {
  assert.ok(describeError(new SyntaxError('Nothing to repeat')).includes('量词'));
});

test('describeError: 命名组重名映射', () => {
  assert.ok(describeError(new SyntaxError('Duplicate capture group name')).includes('重名'));
});

test('describeError: 未映射透传原文', () => {
  assert.equal(describeError(new SyntaxError('weird thing')), 'weird thing');
});
