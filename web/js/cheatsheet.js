/**
 * cheatsheet.js — 正则速查表数据（spec §6.5）。
 * snippet = 点击后插入 pattern 光标处的片段。
 * note 放 JS 特有注记（lookbehind 可用、\p{…} 需 u 标志等）。
 */

const G = (id, title, items) => ({ id, title, items });
const I = (syntax, desc, snippet, note) =>
  note ? { syntax, desc, snippet, note } : { syntax, desc, snippet };

export const CHEATSHEET = [
  G('chars', { zh: '字符与转义', en: 'Characters & Escapes' }, [
    I('.', { zh: '任意字符（除换行，s 标志可含）', en: 'Any char except newline (s flag includes it)' }, '.', { zh: 'JS 中 . 不含 \\n，开 s 才含', en: 'In JS, . excludes \\n unless the s flag is on' }),
    I('\\d', { zh: '数字 [0-9]', en: 'Digit [0-9]' }, '\\d'),
    I('\\D', { zh: '非数字', en: 'Non-digit' }, '\\D'),
    I('\\w', { zh: '单词字符 [A-Za-z0-9_]', en: 'Word char [A-Za-z0-9_]' }, '\\w', { zh: '不含中文；中文请用 \\p{L}+u', en: 'No CJK; use \\p{L} with u for Chinese' }),
    I('\\W', { zh: '非单词字符', en: 'Non-word char' }, '\\W'),
    I('\\s', { zh: '空白（空格/制表/换行）', en: 'Whitespace' }, '\\s'),
    I('\\S', { zh: '非空白', en: 'Non-whitespace' }, '\\S'),
    I('\\n \\t \\r', { zh: '换行 / 制表 / 回车', en: 'Newline / Tab / CR' }, '\\n'),
    I('\\uXXXX', { zh: 'Unicode 码点（4 位十六进制）', en: 'Unicode code point (4 hex digits)' }, '\\u4e2d'),
    I('\\xHH', { zh: 'ASCII 十六进制字符', en: 'ASCII hex char' }, '\\x41'),
    I('\\0', { zh: 'NUL 字符', en: 'NUL char' }, '\\0'),
    I('\\\\', { zh: '反斜杠本身', en: 'Literal backslash' }, '\\\\'),
    I('\\.', { zh: '转义元字符（. * + ? 等）', en: 'Escape a metachar' }, '\\.'),
  ]),
  G('classes', { zh: '字符类', en: 'Character Classes' }, [
    I('[abc]', { zh: 'a、b、c 中任意一个', en: 'Any of a, b, c' }, '[abc]'),
    I('[^abc]', { zh: '除 abc 外任意字符', en: 'Any char except a, b, c' }, '[^abc]'),
    I('[a-z]', { zh: '范围：a 到 z', en: 'Range a–z' }, '[a-z]'),
    I('[0-9A-Fa-f]', { zh: '十六进制数字', en: 'Hex digit' }, '[0-9A-Fa-f]'),
    I('[[:alpha:]]', { zh: '（POSIX 类，JS 不支持）', en: '(POSIX class — NOT in JS)' }, '[A-Za-z]', { zh: 'JS 正则无 POSIX 类，用等价字符集', en: 'JS regex has no POSIX classes; use equivalent ranges' }),
  ]),
  G('quantifiers', { zh: '量词与贪婪', en: 'Quantifiers' }, [
    I('*', { zh: '0 次或多次（贪婪）', en: '0+ times (greedy)' }, '*'),
    I('+', { zh: '1 次或多次（贪婪）', en: '1+ times (greedy)' }, '+'),
    I('?', { zh: '0 或 1 次', en: '0 or 1 time' }, '?'),
    I('{n}', { zh: '恰好 n 次', en: 'Exactly n times' }, '{3}'),
    I('{n,}', { zh: '至少 n 次', en: 'n or more times' }, '{2,}'),
    I('{n,m}', { zh: 'n 到 m 次', en: 'Between n and m times' }, '{2,5}'),
    I('*?', { zh: '惰性版：0+ 次，尽可能少', en: 'Lazy: 0+ as few as possible' }, '*?'),
    I('+?', { zh: '惰性版：1+ 次', en: 'Lazy: 1+' }, '+?'),
    I('??', { zh: '惰性版：0 或 1 次', en: 'Lazy: 0 or 1' }, '??'),
    I('{n,m}?', { zh: '惰性版：n 到 m 次', en: 'Lazy n–m' }, '{2,5}?'),
    I('(?<x>a|b)*', { zh: '警惕嵌套量词回溯', en: 'Beware nested-quantifier backtracking' }, '.*.*', { zh: '(.*.*|a+)+ 类结构可灾难性回溯，本插件会超时终止', en: '(.*.*|a+)+ shapes cause catastrophic backtracking; this plugin times out' }),
  ]),
  G('groups', { zh: '分组与引用', en: 'Groups & References' }, [
    I('(...)', { zh: '捕获组，$1…$n 引用', en: 'Capturing group, referenced as $1…$n' }, '(...)'),
    I('(?:...)', { zh: '非捕获组（不占组号）', en: 'Non-capturing group' }, '(?:...)'),
    I('(?<name>...)', { zh: '命名捕获组，$<name> 引用', en: 'Named group, referenced as $<name>' }, '(?<name>...)', { zh: '重名命名组会直接 SyntaxError', en: 'Duplicate group names are a SyntaxError' }),
    I('\\1', { zh: '反向引用第 1 组（pattern 内）', en: 'Backreference to group 1 in pattern' }, '\\1'),
    I('$1', { zh: '替换串引用第 1 组', en: 'Replacement ref to group 1' }, '$1'),
    I('$<name>', { zh: '替换串引用命名组', en: 'Replacement ref to named group' }, '$<name>'),
    I('$&', { zh: '替换串引用整个匹配', en: 'Replacement ref to whole match' }, '$&'),
    I('$`', { zh: '匹配前的全部文本', en: 'Text before the match' }, '$`', { zh: 'JS 独有；注意与模板字符串转义', en: 'JS-specific; mind template-literal escaping' }),
    I("$'", { zh: '匹配后的全部文本', en: 'Text after the match' }, "$'"),
    I('$$', { zh: '字面 $', en: 'Literal $' }, '$$'),
  ]),
  G('asserts', { zh: '断言与边界', en: 'Assertions & Boundaries' }, [
    I('^', { zh: '行首（m 标志下每行）', en: 'Start of line (per line with m)' }, '^'),
    I('$', { zh: '行尾', en: 'End of line' }, '$'),
    I('\\b', { zh: '单词边界', en: 'Word boundary' }, '\\b', { zh: '对中文无效（\\w 不含中文）', en: 'Useless around CJK (\\w excludes CJK)' }),
    I('\\B', { zh: '非单词边界', en: 'Non-word boundary' }, '\\B'),
    I('(?=...)', { zh: '前瞻：后面必须是…', en: 'Lookahead' }, '(?=...)'),
    I('(?!...)', { zh: '否定前瞻：后面不能是…', en: 'Negative lookahead' }, '(?!...)'),
    I('(?<=...)', { zh: '后顾：前面必须是…', en: 'Lookbehind' }, '(?<=...)', { zh: 'JS（V8/WebView2）支持后顾，旧 Safari 不支持', en: 'Supported in JS (V8/WebView2); old Safari lacks it' }),
    I('(?<!...)', { zh: '否定后顾', en: 'Negative lookbehind' }, '(?<!...)', { zh: '同上，JS 可用', en: 'Supported in JS as well' }),
  ]),
  G('flags', { zh: '标志', en: 'Flags' }, [
    I('g', { zh: '全局：匹配所有', en: 'Global: match all' }, 'g', { zh: '关闭时 exec/test 会停在首个匹配', en: 'Off: exec/test stop at the first match' }),
    I('i', { zh: '忽略大小写', en: 'Ignore case' }, 'i'),
    I('m', { zh: '多行：^ $ 匹配行首尾', en: 'Multiline: ^ $ per line' }, 'm'),
    I('s', { zh: 'dotAll：. 含换行', en: 'dotAll: . matches newline' }, 's'),
    I('u', { zh: 'Unicode 模式（\\p 需要它）', en: 'Unicode mode (required by \\p)' }, 'u'),
    I('d', { zh: '给出匹配起止索引', en: 'Expose match indices' }, 'd', { zh: 'ES2022；WebView2/Node 均可用', en: 'ES2022; available in WebView2 and Node' }),
    I('y', { zh: '粘性：从 lastIndex 匹配', en: 'Sticky: match at lastIndex' }, 'y'),
  ]),
  G('unicode', { zh: 'Unicode 属性（需 u）', en: 'Unicode Props (need u)' }, [
    I('\\p{L}', { zh: '任意语言的字母', en: 'Any letter' }, '\\p{L}', { zh: '必须开 u 标志，否则 SyntaxError', en: 'Requires the u flag, else SyntaxError' }),
    I('\\p{N}', { zh: '任意数字字符', en: 'Any number char' }, '\\p{N}'),
    I('\\p{Script=Han}', { zh: '汉字', en: 'Han (Chinese) chars' }, '\\p{Script=Han}', { zh: '必须开 u 标志；比 [\\u4e00-\\u9fa5] 更全（含扩展区）', en: 'Requires u; broader than [\\u4e00-\\u9fa5] (includes extensions)' }),
    I('\\p{Emoji}', { zh: 'Emoji 字符', en: 'Emoji chars' }, '\\p{Emoji}'),
    I('\\p{P}', { zh: '标点符号', en: 'Punctuation' }, '\\p{P}'),
    I('\\p{Lu}', { zh: '大写字母', en: 'Uppercase letters' }, '\\p{Lu}'),
    I('\\P{L}', { zh: '大写 P：否定属性', en: 'Capital P: negated property' }, '\\P{L}'),
    I('[\\p{L}\\d]', { zh: '属性可与字符类并用', en: 'Props inside classes' }, '[\\p{L}\\d]'),
  ]),
  G('examples', { zh: '常用示例', en: 'Common Recipes' }, [
    I('^\\s+|\\s+$', { zh: '首尾空白（trim 用）', en: 'Leading/trailing whitespace (trim)' }, '^\\s+|\\s+$', { zh: 'm 标志下按行生效', en: 'Per line with m flag' }),
    I('\\s{2,}', { zh: '连续空白压缩', en: 'Squeeze repeated whitespace' }, '\\s{2,}'),
    I('[\\u4e00-\\u9fa5]+', { zh: '连续汉字', en: 'Runs of Chinese chars' }, '[\\u4e00-\\u9fa5]+'),
    I('^(?:0|[1-9]\\d*)$', { zh: '非负整数（整行）', en: 'Non-negative integer (full line)' }, '^(?:0|[1-9]\\d*)$'),
    I('(\\d{4})-(\\d{2})-(\\d{2})', { zh: '日期三段捕获', en: 'Date, three captured parts' }, '(\\d{4})-(\\d{2})-(\\d{2})'),
    I('^(?:[01]\\d|2[0-3]):[0-5]\\d$', { zh: '整行时间 HH:mm', en: 'Full-line HH:mm' }, '^(?:[01]\\d|2[0-3]):[0-5]\\d$'),
    I('#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\\b', { zh: 'HEX 颜色', en: 'HEX color' }, '#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\\b'),
    I('https?://[^\\s"\']+', { zh: 'URL（排除引号结尾）', en: 'URL (quote-safe end)' }, 'https?://[^\\s"\']+'),
    I('<(\\w+)[^>]*>.*?<\\/\\1>', { zh: '成对标签（同层）', en: 'Paired tag (same level)' }, '<(\\w+)[^>]*>.*?<\\/\\1>', { zh: '不支持嵌套同名标签；.* 建议换 [\\s\\S]*', en: 'No same-name nesting; prefer [\\s\\S]* over .*' }),
    I('^(?!.*(bad)).*$', { zh: '整行不含 bad', en: 'Line without "bad"' }, '^(?!.*bad).*$'),
    I('(?<=[\\u4e00-\\u9fa5])(?=\\d)', { zh: '中文与数字的零宽位置', en: 'Zero-width between CJK and digit' }, '(?<=[\\u4e00-\\u9fa5])(?=\\d)', { zh: '后顾 + 前瞻组合，JS 可用', en: 'Lookbehind + lookahead combo, supported in JS' }),
    I('(?:\\d{1,3}\\.){3}\\d{1,3}', { zh: 'IPv4（宽松）', en: 'IPv4 (loose)' }, '(?:\\d{1,3}\\.){3}\\d{1,3}'),
  ]),
];
