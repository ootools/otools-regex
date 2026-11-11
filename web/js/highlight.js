/**
 * highlight.js — 双层 textarea 匹配高亮层。
 * 结构：父容器 .editor-wrap（position:relative）里，.hl 背层在下、textarea 在上
 * （textarea 文字透明、光标可见）。两端排版规则由同一组 CSS 保证一致。
 */

function escapeHTML(s) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function createHighlightLayer(textarea) {
  const wrap = textarea.parentElement;
  const hl = document.createElement('div');
  hl.className = 'hl';
  wrap.insertBefore(hl, textarea); // hl 在前 → textarea 叠其上

  function syncScroll() {
    hl.scrollTop = textarea.scrollTop;
    hl.scrollLeft = textarea.scrollLeft;
  }

  textarea.addEventListener('scroll', syncScroll);
  textarea.addEventListener('input', syncScroll);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(syncScroll).observe(textarea);
  }

  function buildHTML(text, matches, activeIndex) {
    let html = '';
    let pos = 0;
    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const start = Math.max(m.index, pos);
      if (start < pos) continue; // 异常重叠：跳过
      html += escapeHTML(text.slice(pos, start));
      const cls = i === activeIndex ? ' active' : '';
      html += `<mark class="hl-hit${cls}" data-i="${i}">`;
      html += escapeHTML(text.slice(start, m.end));
      html += '</mark>';
      pos = Math.max(m.end, start);
    }
    html += escapeHTML(text.slice(pos));
    if (html.endsWith('\n')) html += '\n'; // pre-wrap 下末行对齐
    return html;
  }

  function render(matches, activeIndex = -1) {
    const list = Array.isArray(matches) ? matches : [];
    const text = String(textarea.value ?? '');
    hl.innerHTML = buildHTML(text, list, activeIndex);
    syncScroll();
  }

  function clear() {
    hl.innerHTML = buildHTML(String(textarea.value ?? ''), [], -1);
    syncScroll();
  }

  return { render, clear, syncScroll };
}
