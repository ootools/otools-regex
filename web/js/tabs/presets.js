/**
 * tabs/presets.js — 常用正则库标签：分类侧栏 + 搜索 + 卡片列表（复制/载入）。
 * 载入 = 写 state(pattern/flags/text=样例) → persist → 跳测试器。
 */

import { CATEGORIES, PRESETS } from '../presets.js';
import { copyText } from '../util.js';

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

export function initPresetsTab(ctx) {
  const { state, i18n } = ctx;
  const t = (k, params) => i18n.t(k, params);
  const L = () => (i18n.locale === 'en-US' ? 'en' : 'zh');

  const el = ctx.root.querySelector('section[data-panel="presets"]');
  el.innerHTML = `
    <div class="two-col">
      <div class="side" id="preset-cats"></div>
      <div class="list-col">
        <input type="text" id="preset-search" placeholder="${esc(t('ui.presets.searchPlaceholder'))}">
        <div id="preset-list"></div>
      </div>
    </div>
  `;

  const catsEl = el.querySelector('#preset-cats');
  const searchEl = el.querySelector('#preset-search');
  const listEl = el.querySelector('#preset-list');

  let activeCat = 'all';
  let query = '';

  function renderCats() {
    const cats = [{ id: 'all', name: { zh: t('ui.presets.all'), en: t('ui.presets.all') } }, ...CATEGORIES];
    catsEl.innerHTML = '';
    for (const c of cats) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = c.name[L()] || c.name.zh;
      btn.classList.toggle('active', c.id === activeCat);
      btn.addEventListener('click', () => {
        activeCat = c.id;
        renderCats();
        renderList();
      });
      catsEl.appendChild(btn);
    }
  }

  function matches(p) {
    if (activeCat !== 'all' && p.category !== activeCat) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      p.name.zh.toLowerCase().includes(q) ||
      p.name.en.toLowerCase().includes(q) ||
      p.pattern.toLowerCase().includes(q) ||
      p.id.includes(q)
    );
  }

  function renderList() {
    const items = PRESETS.filter(matches);
    listEl.innerHTML = items
      .map((p) => {
        const note = p.note
          ? `<div class="card-note notice">${esc(p.note[L()] || p.note.zh)}</div>`
          : '';
        return `<div class="card" data-id="${p.id}">
          <div class="card-head">
            <span class="card-title">${esc(p.name[L()] || p.name.zh)}</span>
            <code class="card-pattern">${esc(p.pattern)}</code>
            <button type="button" class="btn" data-act="copy">${esc(t('ui.common.copy'))}</button>
            <button type="button" class="btn primary" data-act="load">${esc(t('ui.presets.load'))}</button>
          </div>
          ${note}
        </div>`;
      })
      .join('');
    if (!items.length) listEl.innerHTML = `<div class="card-desc">–</div>`;
  }

  searchEl.addEventListener('input', () => {
    query = searchEl.value.trim();
    renderList();
  });

  listEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const card = btn.closest('.card');
    const p = PRESETS.find((x) => x.id === card.dataset.id);
    if (!p) return;
    if (btn.dataset.act === 'copy') {
      await copyText(p.pattern);
      btn.textContent = t('ui.common.copied');
      setTimeout(() => (btn.textContent = t('ui.common.copy')), 1200);
    } else if (btn.dataset.act === 'load') {
      state.pattern = p.pattern;
      state.flags = p.flags || 'g';
      state.text = p.sample;
      ctx.persist();
      ctx.goTab('tester');
    }
  });

  function render() {
    renderCats();
    renderList();
  }

  return { el, render };
}
