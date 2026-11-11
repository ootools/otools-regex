import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createI18n } from '../web/js/i18n.js';
import zhCN from '../web/js/locales/zh-CN.js';
import enUS from '../web/js/locales/en-US.js';

function leafKeys(obj, prefix = '') {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') keys.push(...leafKeys(v, path));
    else keys.push(path);
  }
  return keys.sort();
}

test('zh-CN 点路径取值', () => {
  const i18n = createI18n('zh-CN');
  assert.equal(i18n.t('ui.tabs.tester'), '测试器');
});

test('setLocale 切换到 en-US', () => {
  const i18n = createI18n('zh-CN');
  i18n.setLocale('en-US');
  assert.equal(i18n.t('ui.tabs.tester'), 'Tester');
});

test('缺失 key 返回 key 本身', () => {
  const i18n = createI18n('zh-CN');
  assert.equal(i18n.t('ui.nonexistent.key'), 'ui.nonexistent.key');
});

test('未知 locale 回退 zh-CN', () => {
  const i18n = createI18n('fr');
  assert.equal(i18n.locale, 'zh-CN');
});

test('占位符替换', () => {
  const i18n = createI18n('zh-CN');
  const s = i18n.t('ui.batch.summary', { passed: 2, failed: 1, total: 3 });
  assert.ok(s.includes('2') && s.includes('1') && s.includes('3'));
});

test('zh-CN 与 en-US 叶子键集完全一致', () => {
  const zh = leafKeys(zhCN);
  const en = leafKeys(enUS);
  const missingInEn = zh.filter((k) => !en.includes(k));
  const missingInZh = en.filter((k) => !zh.includes(k));
  assert.deepEqual(
    { missingInEn, missingInZh },
    { missingInEn: [], missingInZh: [] },
    `键集不一致：en 缺 ${missingInEn.join(', ')}；zh 缺 ${missingInZh.join(', ')}`
  );
});
