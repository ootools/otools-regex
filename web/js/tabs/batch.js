/**
 * tabs/batch.js — 批量逐行校验标签：独立 batchText 缓冲（不冲掉测试器文本）。
 * 逐行整行校验，✓/✗ 徽标 + 统计 + 复制失败行 + 空行策略 + 10 万行截断。
 */

import { debounce, copyText } from '../util.js';

const PREVIEW_LEN = 120;

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

export function initBatchTab(ctx) {
  const { state, engine, i18n } = ctx;
  const t = (k, params) => i18n.t(k, params);

  const el = ctx.root.querySelector('section[data-panel="batch"]');
  el.innerHTML = `
    <div class="statusline" id="batch-pattern-line"></div>
    <textarea id="batch-text" spellcheck="false" placeholder="${esc(t('ui.batch.placeholder'))}" style="flex:none;height:30%"></textarea>
    <div class="batch-stats statusline">
      <label class="check"><input type="checkbox" id="batch-skip-empty"> ${esc(t('ui.batch.skipEmpty'))}</label>
      <span id="batch-summary"></span>
      <button type="button" class="btn" id="batch-copy-failed">${esc(t('ui.batch.copyFailed'))}</button>
    </div>
    <div class="notice error" id="batch-error" hidden></div>
    <div class="notice" id="batch-truncated" hidden></div>
    <div class="results" id="batch-results"></div>
  `;

  const patternLine = el.querySelector('#batch-pattern-line');
  const textEl = el.querySelector('#batch-text');
  const skipEl = el.querySelector('#batch-skip-empty');
  const summaryEl = el.querySelector('#batch-summary');
  const copyBtn = el.querySelector('#batch-copy-failed');
  const errorEl = el.querySelector('#batch-error');
  const truncEl = el.querySelector('#batch-truncated');
  const resultsEl = el.querySelector('#batch-results');

  let lastFailed = [];

  textEl.addEventListener('input', () => {
    state.batchText = textEl.value;
    ctx.persist();
    scheduleRun();
  });

  skipEl.addEventListener('change', () => {
    state.skipEmpty = skipEl.checked;
    ctx.persist();
    scheduleRun();
  });

  copyBtn.addEventListener('click', async () => {
    if (!lastFailed.length) return;
    await copyText(lastFailed.join('\n'));
    copyBtn.textContent = t('ui.common.copied');
    setTimeout(() => (copyBtn.textContent = t('ui.batch.copyFailed')), 1200);
  });

  async function run() {
    const pattern = state.pattern;
    patternLine.textContent = pattern ? `${pattern} / ${state.flags || '（无标志）'}` : '';
    if (!pattern) {
      summaryEl.textContent = '';
      resultsEl.innerHTML = '';
      truncEl.hidden = true;
      errorEl.hidden = true;
      return;
    }
    try {
      const r = await engine.batch(pattern, state.flags, state.batchText, {
        skipEmpty: skipEl.checked,
      });
      errorEl.hidden = true;
      truncEl.hidden = !r.truncated;
      if (r.truncated) truncEl.textContent = t('ui.batch.truncated', { total: r.total });
      summaryEl.textContent = t('ui.batch.summary', {
        passed: r.passed,
        failed: r.failed,
        total: r.total,
      });
      lastFailed = r.rows.filter((x) => !x.ok).map((x) => x.text);
      resultsEl.innerHTML = r.rows
        .slice(0, 20000) // DOM 行数保护：10 万行的可视列表只画前 2 万
        .map(
          (row) =>
            `<div class="batch-row ${row.ok ? 'ok' : 'bad'}"><span class="no">${row.no}</span><span class="badge">${row.ok ? '✓' : '✗'}</span><span class="txt">${esc(row.text.length > PREVIEW_LEN ? row.text.slice(0, PREVIEW_LEN) + '…' : row.text) || '&nbsp;'}</span></div>`
        )
        .join('');
    } catch (err) {
      errorEl.textContent = `${t('ui.tester.errorPrefix')}：${err.message || err}`;
      errorEl.hidden = false;
      summaryEl.textContent = '';
      resultsEl.innerHTML = '';
    }
  }

  const scheduleRun = debounce(run, 150);

  function render() {
    if (textEl.value !== state.batchText) textEl.value = state.batchText;
    skipEl.checked = state.skipEmpty !== false;
    run();
  }

  return { el, render };
}
