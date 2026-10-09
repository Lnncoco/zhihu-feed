# AGENTS.md — zhihu-feed

Chrome MV3 扩展（WXT + vanilla TS），把知乎整理成干净的新闻信息流：**纯减法隐藏**干扰元素 + **纯 CSS 阅读排版**，不改页面内容、不自动交互。**定位 Chrome-only，只服务知乎**，不做通用化抽象。

这是每次会话先读的速览页。**细节按需展开**，不要凭记忆改：

| 要做什么 | 展开读 |
|---|---|
| 改架构/理解模块职责与关键取舍 | [docs/architecture.md](docs/architecture.md) |
| 加开关、改样式、跑验证 | [docs/development.md](docs/development.md) |
| 「改了不生效」排查 / CDP 调试 | [docs/debugging.md](docs/debugging.md) |
| 使用或维护调试脚本 | [tools/README.md](tools/README.md) |
| 跑起来 / 构建加载 / 命令 | 本文件下方「怎么跑」 |

## 不可违反的约束（违反 = 返工，完整解释见 architecture.md）

1. **属性门控**：JS 只在 `<html>` 挂/摘 `data-zf-<id>`；禁止改知乎 DOM、禁止自动点击、禁止注入可见 UI 到页面。
2. **选择器单点**：全部页面选择器只在 `src/styles/content.css`；注册表 `anchors[].selector` 只服务命中数，不驱动逻辑。
3. **开关语义**：「开启 = 拿走标题所指的元素/行为」，标题用名词短语；`desc` 简明说明目标或结果，两态功能用 `segments` 文字切换。
4. **面板 IA**：页面维度只有顶部 5-tab 分段切换器；命中数 =「关掉它本页会露出几处」，0 显示「无目标」。
5. **宽度不变式**：阅读页与首页信息流列宽统一 694px（文本列 654px，折叠/展开同宽）；热榜 860px；专栏天然 654px。宽度一律写死 px，不用视口百分比。折叠预览文本是知乎在数据层截断的，CSS 变不出更多行。
6. **注入时序基线**：document_start + sessionStorage 快照 + 事件驱动路由。**不得回退到 document_idle 或轮询主通道**。
7. **环境红线**：dev 端口固定 **3212**；`.dev-profile/` 持久登录目录**不可删除/提交**；WXT 只把 `content.ts`/`*.content.ts` 认作内容脚本（其他命名会被静默打成资源）。
8. **CSS 注释纪律**：注释内禁 `*/` 序列；每条规则标注「已核实 + 日期」。

## 单一事实源（改逻辑先收敛到这几处，别再造副本）

- 加/改开关 → `src/switches/index.ts`（SWITCHES 注册表，唯一事实源）。
- 生效/级联判定 → `src/switches/resolve.ts`（`isActive`/`suppressorOf`，content 与 popup 都调它）。
- 在哪页 → `src/pages/index.ts`（`PAGES`/`pageOfPathname`/`trackRoute`，tab 顺序即 PAGES 数组顺序）。
- 持久化 + 快照 + 消息协议 → `src/settings/`。
- 版本号 → `package.json` 的 `version`（WXT 自动写入 manifest，勿在 wxt.config.ts 写死）。

业务职责链：**pages → switches → settings → styles**，`src/entrypoints/` 只做编排；这不是 TS import 方向约束。

## 怎么跑

```bash
npm install
npm run dev        # 拉起带扩展的 Chromium（.dev-profile 登录一次长期有效）；端口 3212
npm run build      # 产物 .output/chrome-mv3 → chrome://extensions 加载已解压
npm test           # vitest：页面判定/级联/注册表自检/注册表↔CSS 一致性
npm run compile    # tsc --noEmit
```

改完必过：`npm run compile` + `npm test`（typo/孤儿规则会被一致性测试打红）。运行时冒烟交给用户，交付结构化清单（拨开关/级联/命中数/快照秒开四项），不要用 CDP 开 popup 截图。

## 提交约定

- 一个开关一个 commit，信息写清锚点与核实日期。
- 只 `git add` 本轮改动的文件供审阅，不自动提交、不碰在途无关改动。
- `scratch/`（ad-hoc 探针）与 `.dev-profile/` 已 gitignore；可复用 CDP 脚本放 `tools/`。

## 已知缺口（用户已确认「先不支持」，勿擅自补）

首页侧栏「付费咨询推广」「推荐关注」卡、专栏「关于作者」/侧栏——无稳定类名锚点；`hide-app-banner` 三个锚点仍 unverified。详见 [开发指南](docs/development.md)。
