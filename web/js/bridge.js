/**
 * bridge.js — 宿主桥的 ESM 薄封装。
 * 桥本体按模板约定内联在 index.html（verify-plugin 校验入口页含桥字符串），
 * 这里只做转发；window.otoolsPlugin 不存在（异常环境）时给安全默认值。
 */

const plugin = (typeof window !== 'undefined' && window.otoolsPlugin) || {
  available: () => false,
  theme: () => '',
  language: () => '',
};

export function available() {
  return plugin.available();
}

export function theme() {
  return plugin.theme();
}

export function language() {
  return plugin.language();
}
