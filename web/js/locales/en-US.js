/** en-US。键集与 zh-CN.js 严格 parity（tests/i18n.test.mjs 钉死）。 */
export default {
  ui: {
    tabs: {
      tester: 'Tester',
      presets: 'Presets',
      replace: 'Replace',
      batch: 'Batch Check',
      cheatsheet: 'Cheat Sheet',
    },
    common: {
      copy: 'Copy',
      copied: 'Copied',
    },
    tester: {
      patternPlaceholder: 'Enter a regex, e.g. (?<year>\\d{4})',
      historyTitle: 'History',
      matchCount: '{count} match(es)',
      elapsed: '{ms} ms',
      truncated: 'Truncated ({total} total)',
      noGlobalWarn: 'Global flag (g) is off: only the first match is shown',
      timeoutWarn: 'Timed out: likely catastrophic backtracking',
      slowWarn: '{ms} ms',
      errorPrefix: 'Regex error',
      flags: {
        g: 'g · Global: match all (off = first match only)',
        i: 'i · Ignore case',
        m: 'm · Multiline: ^ $ match line boundaries',
        s: 's · dotAll: . also matches newlines',
        u: 'u · Unicode: full code points, required by \\p{…}',
        d: 'd · Indices: expose start/end of matches and groups',
      },
      emptyMatch: '(empty)',
      groupTitle: 'Capture groups',
    },
    replace: {
      replacementPlaceholder: 'Replacement, supports $1 $<name> $& $$ (native semantics)',
      noGlobalNotice: 'Global flag (g) is off: only the first occurrence is replaced',
      issueName: 'Reference to a missing named group: $<{ref}>',
      issueIndex: 'Reference to a missing group number: ${ref}',
      count: '{count} replacement(s)',
    },
    batch: {
      placeholder: 'One record per line, full-line validation (emails, phone numbers, order IDs…)',
      summary: 'Passed {passed} / Failed {failed} / Total {total}',
      copyFailed: 'Copy failed lines',
      skipEmpty: 'Skip empty lines',
      truncated: 'Truncated ({total} lines total)',
    },
    presets: {
      searchPlaceholder: 'Search by name or pattern…',
      load: 'Load',
      all: 'All',
    },
    cheatsheet: {
      insertHint: 'Click an entry to insert it into the current pattern',
    },
  },
};
