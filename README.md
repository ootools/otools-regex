# otools-regex · 正则工具箱（RegexLab）

OTools 独立插件：正则编写 → 验证 → 替换预览 → 批量校验一站式完成，内置常用正则库与速查表。纯前端、零依赖、离线可用。

## 功能

- **测试器**：pattern + flags（`g i m s u d`）+ 测试文本，实时高亮全部匹配；结果列表可展开逐个显示捕获分组（编号组/命名组，`d` 标志含起止索引）；点击结果定位原文；历史正则 20 条。
- **常用正则库**：43 条现成正则，六类分组（表单校验/数字金额/网络/文件与格式/日期时间/编程），双语名称与说明，误判注记（如身份证只验格式不验校验码）；点击「载入」自动填样例。
- **替换预览**：与测试器共享正则；原生 `$1 $<name> $& $$` 语义；替换计数；`$<name>`/`$N` 引用不存在的组时提示（仍按原生语义输出）。
- **批量校验**：每行一条记录逐行整行校验，✓/✗ 徽标 + 通过/失败统计，一键复制失败行，空行策略可切换（默认跳过），10 万行截断保护。
- **速查表**：9 组 74 条语法速查（字符类/量词/分组引用/断言/标志/Unicode 属性/常用示例），点击条目插入到当前正则光标处。

## 工程特性

- **防失控保护**：匹配在 Web Worker 中执行，超时 1000ms 直接 terminate 并告警"疑似灾难性回溯"（无 Worker 环境降级主线程 + 跑完测时告警）；渲染上限 1000 个匹配；输入防抖 150ms。
- **双主题 / 双语言**：跟随宿主 dark/light class 与 locale（zh-CN / en-US），浏览器直开默认暗色中文。
- **持久化**：最近 20 条正则历史、上次输入与标签页，localStorage 存储。

## 浏览器直开说明

「浏览器直开」指以 http 方式打开 dist：

```bash
node scripts/build-web.mjs
node scripts/serve-dist.mjs        # http://127.0.0.1:6483
```

**双击 `file://` 打开不受支持**（多文件 ES Module 受 Chromium 限制，会白屏）。

## 开发与发布

```bash
node scripts/build-web.mjs                                  # 构建 web/ → dist/
node scripts/serve-dist.mjs [端口]                          # 本地预览（默认 6483）
node --test tests/*.test.mjs                                # 单元测试（Node 内置 runner，零依赖）
node scripts/pack-plugin.mjs                                # 打包 .oplg
node scripts/verify-plugin.mjs                              # 校验 .oplg
pwsh -File scripts/deploy-to-otools.ps1 -OtoolsRoot <路径>  # 同步到 OTools 主仓库本地试跑
```

发布：推 tag `v*` → CI（`.github/workflows/release-plugin.yml`）自动构建、打包、Release。市场发布（`publish-market.mjs`）需要 `XYCLOUD_PAT` 等凭据，由仓库所有者配置。

## 结构

```
web/
├── index.html            # 页面骨架
├── css/app.css           # CSS 变量双主题
└── js/
    ├── main.js           # ctx 装配 / 主题语言跟随 / tab 框架
    ├── bridge.js         # 宿主桥裁剪版（available/theme/language）
    ├── engine/           # core.js 纯函数内核 / worker.js / api.js 调度
    ├── highlight.js      # 双层 textarea 高亮层
    ├── presets.js        # 正则库数据（双语 + 误判注记）
    ├── cheatsheet.js     # 速查表数据
    ├── store.js          # localStorage 持久化
    ├── i18n.js           # 点路径 t() / parity 测试钉死
    ├── util.js           # debounce / copyText
    └── tabs/             # tester / presets / replace / batch / cheatsheet
tests/                    # node:test 单测（engine/store/i18n/presets/cheatsheet）
```

> 语法范围：仅 JavaScript `RegExp`（WebView2 / 现代浏览器）。跨方言（PCRE、RE2 等）不在支持范围。
