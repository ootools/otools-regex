/**
 * engine/core.js — 正则内核纯函数（唯一与 RegExp 打交道的模块）。
 * 不碰 DOM、不碰 Worker：Worker 与主线程降级路径都复用这里。
 */

const VALID_FLAGS = 'dgimsuy';

/** V8 SyntaxError 消息 → 中文（未命中的透传原文） */
const ERROR_MAP = [
  ['Unterminated group', '括号未闭合（缺少对应的 )）'],
  ['Nothing to repeat', '量词（* + ? {）缺少可重复的对象'],
  ['Duplicate capture group name', '命名捕获组重名'],
  ['Unterminated character class', '字符类未闭合（缺少对应的 ]）'],
  ['Lone quantifier brackets', '孤立的 ] 或 } 未转义'],
  ['Invalid regular expression flags', '非法的标志字符'],
  ['Invalid capture group name', '非法的捕获组名'],
  ['Incomplete quantifier', '量词格式不完整'],
  ['Invalid unicode escape', '非法的 Unicode 转义'],
  ['Numbers out of order in {} quantifier', '量词 {m,n} 的数字顺序错误'],
];

export function describeError(err) {
  const msg = String((err && err.message) || err);
  for (const [needle, zh] of ERROR_MAP) {
    if (msg.includes(needle)) return `正则错误：${zh}`;
  }
  return msg;
}

function validateFlags(flags) {
  const f = String(flags || '');
  for (const ch of f) {
    if (!VALID_FLAGS.includes(ch)) return `非法的标志字符：${ch}`;
    if (f.indexOf(ch) !== f.lastIndexOf(ch)) return `标志重复：${ch}`;
  }
  return null;
}

/**
 * 扫描 source，建立捕获组编号→命名映射。
 * 处理转义、字符类 [..]；(?: (?= (?! (?<= (?<! 非捕获不计数；(?<name> 捕获并记名。
 */
function scanGroups(source) {
  const nameByNumber = new Map();
  let num = 0;
  let inClass = false;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (ch === '\\') {
      i++;
      continue;
    }
    if (inClass) {
      if (ch === ']') inClass = false;
      continue;
    }
    if (ch === '[') {
      inClass = true;
      continue;
    }
    if (ch !== '(') continue;
    if (source[i + 1] === '?') {
      const after = source[i + 2];
      if (after === '<' && source[i + 3] !== '=' && source[i + 3] !== '!') {
        num++;
        const close = source.indexOf('>', i + 3);
        nameByNumber.set(num, source.slice(i + 3, close));
        i = close;
      }
      continue;
    }
    num++;
  }
  return { count: num, nameByNumber };
}

/** 编译正则；flags 非法/重复、pattern 语法错均返回 {ok:false, message} */
export function compileRegex(pattern, flags) {
  const flagErr = validateFlags(flags);
  if (flagErr) return { ok: false, message: flagErr };
  try {
    return { ok: true, re: new RegExp(pattern, flags) };
  } catch (err) {
    return { ok: false, message: describeError(err) };
  }
}

/** 无 g 也复用：单次 exec。scan = scanGroups(re.source)，用于把命名组从编号列表里排除 */
function extractMatch(re, m, scan) {
  const hasIdx = !!re.hasIndices;
  const idx = m.indices;
  const groups = [];
  for (let i = 1; i < m.length; i++) {
    if (scan && scan.nameByNumber.has(i)) continue; // 命名组进 named 列表，编号列表不重复展示
    const gi = hasIdx && idx && idx[i] ? idx[i] : null;
    groups.push({
      number: i,
      value: m[i] === undefined ? null : m[i],
      start: gi ? gi[0] : null,
      end: gi ? gi[1] : null,
    });
  }
  const named = [];
  const g = m.groups || {};
  for (const name of Object.keys(g)) {
    const gi = hasIdx && idx && idx.groups && idx.groups[name] ? idx.groups[name] : null;
    named.push({
      name,
      value: g[name] === undefined ? null : g[name],
      start: gi ? gi[0] : null,
      end: gi ? gi[1] : null,
    });
  }
  return {
    index: m.index,
    end: m.index + m[0].length,
    text: m[0],
    start: hasIdx ? m.index : null,
    groups,
    named,
  };
}

