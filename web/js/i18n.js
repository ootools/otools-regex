/**
 * i18n.js — 极简 i18n：点路径查找 + {name} 占位 + 缺 key 透传。
 * 界面 chrome 走 t()；预设/速查数据用内联双语对象 {zh, en}（数据与文案同文件更好维护）。
 */
import zhCN from './locales/zh-CN.js';
import enUS from './locales/en-US.js';

const LOCALES = { 'zh-CN': zhCN, 'en-US': enUS };
const FALLBACK = 'zh-CN';

export function createI18n(locale) {
  let current = normalize(locale);

  function normalize(loc) {
    const l = String(loc || '');
    if (l === 'en-US') return 'en-US';
    if (l === 'zh-CN' || l === 'zh' || l.startsWith('zh')) return 'zh-CN';
    return FALLBACK;
  }

  function lookup(dict, key) {
    let node = dict;
    for (const part of key.split('.')) {
      if (node == null || typeof node !== 'object') return undefined;
      node = node[part];
    }
    return typeof node === 'string' ? node : undefined;
  }

  function t(key, params) {
    const raw = lookup(LOCALES[current], key) ?? key;
    if (!params) return raw;
    return raw.replace(/\{(\w+)\}/g, (m, name) =>
      params[name] === undefined ? m : String(params[name])
    );
  }

  return {
    t,
    setLocale(loc) {
      current = normalize(loc);
    },
    get locale() {
      return current;
    },
  };
}
