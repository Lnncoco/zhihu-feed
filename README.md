# 知乎信息流

一个面向 Chrome 的知乎阅读扩展。它通过可回退的开关隐藏干扰区域，并用 CSS 调整阅读排版；不改写页面内容、不替用户操作，也不试图把知乎变成通用网页阅读器。

适用范围：知乎首页、问题页、回答页、热榜和专栏。仅支持 Chrome MV3。

## 使用

```bash
npm install
npm run build
```

在 `chrome://extensions` 打开开发者模式，选择“加载已解压的扩展程序”，并选取 `.output/chrome-mv3`。

## 开发

```bash
npm run dev       # 带扩展的 Chromium；端口固定为 3212
npm run compile   # TypeScript 检查
npm test          # 单元测试与注册表/CSS 契约检查
npm run build     # 生产构建
```

`.dev-profile/` 保存开发浏览器登录态，不应删除或提交。开发产物位于 `.output/chrome-mv3-dev`；生产产物位于 `.output/chrome-mv3`。

## 文档

| 需要完成的事 | 阅读位置 |
| --- | --- |
| 理解边界、模块与关键技术选择 | [架构说明](docs/architecture.md) |
| 新增开关、修改样式、验证或发布 | [开发指南](docs/development.md) |
| 排查样式、注入或 CDP 问题 | [调试手册](docs/debugging.md) |
| 使用或维护 CDP 工具 | [工具说明](tools/README.md) |
| 让自动化协作者快速遵守项目约束 | [AGENTS.md](AGENTS.md) |

版本号只在 `package.json` 的 `version` 维护，WXT 会将其写入 manifest。