/**
 * 全量匹配。无 g：仅首个匹配（不静默补 g）。truncated = total > limit。
 * 非法正则抛 Error(message)（由调用方/worker 捕获）。
 */
export function matchAll(pattern, flags, text, { limit = 1000 } = {}) {
  const c = compileRegex(pattern, flags);
  if (!c.ok) throw new Error(c.message);
  const re = c.re;
  const scan = scanGroups(re.source);
  const matches = [];
  let total = 0;

  if (!re.global) {
    const m = re.exec(text);
    if (m) {
      total = 1;
      matches.push(extractMatch(re, m, scan));
    }
    return { matches, total, truncated: false };
  }

  re.lastIndex = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    total++;
    if (matches.length < limit) matches.push(extractMatch(re, m, scan));
    if (m[0] === '') {
      // 零宽匹配：手工推进，否则死循环
      re.lastIndex++;
      if (re.lastIndex > text.length) break;
    }
  }
  return { matches, total, truncated: total > limit };
}

/** 替换预览：count = 实际替换处数（g 全量；无 g 0|1） */
export function replacePreview(pattern, flags, text, replacement) {
  const c = compileRegex(pattern, flags);
  if (!c.ok) throw new Error(c.message);
  const re = c.re;
  let count = 0;
  if (re.global) {
    re.lastIndex = 0;
    while (re.exec(text) !== null) count++;
    // 失败的 exec 会把 lastIndex 归零，可直接复用
  } else if (re.test(text)) {
    count = 1;
  }
  const result = text.replace(re, replacement);
  return { result, count };
}

/**
 * 替换串引用校验：$<name> / $N 指向不存在的组。
 * scanGroups 拿组数与命名组名单；仅当 pattern 存在命名组时才校验 $<name>
 * （与原生语义一致：无命名组时 $<x> 是字面量）。
 */
export function findReplaceIssues(pattern, flags, replacement) {
  const c = compileRegex(pattern, flags);
  if (!c.ok) return [];
  const scan = scanGroups(c.re.source);
  const groupCount = scan.count;
  const names = [...scan.nameByNumber.values()];
  const rep = String(replacement);
  const issues = [];
  const seen = new Set();
  const push = (it) => {
    const key = it.type + ':' + it.ref;
    if (!seen.has(key)) {
      seen.add(key);
      issues.push(it);
    }
  };
  if (names.length > 0) {
    for (const m of rep.matchAll(/\$<([^<>]*)>/g)) {
      if (!names.includes(m[1])) push({ type: 'name', ref: m[1] });
    }
  }
  for (const m of rep.matchAll(/\$(\d{1,2})/g)) {
    const n = parseInt(m[1], 10);
    if (n >= 1 && n > groupCount) push({ type: 'index', ref: m[1] });
  }
  return issues;
}

/**
 * 批量逐行校验。行号 no 为原文 1 起；空行 = 去掉行尾 \r 后为空串。
 * 内部重新编译（去掉 g/y）逐行 test，规避 g 的 lastIndex 副作用。
 */
export function batchValidate(pattern, flags, text, { skipEmpty = true, limit = 100000 } = {}) {
  const safeFlags = String(flags || '').replace(/[gy]/g, '');
  const c = compileRegex(pattern, safeFlags);
  if (!c.ok) throw new Error(c.message);
  const re = c.re;
  const lines = String(text).split('\n');
  const rows = [];
  let passed = 0;
  let failed = 0;
  let total = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\r$/, '');
    if (skipEmpty && line === '') continue;
    total++;
    const ok = re.test(line);
    if (ok) passed++;
    else failed++;
    if (rows.length < limit) rows.push({ no: i + 1, text: line, ok });
  }
  return { rows, passed, failed, total, truncated: total > limit };
}
