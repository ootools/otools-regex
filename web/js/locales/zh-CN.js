/** zh-CN（源语言）。键集与 en-US.js 严格 parity（tests/i18n.test.mjs 钉死）。 */
export default {
  ui: {
    tabs: {
      tester: '测试器',
      presets: '常用正则库',
      replace: '替换预览',
      batch: '批量校验',
      cheatsheet: '速查表',
    },
    common: {
      copy: '复制',
      copied: '已复制',
    },
    tester: {
      patternPlaceholder: '输入正则，如 (?<year>\\d{4})',
      historyTitle: '历史正则',
      matchCount: '匹配 {count} 处',
      elapsed: '{ms} ms',
      truncated: '已截断（共 {total} 处）',
      noGlobalWarn: '未开启全局标志（g），仅匹配第一处',
      timeoutWarn: '执行超时，疑似灾难性回溯',
      slowWarn: '{ms} ms',
      errorPrefix: '正则错误',
      flags: {
        g: 'g · 全局：匹配所有（关闭则只匹配第一处）',
        i: 'i · 忽略大小写',
        m: 'm · 多行：^ $ 匹配行首行尾',
        s: 's · dotAll：. 也匹配换行',
        u: 'u · Unicode：完整码点匹配，\\p{…} 需要它',
        d: 'd · 索引：给出每个匹配/分组的起止位置',
      },
      emptyMatch: '(空)',
      groupTitle: '捕获分组',
    },
    replace: {
      replacementPlaceholder: '替换串，支持 $1 $<name> $& $$ 等原生语义',
      noGlobalNotice: '未开启全局标志（g），仅替换第一处',
      issueName: '引用不存在的命名分组：$<{ref}>',
      issueIndex: '引用不存在的分组号：${ref}',
      count: '替换 {count} 处',
    },
    batch: {
      placeholder: '每行一条记录，逐行整行校验（如一批邮箱 / 手机号 / 单号）',
      summary: '通过 {passed} / 失败 {failed} / 共 {total}',
      copyFailed: '复制失败行',
      skipEmpty: '跳过空行',
      truncated: '已截断（共 {total} 行）',
    },
    presets: {
      searchPlaceholder: '搜索名称或正则…',
      load: '载入',
      all: '全部',
    },
    cheatsheet: {
      insertHint: '点击条目插入到当前正则',
    },
  },
};
