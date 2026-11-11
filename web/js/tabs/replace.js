/**
 * tabs/replace.js — 替换预览标签：与测试器共享 pattern/flags，独立替换串输入。
 * 替换串用原生 $1/$<name>/$&/$$ 语义（String.replace），引用错误仅提示不阻断。
 */

import { compileRegex } from '../engine/core.js';
import { debounce } from '../util.js';

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

export function initReplaceTab(ctx) {
  const { state, engine, i18n } = ctx;
  const t = (k, params) => i18n.t(k, params);

  const el = ctx.root.querySelector('section[data-panel="replace"]');
  el.innerHTML = `
    <div class="statusline" id="replace-pattern-line"></div>
    <input type="text" id="replace-input" spellcheck="false" placeholder="${esc(t('ui.replace.replacementPlaceholder'))}">
    <div class="notice error" id="replace-error" hidden></div>
    <div class="notice" id="replace-notice" hidden></div>
    <div class="statusline" id="replace-count"></div>
    <pre class="replace-preview" id="replace-preview"></pre>
  `;

  const patternLine = el.querySelector('#replace-pattern-line');
  const replaceInput = el.querySelector('#replace-input');
  const errorEl = el.querySelector('#replace-error');
  const noticeEl = el.querySelector('#replace-notice');
  const countEl = el.querySelector('#replace-count');
  const previewEl = el.querySelector('#replace-preview');

  replaceInput.addEventListener('input', () => {
    state.replacement = replaceInput.value;
    ctx.persist();
    scheduleRun();
  });

  function showError(msg) {
    errorEl.textContent = msg.startsWith(t('ui.tester.errorPrefix'))
      ? msg
      : `${t('ui.tester.errorPrefix')}：${msg}`;
    errorEl.hidden = false;
  }

  async function run() {
    const pattern = state.pattern;
    const flags = state.flags;
    const replacement = state.replacement || '';
    if (!pattern) {
      patternLine.textContent = '';
      previewEl.textContent = '';
      countEl.textContent = '';
      errorEl.hidden = true;
      noticeEl.hidden = true;
      return;
    }
    patternLine.textContent = `${pattern} / ${flags || '（无标志）'}`;
    // 引用校验（同步纯函数）：$<name>/$N 指向不存在的组
    const issues = engine.issues(pattern, flags, replacement);
    const issueLines = issues.map((it) =>
      it.type === 'name' ? t('ui.replace.issueName', { ref: it.ref }) : t('ui.replace.issueIndex', { ref: it.ref })
    );
    if (issueLines.length) {
      noticeEl.textContent = issueLines.join('；');
      noticeEl.hidden = false;
    } else {
      noticeEl.hidden = true;
    }
    try {
      const r = await engine.replace(pattern, flags, state.text, replacement);
      previewEl.textContent = r.result;
      const parts = [t('ui.replace.count', { count: r.count })];
      if (!flags.includes('g') && r.count > 0) parts.push(t('ui.replace.noGlobalNotice'));
      countEl.textContent = parts.join(' · ');
      errorEl.hidden = true;
    } catch (err) {
      previewEl.textContent = '';
      countEl.textContent = '';
      showError(err.message || String(err));
    }
  }

  const scheduleRun = debounce(run, 150);

  function render() {
    if (replaceInput.value !== (state.replacement || '')) replaceInput.value = state.replacement || '';
    run();
  }

  return { el, render };
}
