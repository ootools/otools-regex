/**
 * tabs/tester.js — 测试器（核心标签）。
 * pattern/flags/text → state（持久化）→ 150ms 防抖 → engine.match（Worker，超时保护）
 * → 高亮层 + 结果列表（分组展开/点击定位）+ 状态栏（计数/耗时/截断/告警）。
 */

import { createHighlightLayer } from '../highlight.js';
import { debounce } from '../util.js';

const FLAG_ORDER = ['g', 'i', 'm', 's', 'u', 'd'];
const PREVIEW_LEN = 80;

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

export function initTesterTab(ctx) {
  const { state, engine, i18n, store } = ctx;
  const t = (k, params) => i18n.t(k, params);

  const el = ctx.root.querySelector('section[data-panel="tester"]');

  el.innerHTML = `
    <div id="pattern-row">
      <input id="pattern-input" type="text" spellcheck="false" autocomplete="off">
      <div id="flags-group"></div>
      <select id="history-select" title="${t('ui.tester.historyTitle')}"></select>
    </div>
    <div class="editor-wrap"><textarea id="text-input" spellcheck="false"></textarea></div>
    <div class="statusline" id="tester-status"></div>
    <div class="notice error" id="tester-error" hidden></div>
    <div class="results" id="tester-results"></div>
  `;

  const patternInput = el.querySelector('#pattern-input');
  const flagsGroup = el.querySelector('#flags-group');
  const historySelect = el.querySelector('#history-select');
  const textInput = el.querySelector('#text-input');
  const statusEl = el.querySelector('#tester-status');
  const errorEl = el.querySelector('#tester-error');
  const resultsEl = el.querySelector('#tester-results');

  const layer = createHighlightLayer(textInput);

  // ---------------------------------------------------------------- flags 复选组
  function renderFlags() {
    flagsGroup.innerHTML = '';
    for (const f of FLAG_ORDER) {
      const label = document.createElement('label');
      label.className = 'check';
      label.title = t('ui.tester.flags.' + f);
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = f;
      cb.checked = state.flags.includes(f);
      cb.addEventListener('change', () => {
        state.flags = FLAG_ORDER.filter((x) => flagsGroup.querySelector(`input[value="${x}"]`).checked).join('');
        ctx.persist();
        scheduleRun();
      });
      label.appendChild(cb);
      label.appendChild(document.createTextNode(f));
      flagsGroup.appendChild(label);
    }
  }

  // ---------------------------------------------------------------- 历史下拉
  function renderHistory() {
    const h = state.history || [];
    historySelect.innerHTML = '';
    const ph = document.createElement('option');
    ph.value = '';
    ph.textContent = t('ui.tester.historyTitle');
    ph.disabled = true;
    ph.selected = true;
    historySelect.appendChild(ph);
    for (const p of h) {
      const o = document.createElement('option');
      o.value = p;
      o.textContent = p.length > 48 ? p.slice(0, 48) + '…' : p;
      historySelect.appendChild(o);
    }
    historySelect.style.display = h.length ? '' : 'none';
  }

  historySelect.addEventListener('change', () => {
    const p = historySelect.value;
    if (!p) return;
    state.pattern = p;
    patternInput.value = p;
    patternInput.classList.remove('invalid');
    ctx.persist();
    scheduleRun();
  });

  // ---------------------------------------------------------------- 状态栏 / 错误
  function setStatus(html) {
    statusEl.innerHTML = html;
  }

  function showError(msg) {
    errorEl.textContent =
      msg.startsWith(t('ui.tester.errorPrefix')) ? msg : `${t('ui.tester.errorPrefix')}：${msg}`;
    errorEl.hidden = false;
  }

  function hideError() {
    errorEl.hidden = true;
    patternInput.classList.remove('invalid');
  }

  patternInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !errorEl.hidden) hideError();
  });

  // ---------------------------------------------------------------- 结果列表
  function groupLine(g) {
    const val = g.value === null ? `<span class="g-none">${esc(t('ui.tester.emptyMatch'))}</span>` : esc(g.value);
    const idx =
      g.start !== null && g.start !== undefined ? ` <span class="g-none">[${g.start}, ${g.end})</span>` : '';
    const name = g.name ? `<span class="group-name">${esc(g.name)}</span> ` : '';
    return `<div>${name}${idx ? `<span class="g-none">#${g.number ?? ''}</span> ` : ''}${val}${idx}</div>`;
  }

  function renderResults(r) {
    const items = r.matches
      .map((m, i) => {
        const preview = m.text.length > PREVIEW_LEN ? m.text.slice(0, PREVIEW_LEN) + '…' : m.text;
        const parts = [];
        if (m.groups.length) parts.push(m.groups.map(groupLine).join(''));
        if (m.named.length) parts.push(m.named.map(groupLine).join(''));
        const groupsHtml = parts.length
          ? `<div class="match-groups" data-g hidden>${parts.join('')}</div>`
          : '';
        return `<div class="match-item" data-i="${i}">
          <span class="idx">#${i + 1} @${m.index}</span>${esc(preview) || `<span class="g-none">${esc(t('ui.tester.emptyMatch'))}</span>`}${groupsHtml}
        </div>`;
      })
      .join('');
    resultsEl.innerHTML = items || '';
  }

  resultsEl.addEventListener('click', (e) => {
    const item = e.target.closest('.match-item');
    if (!item) return;
    const i = Number(item.dataset.i);
    const m = lastResult && lastResult.matches[i];
    if (!m) return;
    const groups = item.querySelector('.match-groups');
    if (groups) groups.hidden = !groups.hidden;
    textInput.focus();
    textInput.setSelectionRange(m.index, m.end);
    // 滚动让选区可见（近似：按行估算）
    const upTo = textInput.value.slice(0, m.index);
    const line = upTo.split('\n').length - 1;
    const lineHeight = parseFloat(getComputedStyle(textInput).lineHeight) || 20;
    const target = Math.max(0, line * lineHeight - textInput.clientHeight / 2);
    textInput.scrollTop = target;
    layer.render(lastResult.matches, i);
  });

  // ---------------------------------------------------------------- 运行
  let lastResult = null;
  let runSeq = 0;

  function renderStatus(r) {
    const parts = [];
    parts.push(t('ui.tester.matchCount', { count: r.total }));
    if (r.elapsedMs !== undefined) parts.push(t('ui.tester.elapsed', { ms: Math.round(r.elapsedMs) }));
    if (r.truncated) parts.push(`<span class="warn">${esc(t('ui.tester.truncated', { total: r.total }))}</span>`);
    if (!state.flags.includes('g') && r.total > 0) {
      parts.push(`<span class="warn">${esc(t('ui.tester.noGlobalWarn'))}</span>`);
    }
    if (r.degraded && r.warning) parts.push(`<span class="warn">${esc(r.warning)}</span>`);
    setStatus(parts.join(' · '));
  }

  async function run() {
    const seq = ++runSeq;
    const pattern = state.pattern;
    const text = state.text;
    if (!pattern) {
      lastResult = null;
      layer.render([], -1);
      resultsEl.innerHTML = '';
      setStatus('');
      hideError();
      return;
    }
    try {
      const r = await engine.match(pattern, state.flags, text);
      if (seq !== runSeq) return; // 过期响应
      lastResult = r;
      hideError();
      layer.render(r.matches, -1);
      renderResults(r);
      renderStatus(r);
      if (pattern) state.history = store.addHistory(pattern);
      renderHistory();
    } catch (err) {
      if (seq !== runSeq) return;
      if (err && err.timedOut) {
        setStatus(`<span class="err">${esc(t('ui.tester.timeoutWarn'))}</span>`);
        layer.render([], -1);
        resultsEl.innerHTML = '';
        return;
      }
      lastResult = null;
      layer.render([], -1);
      resultsEl.innerHTML = '';
      setStatus('');
      patternInput.classList.add('invalid');
      showError(err.message || String(err));
    }
  }

  const scheduleRun = debounce(run, 150);
  const persistSoon = debounce(() => ctx.persist(), 300);

  // ---------------------------------------------------------------- 输入接线
  patternInput.addEventListener('input', () => {
    state.pattern = patternInput.value;
    persistSoon();
    scheduleRun();
  });

  textInput.addEventListener('input', () => {
    state.text = textInput.value;
    persistSoon();
    if (lastResult) layer.render([], -1); // 文本已变，旧标记位置失效：先显裸文本
    scheduleRun();
  });

  // ---------------------------------------------------------------- API
  function render() {
    if (patternInput.value !== state.pattern) patternInput.value = state.pattern;
    if (textInput.value !== state.text) textInput.value = state.text;
    renderFlags();
    renderHistory();
    hideError();
    run();
  }

  function insertIntoPattern(snippet) {
    const start = patternInput.selectionStart ?? patternInput.value.length;
    const end = patternInput.selectionEnd ?? start;
    const v = patternInput.value;
    patternInput.value = v.slice(0, start) + snippet + v.slice(end);
    state.pattern = patternInput.value;
    const pos = start + snippet.length;
    patternInput.focus();
    patternInput.setSelectionRange(pos, pos);
    ctx.persist();
    scheduleRun();
  }

  return { el, render, insertIntoPattern };
}
