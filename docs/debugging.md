# 调试手册

本页只回答“为什么改动没有生效，以及如何验证”。注入方案和架构取舍见 [architecture.md](architecture.md)，工具参数见 [tools/README.md](../tools/README.md)。

## 前置条件

- 用 `npm run dev` 启动开发浏览器；端口为 3212，CDP 端口为 9333。
- 使用登录态知乎页面。窗口隐藏时知乎可能不加载信息流。
- 运行 CDP 脚本前关闭该页面的 DevTools，避免 `Runtime.evaluate` 挂起。

## 改动不生效

按顺序排除，避免同时猜测 CSS、构建和扩展注册问题。

| 层级 | 检查 | 通过条件 |
| --- | --- | --- |
| L0 产物 | 确认开发时查看的是 `.output/chrome-mv3-dev`，生产构建才是 `.output/chrome-mv3` | 内联进产物的代码（content script）文本与源码一致；popup 见下方「dev 模式下面板的代码来源」 |
| L1 开发服务 | 在 PowerShell 运行 `Get-NetTCPConnection -LocalPort 3212` | 只有本项目的开发进程监听端口 |
| L2 扩展注册 | 在扩展详情页确认启用和加载路径；运行 `node tools/cdp-sw.mjs` | 注册脚本的 matches、js 与预期一致 |
| L3 页面样式 | 遍历 `document.styleSheets`，定位 `<style data-zf-style>` 并检查 `rule.selectorText` | 内联样式已注入，选择器没有被 CSS 注释破坏 |
| L4 对照注入 | 仅在需要定位浏览器缓存时，临时比较 `insertCSS({ css })`、`insertCSS({ files })` 与页面内联 style | 能明确是注入通道还是选择器问题 |

CSS 注释内的 `*/` 会提前结束注释并吞掉后续规则。路径示例应写成 `question/ID/answer/ID`，不要写 URL 通配模式。

## 锚点和命中数异常

1. 运行 [工具说明](../tools/README.md) 中对应的只读探针，确认当前 DOM 是否仍有语义类或稳定结构。
2. 修改 `src/switches/index.ts` 的 `anchors` 与 `src/styles/content.css` 的规则；两者的用途不同，前者只用于计数。
3. 在 CSS 注释里记录核实日期；未经实际页面确认的锚点不要写进注册表到 CSS 的正式规则。
4. 运行 `npm test`，确认注册表和 CSS 没有脱节。

## dev 模式下面板的代码来源

面板逻辑不打包进 `.output/chrome-mv3-dev/chunks/popup-*.js`。dev 构建把 `popup.html` 写成直接引用 dev server（`http://localhost:3212/src/entrypoints/popup/main.ts`，manifest 的 `extension_pages` CSP 已放行该地址），那个 chunk 只剩 Vite 的 modulepreload polyfill 桩，里面连 `current-chip`、`zhihu` 这类业务字符串都没有。

因此**不要用 chunk 的时间戳或内容判断面板是否最新**，它本来就不承载代码。核实改动到位有两种方式：

```bash
# 1. 直接看 dev server 供的模块（模块路径与源码一致）
curl -s http://localhost:3212/src/pages/index.ts | grep -c 'pageOfPathname'
# 2. 打开面板实测行为
```

生产构建才把面板逻辑打进 `chrome-mv3/chunks/popup-*.js`，那里可以按内容 grep。另外 dev server 在本机可能只监听 `[::1]:3212`，用 `localhost` 而不是 `127.0.0.1`，否则会误判成「服务没起来」。

## 常见误判

- 开发模式下 content script 由 service worker 动态注册，manifest 中没有 `content_scripts` 是正常的。
- Chrome 可能缓存扩展 CSS 文件。此项目使用内联的 manual CSS 注入，确认时应检查页面的 `data-zf-style` 节点。
- `CSS.getMatchedStylesForNode` 不能作为扩展注入样式是否存在的唯一证据；优先检查页面的 stylesheet 和实际布局。
