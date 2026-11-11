/**
 * engine/api.js — 主线程调度：Worker 优先 + 1000ms 超时 terminate + 重建；
 * 无 Worker（或建 Worker 抛错）时降级为主线程同步调 core（跑完测时，>100ms 告警）。
 * issues() 是纯函数同步直调（引用校验零风险，不值得走 Worker）。
 */
import { matchAll, replacePreview, batchValidate, findReplaceIssues } from './core.js';

const TIMEOUT_MS = 1000;
const SLOW_MS = 100;

function defaultWorkerFactory() {
  if (typeof Worker === 'undefined') return null;
  return new Worker(new URL('worker.js', import.meta.url), { type: 'module' });
}

export function createEngineApi({ workerFactory } = {}) {
  const makeWorker = workerFactory === undefined ? defaultWorkerFactory : workerFactory;
  let worker = null;
  let seq = 0;
  const pending = new Map(); // id -> { resolve, reject, timer, sentAt }

  function killWorker() {
    if (worker) {
      try {
        worker.terminate();
      } catch {
        /* ignore */
      }
      worker.onmessage = null;
      worker = null;
    }
  }

  function ensureWorker() {
    if (worker) return worker;
    try {
      worker = makeWorker();
    } catch {
      worker = null;
    }
    if (!worker) return null;
    worker.onmessage = (e) => {
      const { id, ok, result, error } = e.data || {};
      const p = pending.get(id);
      if (!p) return;
      clearTimeout(p.timer);
      pending.delete(id);
      const elapsedMs = performance.now() - p.sentAt;
      if (ok) p.resolve({ ...result, elapsedMs });
      else p.reject(new Error((error && error.message) || 'worker error'));
    };
    return worker;
  }

  function callWorker(payload) {
    const w = ensureWorker();
    if (!w) return null; // 转降级
    const id = ++seq;
    return new Promise((resolve, reject) => {
      const sentAt = performance.now();
      const timer = setTimeout(() => {
        pending.delete(id);
        killWorker(); // 高回溯正则无法中断，唯一手段是 terminate 整个 worker；下次请求重建
        reject(Object.assign(new Error('执行超时，疑似灾难性回溯'), { timedOut: true }));
      }, TIMEOUT_MS);
      pending.set(id, { resolve, reject, timer, sentAt });
      w.postMessage({ id, ...payload });
    });
  }

  function callSync(op, fn, args) {
    return new Promise((resolve, reject) => {
      const t0 = performance.now();
      try {
        const result = fn(...args);
        const elapsedMs = performance.now() - t0;
        const extra = { elapsedMs, degraded: true };
        if (elapsedMs > SLOW_MS) extra.warning = `主线程执行耗时 ${Math.round(elapsedMs)}ms`;
        resolve({ ...result, ...extra });
      } catch (err) {
        reject(err);
      }
    });
  }

  function run(op, fn, args) {
    if (makeWorker === null) return callSync(op, fn, args);
    const payload =
      op === 'replace'
        ? { op, pattern: args[0], flags: args[1], text: args[2], replacement: args[3] }
        : { op, pattern: args[0], flags: args[1], text: args[2], opts: args[3] };
    return callWorker(payload).then((r) => (r === null ? callSync(op, fn, args) : r));
  }

  return {
    match: (pattern, flags, text, opts) => run('match', matchAll, [pattern, flags, text, opts]),
    replace: (pattern, flags, text, replacement) =>
      run('replace', replacePreview, [pattern, flags, text, replacement]),
    batch: (pattern, flags, text, opts) => run('batch', batchValidate, [pattern, flags, text, opts]),
    issues: (pattern, flags, replacement) => findReplaceIssues(pattern, flags, replacement),
    dispose() {
      killWorker();
      for (const p of pending.values()) {
        clearTimeout(p.timer);
        p.reject(Object.assign(new Error('disposed'), { disposed: true }));
      }
      pending.clear();
    },
  };
}
