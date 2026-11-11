/**
 * bridge.js — OTools 宿主桥（模板 web/index.html 裁剪版）。
 * 本插件是纯前端工具，不需要文件 I/O：只探测宿主可用性、主题与语言。
 * 两条能力通道任一通即"在 OTools 里"；都不通（浏览器直开）则退回浏览器默认。
 */

function wrapper() {
  const a = (typeof window !== 'undefined' && (window.otools || window.utools)) || null;
  return a && typeof a === 'object' ? a : null;
}

function tauriInvoke() {
  const candidates = [window];
  try {
    if (window.parent && window.parent !== window) candidates.push(window.parent);
  } catch {
    /* cross-origin */
  }
  for (const c of candidates) {
    const t = c && c.__TAURI_INTERNALS__;
    if (t && typeof t.invoke === 'function') return t;
  }
  return null;
}

export function available() {
  return !!wrapper() || !!tauriInvoke();
}

export function theme() {
  const cl = document.documentElement && document.documentElement.classList;
  if (!cl) return '';
  if (cl.contains('light')) return 'light';
  if (cl.contains('dark')) return 'dark';
  return '';
}

export function language() {
  try {
    return (
      (window.__OTOOLS_LOCALE__ && window.__OTOOLS_LOCALE__.locale) ||
      (document.documentElement && document.documentElement.lang) ||
      (typeof navigator !== 'undefined' && navigator.language) ||
      ''
    );
  } catch {
    return '';
  }
}

// 统一挂到 window.otoolsPlugin，供页面其它脚本/调试用
window.otoolsPlugin = { available, theme, language };
