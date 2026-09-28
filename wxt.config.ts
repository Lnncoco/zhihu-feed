import { defineConfig } from 'wxt';

export default defineConfig({
  // 全部源码收进 src/；WXT 的 @ 别名自动指向 srcDir，@/... 导入不受迁移影响
  srcDir: 'src',
  // 3000 常被其他项目（如 nash-studio-view 的 vite）占用；端口冲突会让
  // dev server 起不来/旧实例继续供旧产物，表现为扩展改动永远不生效
  dev: {
    server: { port: 3212 },
  },
  manifest: {
    name: '知乎信息流',
    description: '减少页面干扰、提供可回退阅读排版的知乎扩展',
    // 版本不在此写死：WXT 缺省取 package.json version，保持单源
    permissions: ['storage'],
  },
  webExt: {
    // 持久化调试浏览器 Profile：知乎登录一次，之后 npm run dev 一直是登录态
    chromiumProfile: './.dev-profile',
    keepProfileChanges: true,
    // web-ext 在 chromium 路径上不消费 chromiumPort（源码核实），必须直接透传 flag
    chromiumArgs: ['--remote-debugging-port=9333'],
    startUrls: ['https://www.zhihu.com/'],
  },
});
