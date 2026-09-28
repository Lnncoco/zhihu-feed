# 架构说明

## 目标与边界

知乎信息流是一个克制的知乎阅读扩展：减少页面干扰、提供可回退的阅读排版，并让每项调整可按页面独立控制。

它不改写内容、不触发知乎交互、不向知乎页面注入可见 UI，也不抽象为多站点或多浏览器产品。Chrome MV3 和知乎页面是刻意保留的边界。

## 不变量

| 规则 | 原因 |
| --- | --- |
| JS 只在 `<html>` 切换 `data-zf-<id>` | 页面行为与样式分离，不破坏知乎 DOM |
| 页面选择器只在 `src/styles/content.css` | 改版时有一个可检查的修复点 |
| `SWITCHES` 是开关元数据的唯一来源 | popup 与 content 不复制开关、页面或级联逻辑 |
| `resolve.ts` 决定有效开关 | 设置面板与页面不会对父子接管产生不同理解 |
| document_start + sessionStorage 快照 + 路由事件 | 首帧尽早生效，SPA 切换不依赖轮询 |

## 模块职责

```text
src/pages/       路径识别、五个页面类型与路由事件
src/switches/    开关注册表、分区、父子接管和有效状态
src/settings/    storage.sync、sessionStorage 快照与页面消息协议
src/styles/      所有知乎页面选择器和视觉规则
src/entrypoints/ WXT 生命周期编排与 popup 渲染
```

这是一条业务职责链，不是严格的 TS import 方向。入口可以组合领域模块，但不应重新实现领域规则。

## 运行时数据流

```text
content document_start
  注入内联 CSS
  -> 读取 sessionStorage 快照并按当前路径切换属性
  -> 订阅 MAIN world 的 zf-route-change
  -> 异步读取 storage.sync 权威设置并更新快照/属性

popup
  读取当前 tab URL 以选择页面 tab
  -> 读写 overrides
  -> 请求 zf-counts，显示关闭开关后会露出的目标数
```

`router.content.ts` 在 MAIN world 包装 `pushState`、`replaceState` 并监听 `popstate`。它只广播事件；isolated world 自行读取 `location.pathname`，避免跨 world 传递页面数据。

## 关键选择

### 属性门控和单一 CSS 文件

每个开关在根元素上有一个属性，CSS 决定视觉结果。开关注册表中的 `anchors` 仅供 popup 计数，不参与隐藏逻辑；这样页面选择器没有第二份“真相”。

### 手动 CSS 注入

`content.ts` 通过 `?inline` 将 `content.css` 放入脚本，并在 document_start 插入 `<style data-zf-style>`。这避免开发时 Chrome 对扩展 CSS 文件缓存造成的误判，并确保样式与脚本同一次更新。

### 级联关系

`suppressedBy` 表示父开关生效时接管子开关。关系必须是同分区、无环的树；解析层找出实际接管者，popup 递归披露后代。这样既能保持主面板简洁，也能在父开关关闭后恢复细粒度控制。

## 演进准则

优先在注册表、CSS 和测试中扩展；只有当它们无法表达需求时才新增代码路径。`content.css` 超过约 600 行后，可以按 region 拆分并由一个内联入口聚合。性能优化只在 popup 命中统计出现可感卡顿时进行，因为逐项摘属性测量是计数语义的一部分。
