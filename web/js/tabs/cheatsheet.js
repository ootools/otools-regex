/**
 * tabs/cheatsheet.js — 速查表标签：分组语法表，点击条目插入 pattern 光标处。
 */

import { CHEATSHEET } from '../cheatsheet.js';

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

export function initCheatsheetTab(ctx) {
  const { i18n } = ctx;
  const L = () => (i18n.locale === 'en-US' ? 'en' : 'zh');

  const el = ctx.root.querySelector('section[data-panel="cheatsheet"]');
  el.innerHTML = `
    <div class="statusline">${esc(i18n.t('ui.cheatsheet.insertHint'))}</div>
    <div id="sheet-list" class="list-col"></div>
  `;

  const listEl = el.querySelector('#sheet-list');

  function render() {
    listEl.innerHTML = CHEATSHEET.map((g) => {
      const items = g.items
        .map((it) => {
          const note = it.note ? `<span class="note">${esc(it.note[L()] || it.note.zh)}</span>` : '';
          return `<div class="sheet-item" data-snippet="${esc(it.snippet)}">
            <span class="syntax">${esc(it.syntax)}</span>
            <span class="desc">${esc(it.desc[L()] || it.desc.zh)}</span>
            ${note}
          </div>`;
        })
        .join('');
      return `<div class="card" style="margin-bottom:10px">
        <div class="card-title" style="margin-bottom:6px">${esc(g.title[L()] || g.title.zh)}</div>
        ${items}
      </div>`;
    }).join('');
  }

  listEl.addEventListener('click', (e) => {
    const item = e.target.closest('.sheet-item');
    if (!item) return;
    const snippet = item.dataset.snippet;
    ctx.goTab('tester');
    if (ctx.tabs.tester && typeof ctx.tabs.tester.insertIntoPattern === 'function') {
      ctx.tabs.tester.insertIntoPattern(snippet);
    }
  });

  return { el, render };
}
