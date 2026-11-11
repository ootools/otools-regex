import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchAll, replacePreview, batchValidate } from '../web/js/engine/core.js';
import { createEngineApi } from '../web/js/engine/api.js';

/** 假 worker 的回包计算：走真 core，验证整条协议 */
function coreForTest(msg) {
  switch (msg.op) {
    case 'match':
      return matchAll(msg.pattern, msg.flags, msg.text, msg.opts);
    case 'replace':
      return replacePreview(msg.pattern, msg.flags, msg.text, msg.replacement);
    case 'batch':
      return batchValidate(msg.pattern, msg.flags, msg.text, msg.opts);
    default:
      throw new Error('unknown op ' + msg.op);
  }
}

function workingFactory() {
  const w = {
    postMessage(msg) {
      queueMicrotask(() => {
        try {
          w.onmessage({ data: { id: msg.id, ok: true, result: coreForTest(msg) } });
        } catch (err) {
          // 对齐真 worker.js：core 抛错 → { ok:false, error }
          w.onmessage({
            data: { id: msg.id, ok: false, error: { message: String((err && err.message) || err) } },
          });
        }
      });
    },
    terminate() {
      w.dead = true;
    },
  };
  return w;
}

test('降级同步：workerFactory null', async () => {
  const api = createEngineApi({ workerFactory: null });
  const r = await api.match('\\d+', 'g', 'a1b22');
  assert.equal(r.matches.length, 2);
  assert.equal(r.degraded, true);
  assert.ok(r.elapsedMs >= 0);
  api.dispose();
});

test('降级同步：replace/batch 走 core', async () => {
  const api = createEngineApi({ workerFactory: null });
  const rp = await api.replace('o', 'g', 'foo', '0');
  assert.deepEqual({ result: rp.result, count: rp.count }, { result: 'f00', count: 2 });
  const b = await api.batch('^\\d+$', 'g', '1\nab');
  assert.equal(b.passed, 1);
  assert.equal(b.failed, 1);
  api.dispose();
});

test('Worker 路径：正常回包', async () => {
  const api = createEngineApi({ workerFactory: workingFactory });
  const r = await api.match('\\w+', 'g', 'ab cd');
  assert.equal(r.total, 2);
  assert.equal(r.degraded, undefined);
  assert.ok(r.elapsedMs >= 0);
  api.dispose();
});

test('Worker 路径：core 抛错 → reject message', async () => {
  const api = createEngineApi({ workerFactory: workingFactory });
  await assert.rejects(() => api.match('(', ''), (err) => err.message.includes('括号'));
  api.dispose();
});

test('超时路径：1000ms 无响应 → terminate + reject timedOut', async () => {
  const created = [];
  const silentFactory = () => {
    const w = { postMessage() {}, terminate() { w.count = (w.count || 0) + 1; } };
    created.push(w);
    return w;
  };
  const api = createEngineApi({ workerFactory: silentFactory });
  await assert.rejects(
    () => api.match('.*.*.*', 'g', 'x'.repeat(10)),
    (err) => err.timedOut === true
  );
  assert.equal(created[0].count, 1); // terminate 被调用
  api.dispose();
});

test('超时后引擎仍可用（下一请求成功）', async () => {
  const silent = () => ({ postMessage() {}, terminate() {} });
  const api = createEngineApi({ workerFactory: silent });
  await assert.rejects(() => api.match('\\w+', 'g', 'ab'), (err) => err.timedOut === true);
  // 换回可用的 factory 后继续可用：dispose 后重建
  api.dispose();
  const api2 = createEngineApi({ workerFactory: workingFactory });
  const r = await api2.match('\\w+', 'g', 'ab cd');
  assert.equal(r.total, 2);
  api2.dispose();
});

test('Worker 报错路径：ok:false → reject error.message', async () => {
  const errFactory = () => ({
    postMessage(msg) {
      queueMicrotask(() =>
        this.onmessage({ data: { id: msg.id, ok: false, error: { message: 'boom' } } })
      );
    },
    terminate() {},
  });
  const api = createEngineApi({ workerFactory: errFactory });
  await assert.rejects(() => api.match('\\w+', 'g', 'ab'), (err) => err.message === 'boom');
  api.dispose();
});

test('issues：引用校验同步直调（裁决：提前到 Task 3）', () => {
  const api = createEngineApi({ workerFactory: null });
  assert.deepEqual(api.issues('(?<year>\\d{4})', '', '$<moth>'), [{ type: 'name', ref: 'moth' }]);
  assert.deepEqual(api.issues('(?<y>\\d)', '', '$<y> ok'), []);
  api.dispose();
});
