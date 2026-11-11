/**
 * main.js — 装配：store + i18n + engine，主题/语言跟随宿主，tab 框架。
 * 各标签页模块（tabs/*.js）在此注册进 ctx.tabs；未注册的 tab 显示空面板。
 */

import { createStore } from './store.js';
import { createI18n } from './i18n.js';
import { createEngineApi } from './engine/api.js';
import { available, language } from './bridge.js';
import { initTesterTab } from './tabs/tester.js';
import { initPresetsTab } from './tabs/presets.js';
import { initReplaceTab } from './tabs/replace.js';
import { initBatchTab } from './tabs/batch.js';
import { initCheatsheetTab } from './tabs/cheatsheet.js';

const store = createStore();
const state = store.loadState();

// ---------------------------------------------------------------- i18n
const i18n = createI18n(language());
const TAB_ORDER = ['tester', 'presets', 'replace', 'batch', 'cheatsheet'];

function renderTabbar() {
  const bar = document.getElementById('tabbar');
  for (const btn of bar.querySelectorAll('button[data-tab]')) {
    btn.textContent = i18n.t('ui.tabs.' + btn.dataset.tab);
  }
  document.documentElement.lang = i18n.locale;
  document.title = i18n.locale === 'zh-CN' ? '正则工具箱 · RegexLab' : 'RegexLab';
}

function buildTabbar() {
  const bar = document.getElementById('tabbar');
  bar.querySelectorAll('button[data-tab]').forEach((b) => b.remove());
  for (const name of TAB_ORDER) {
    const btn = document.createElement('button');
    btn.dataset.tab = name;
    btn.type = 'button';
    btn.addEventListener('click', () => ctx.goTab(name));
    bar.appendChild(btn);
  }
  renderTabbar();
}

// ---------------------------------------------------------------- ctx
const ctx = {
  root: document,
  state,
  store,
  persist() {
    store.saveState({
      pattern: state.pattern,
      flags: state.flags,
      text: state.text,
      batchText: state.batchText,
      replacement: state.replacement,
      skipEmpty: state.skipEmpty,
      tab: state.tab,
    });
  },
  engine: createEngineApi(),
  i18n,
  available: available(),
  tabs: {},
  statusbar: null, // tabs 可注册底部状态条渲染器
};

function showStatus(text) {
  const bar = document.getElementById('statusbar');
  if (!text) {
    bar.hidden = true;
    return;
  }
  bar.hidden = false;
  bar.textContent = text;
}

ctx.showStatus = showStatus;

ctx.goTab = (name) => {
  state.tab = name;
  ctx.persist();
  for (const btn of document.querySelectorAll('#tabbar button[data-tab]')) {
    btn.classList.toggle('active', btn.dataset.tab === name);
  }
  for (const section of document.querySelectorAll('#panels section')) {
    if (section.dataset.panel === name) section.setAttribute('data-active', '');
    else section.removeAttribute('data-active');
  }
  const tab = ctx.tabs[name];
  if (tab && typeof tab.render === 'function') tab.render();
};

// ---------------------------------------------------------------- 主题跟随
// 宿主把 dark/light class 注入本 documentElement；CSS 变量直接响应，JS 只转发事件。
// serve-dist（无宿主）无 class = 走 :root 默认暗色。
window.addEventListener('message', (e) => {
  const d = e.data || {};
  if (d.type === 'otools:theme-sync') {
    window.dispatchEvent(new CustomEvent('otools-theme', { detail: themeClass() }));
  }
});

function themeClass() {
  const cl = document.documentElement.classList;
  return cl.contains('light') ? 'light' : 'dark';
}

// ---------------------------------------------------------------- 语言跟随
function applyLocale() {
  i18n.setLocale(language());
  renderTabbar();
  const tab = ctx.tabs[state.tab];
  if (tab && typeof tab.render === 'function') tab.render();
}

window.addEventListener('otools-locale-changed', applyLocale);

// ---------------------------------------------------------------- 启动
ctx.tabs.tester = initTesterTab(ctx);
ctx.tabs.presets = initPresetsTab(ctx);
ctx.tabs.replace = initReplaceTab(ctx);
ctx.tabs.batch = initBatchTab(ctx);
ctx.tabs.cheatsheet = initCheatsheetTab(ctx);
window.__rx = ctx; // 调试/测试钩子
buildTabbar();
ctx.goTab(TAB_ORDER.includes(state.tab) ? state.tab : 'tester');
