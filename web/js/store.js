/**
 * store.js — localStorage 持久化（webview 数据目录；浏览器直开同样可用）。
 * 单键存储整个状态对象，键名空间固定 'otools-regex.'。
 */

const KEY = 'otools-regex.state';
const HISTORY_MAX = 20;

const DEFAULTS = {
  pattern: '',
  flags: 'g',
  text: '',
  batchText: '',
  replacement: '',
  skipEmpty: true,
  tab: 'tester',
  history: [],
};

export function createStore({ storage } = {}) {
  const ls = storage || globalThis.localStorage;

  function loadState() {
    try {
      const raw = ls.getItem(KEY);
      if (!raw) return { ...DEFAULTS };
      const saved = JSON.parse(raw);
      return { ...DEFAULTS, ...saved, history: Array.isArray(saved.history) ? saved.history : [] };
    } catch {
      return { ...DEFAULTS };
    }
  }

  function persist(state) {
    try {
      ls.setItem(KEY, JSON.stringify(state));
    } catch {
      /* 存储不可用（隐私模式等）时静默 */
    }
  }

  function saveState(patch) {
    const next = { ...loadState(), ...patch };
    persist(next);
    return next;
  }

  function addHistory(pattern) {
    const p = String(pattern || '');
    if (!p) return loadState().history;
    const prev = loadState().history.filter((x) => x !== p);
    const history = [p, ...prev].slice(0, HISTORY_MAX);
    persist({ ...loadState(), history });
    return history;
  }

  return { loadState, saveState, addHistory };
}
