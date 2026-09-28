# 调试工具

这些脚本通过开发浏览器的 CDP 端口 9333 进行诊断。它们只服务本项目的开发环境，不属于扩展运行时，也不应被打包进产物。

## 使用前

1. 运行 `npm run dev`，保持开发 Chromium 打开。
2. 使用登录态知乎页面，并关闭页面 DevTools。
3. 临时表达式放入 `scratch/`；可复用、只读的探针才提交到 `tools/`。

`cdp-nav.mjs` 可以导航页面，其他已入库脚本只读或仅向扩展请求已有的诊断数据。运行前确认目标页面可以被覆盖。

## 工具表

| 文件 | 用法 | 用途 |
| --- | --- | --- |
| `cdp-nav.mjs` | `node tools/cdp-nav.mjs <url\|-> <expr-file>` | 可选导航知乎页，再在页面执行表达式；会启用窗口 focus 仿真 |
| `cdp-sw.mjs` | `node tools/cdp-sw.mjs [expr-file]` | 在扩展 service worker 执行诊断表达式；不带参数时列出动态注册脚本 |
| `sw-counts.mjs` | `node tools/sw-counts.mjs` | 请求当前知乎标签页的 `zf-counts` 并打印每个开关的命中数 |
| `expr-hdrsel.js` | 作为 `cdp-nav.mjs` 的表达式文件 | 盘点顶栏锚点，供选择器改版时验证 |

例如，在当前标签执行顶栏探针：

```bash
node tools/cdp-nav.mjs - tools/expr-hdrsel.js
```

## 新增工具的标准

- 一个脚本只解决一类诊断问题，并在文件顶部给出用法。
- 默认只读；需要导航、注入或写页面状态时，必须在工具说明和脚本注释中显式说明。
- 不把一次性实验提交到仓库。先放在 gitignore 的 `scratch/`，证明可复用后再整理为稳定工具。
- 稳定工具新增、改名或移除时，同步更新本页和 [调试手册](../docs/debugging.md)。
