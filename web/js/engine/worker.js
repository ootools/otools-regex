/**
 * engine/worker.js — Worker 入口：收请求 → 调 core → 结构化克隆回传。
 * 协议：请求 { id, op:'match'|'replace'|'batch', pattern, flags, text, opts?, replacement? }
 *       响应 { id, ok:true, result } / { id, ok:false, error:{ message } }
 */
import { matchAll, replacePreview, batchValidate } from './core.js';

const OPS = { match: matchAll, replace: replacePreview, batch: batchValidate };

self.onmessage = (e) => {
  const { id, op, pattern, flags, text, opts, replacement } = e.data || {};
  const fn = OPS[op];
  if (!fn) {
    self.postMessage({ id, ok: false, error: { message: '未知操作：' + op } });
    return;
  }
  try {
    const result =
      op === 'replace' ? fn(pattern, flags, text, replacement) : fn(pattern, flags, text, opts);
    self.postMessage({ id, ok: true, result });
  } catch (err) {
    self.postMessage({ id, ok: false, error: { message: String((err && err.message) || err) } });
  }
};
