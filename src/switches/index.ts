import type { PageType } from '@/pages';

export interface Anchor {
  selector: string;
  /** verified = 2026-09 经 CDP 在登录态页面实测命中；unverified = 待浮层实际出现时收敛 */
  status: 'verified' | 'unverified';
}

/** 页面区域，popup 按此分区排列（自上而下的阅读顺序） */
export type Region = 'header' | 'content' | 'sidebar' | 'overlay';

export interface Switch {
  /** 对应 <html> 上的 data-zf-<id> 属性开关，content.css 规则按此生效 */
  id: string;
  title: string;
  desc: string;
  /** 作用的页面类型；SPA 路由变化时 JS 只在匹配页面挂属性，CSS 不再写路由条件 */
  pages: PageType[];
  region: Region;
  default: boolean;
  anchors: Anchor[];
  /** 父开关 id：父在本页生效时，本开关被强制关闭且面板灰显 */
  suppressedBy?: string;
  /** 有值时面板用两态文字切换代替开关（语义直接写在控件上，适用于排版密度这类两可状态） */
  segments?: { off: string; on: string };
}

export const REGION_TITLES: Record<Region, string> = {
  header: '顶栏',
  content: '内容区',
  sidebar: '侧栏',
  overlay: '全局悬浮',
};

export const REGION_ORDER: Region[] = ['header', 'content', 'sidebar', 'overlay'];

export const SWITCHES: Switch[] = [
  {
    id: 'hide-write-area',
    title: '快速分享',
    desc: '信息流顶部的发帖卡',
    pages: ['home'],
    region: 'content',
    default: true,
    anchors: [{ selector: '.WriteArea', status: 'verified' }],
  },
  {
    id: 'hide-creator-center',
    title: '创作中心',
    desc: '侧栏创作数据卡',
    pages: ['home', 'hot'],
    region: 'sidebar',
    default: true,
    anchors: [{ selector: '.CreatorEntrance', status: 'verified' }],
    suppressedBy: 'widen-main-column',
  },
  {
    id: 'hide-hot-search',
    title: '大家都在搜',
    desc: '侧栏热词卡',
    pages: ['home', 'question', 'column', 'hot'],
    region: 'sidebar',
    default: true,
    anchors: [{ selector: '.HotSearchCard', status: 'verified' }],
    suppressedBy: 'widen-main-column',
  },
  {
    id: 'hide-salt-promo',
    title: '盐言投稿推广',
    desc: '侧栏盐选推广卡',
    pages: ['home', 'hot'],
    region: 'sidebar',
    default: true,
    anchors: [{ selector: '.KfeCollection-CreateSaltCard', status: 'verified' }],
    suppressedBy: 'widen-main-column',
  },
  {
    id: 'widen-main-column',
    title: '右侧栏',
    desc: '开启后侧栏收起、正文列居中',
    pages: ['home', 'question', 'answer', 'hot'],
    region: 'sidebar',
    default: true,
    anchors: [
      { selector: '.Topstory-container > :not(.Topstory-mainColumn)', status: 'verified' },
      { selector: '.Question-sideColumn', status: 'verified' },
    ],
  },
  {
    id: 'feed-column-width',
    title: '信息流宽度',
    desc: '信息流列宽 694px，与阅读页同宽',
    pages: ['home'],
    region: 'content',
    default: true,
    anchors: [{ selector: '.Topstory-mainColumn', status: 'verified' }],
  },
  {
    id: 'hide-answer-author',
    title: '作者卡',
    desc: '侧栏「关于作者」',
    pages: ['answer'],
    region: 'sidebar',
    default: true,
    anchors: [{ selector: '.AnswerAuthor', status: 'verified' }],
    suppressedBy: 'widen-main-column',
  },
  {
    id: 'hide-more-answers',
    title: '更多回答',
    desc: '只保留当前回答',
    pages: ['question', 'answer'],
    region: 'content',
    default: true,
    anchors: [
      { selector: '.MoreAnswers', status: 'verified' },
      { selector: '.ViewAll', status: 'verified' },
    ],
  },
  {
    id: 'clean-question-header',
    title: '问题头按钮',
    desc: '关注/写回答/邀请等操作区',
    pages: ['question', 'answer'],
    region: 'content',
    default: true,
    anchors: [
      { selector: '.QuestionButtonGroup', status: 'verified' },
      { selector: '.QuestionFollowStatus', status: 'verified' },
      { selector: '.QuestionHeaderActions', status: 'verified' },
      { selector: '.QuestionHeader-side', status: 'verified' },
    ],
  },
  {
    id: 'hide-logo',
    title: 'Logo',
    desc: '左上角知乎标识',
    pages: ['home', 'question', 'answer', 'column', 'hot'],
    region: 'header',
    default: true,
    suppressedBy: 'hide-answer-header',
    anchors: [{ selector: '.AppHeader a[href="https://www.zhihu.com"]', status: 'verified' }],
  },
  {
    id: 'clean-header',
    title: '顶栏入口',
    desc: '开启后只留 logo，其余全隐藏',
    pages: ['home', 'question', 'column', 'hot'],
    region: 'header',
    default: true,
    anchors: [{ selector: '.AppHeader > div > div', status: 'verified' }],
  },
  {
    id: 'hdr-unstick',
    title: '顶栏吸顶',
    desc: '开启后顶栏随页面滚走',
    pages: ['home', 'question', 'column', 'hot'],
    region: 'header',
    default: true,
    suppressedBy: 'clean-header',
    anchors: [{ selector: 'div:has(> .AppHeader)', status: 'verified' }],
  },
  {
    id: 'hdr-nav-follow',
    title: '导航 · 关注',
    desc: '顶栏「关注」入口',
    pages: ['home', 'question', 'column', 'hot'],
    region: 'header',
    default: true,
    suppressedBy: 'clean-header',
    anchors: [{ selector: '.AppHeader a[href$="/follow"]', status: 'verified' }],
  },
  {
    id: 'hdr-nav-recommend',
    title: '导航 · 推荐',
    desc: '顶栏「推荐」入口',
    pages: ['home', 'question', 'column', 'hot'],
    region: 'header',
    default: false,
    suppressedBy: 'clean-header',
    anchors: [{ selector: '.AppHeader a[href="https://www.zhihu.com/"]', status: 'verified' }],
  },
  {
    id: 'hdr-nav-hotlist',
    title: '导航 · 热榜',
    desc: '顶栏「热榜」入口',
    pages: ['home', 'question', 'column', 'hot'],
    region: 'header',
    default: true,
    suppressedBy: 'clean-header',
    anchors: [{ selector: '.AppHeader a[href$="/hot"]', status: 'verified' }],
  },
  {
    id: 'hdr-nav-column',
    title: '导航 · 专栏',
    desc: '顶栏「专栏」入口',
    pages: ['home', 'question', 'column', 'hot'],
    region: 'header',
    default: true,
    suppressedBy: 'clean-header',
    anchors: [{ selector: '.AppHeader a[href$="/column-square"]', status: 'verified' }],
  },
  {
    id: 'hdr-nav-ring',
    title: '导航 · 圈子',
    desc: '顶栏「圈子」入口',
    pages: ['home', 'question', 'column', 'hot'],
    region: 'header',
    default: true,
    suppressedBy: 'clean-header',
    anchors: [{ selector: '.AppHeader a[href$="/ring-feeds"]', status: 'verified' }],
  },
  {
    id: 'hdr-nav-aiworks',
    title: '导航 · AI Works',
    desc: '顶栏「AI Works」入口',
    pages: ['home', 'question', 'column', 'hot'],
    region: 'header',
    default: true,
    suppressedBy: 'clean-header',
    anchors: [{ selector: '.AppHeader a[href$="/project-square"]', status: 'verified' }],
  },
  {
    id: 'hdr-nav-story',
    title: '导航 · 故事',
    desc: '顶栏「故事」入口',
    pages: ['home', 'question', 'column', 'hot'],
    region: 'header',
    default: true,
    suppressedBy: 'clean-header',
    anchors: [{ selector: '.AppHeader a[href$="/vip-web"]', status: 'verified' }],
  },
  {
    id: 'hdr-search',
    title: '搜索框',
    desc: '搜索输入框与搜索按钮',
    pages: ['home', 'question', 'column', 'hot'],
    region: 'header',
    default: true,
    suppressedBy: 'clean-header',
    anchors: [{ selector: '.AppHeader .SearchBar-tool', status: 'verified' }],
  },
  {
    id: 'hdr-zhida',
    title: '直答',
    desc: '顶栏「直答」AI 入口',
    pages: ['home', 'question', 'column', 'hot'],
    region: 'header',
    default: true,
    suppressedBy: 'clean-header',
    anchors: [{ selector: '.AppHeader a[href="https://zhida.zhihu.com/"]', status: 'verified' }],
  },
  {
    id: 'hdr-ask',
    title: '提问按钮',
    desc: '顶栏「提问」下拉',
    pages: ['home', 'question', 'column', 'hot'],
    region: 'header',
    default: true,
    suppressedBy: 'clean-header',
    anchors: [{ selector: '.AppHeader .SearchBar-askContainer', status: 'verified' }],
  },
  {
    id: 'hdr-creator',
    title: '创作中心入口',
    desc: '顶栏「创作中心」',
    pages: ['home', 'question', 'column', 'hot'],
    region: 'header',
    default: true,
    suppressedBy: 'clean-header',
    anchors: [{ selector: '.AppHeader a[href$="/creator"]', status: 'verified' }],
  },
  {
    id: 'hdr-notify',
    title: '通知',
    desc: '通知按钮（含未读数）',
    pages: ['home', 'question', 'column', 'hot'],
    region: 'header',
    default: true,
    suppressedBy: 'clean-header',
    anchors: [{ selector: '.AppHeader button[aria-label$="通知"]', status: 'verified' }],
  },
  {
    id: 'hdr-dm',
    title: '私信',
    desc: '私信按钮（含未读数）',
    pages: ['home', 'question', 'column', 'hot'],
    region: 'header',
    default: true,
    suppressedBy: 'clean-header',
    anchors: [{ selector: '.AppHeader button[aria-label$="私信"]', status: 'verified' }],
  },
  {
    id: 'hdr-avatar',
    title: '用户头像',
    desc: '头像与个人菜单',
    pages: ['home', 'question', 'column', 'hot'],
    region: 'header',
    default: true,
    suppressedBy: 'clean-header',
    anchors: [{ selector: '.AppHeader .AppHeader-profileMenu', status: 'verified' }],
  },
  {
    id: 'hide-answer-header',
    title: '顶栏',
    desc: '开启后连同 62px 占位一并移除',
    pages: ['answer'],
    region: 'header',
    default: true,
    anchors: [
      { selector: '.AppHeader', status: 'verified' },
      { selector: 'div:has(> .AppHeader) + div:has(+ main)', status: 'verified' },
    ],
  },
  {
    id: 'hide-ads',
    title: '广告位',
    desc: '侧栏图卡、信息流与正文广告',
    pages: ['home', 'question', 'answer', 'column', 'hot'],
    region: 'overlay',
    default: true,
    anchors: [
      { selector: '.Pc-card', status: 'verified' },
      { selector: '.Question-sideColumnAdContainer', status: 'verified' },
      { selector: '.pc-article-answer-big-img', status: 'verified' },
      { selector: '.pc-ylh-ad-shell', status: 'verified' },
    ],
  },
  {
    id: 'hide-app-banner',
    title: '引导浮层',
    desc: '客户端/登录引导提示',
    pages: ['home', 'question', 'answer'],
    region: 'overlay',
    default: true,
    anchors: [
      { selector: '.DownloadApp', status: 'unverified' },
      { selector: '.AppBanner', status: 'unverified' },
      { selector: '.Modal--loginGuide', status: 'unverified' },
    ],
  },
  {
    id: 'hide-corner-buttons',
    title: '悬浮按钮',
    desc: '右下角「看山」等浮钮，保留回到顶部',
    pages: ['home', 'question', 'answer', 'column', 'hot'],
    region: 'overlay',
    default: true,
    anchors: [
      {
        selector: '.CornerButtons > div:not(:has(> button[aria-label="回到顶部"]))',
        status: 'verified',
      },
    ],
  },
  {
    id: 'read-typography',
    title: '阅读排版',
    desc: '大字 17px / 1.76 行高，段距加大',
    pages: ['question', 'answer', 'column'],
    region: 'content',
    default: true,
    anchors: [
      { selector: '.RichContent-inner', status: 'verified' },
      { selector: '.Post-RichText', status: 'verified' },
    ],
    segments: { off: '小字', on: '大字' },
  },
  {
    id: 'read-action-bar',
    title: '底部操作条',
    desc: '开启后收成顶部小胶囊',
    pages: ['answer', 'column'],
    region: 'header',
    default: true,
    anchors: [
      { selector: '.ContentItem-actions.Sticky', status: 'verified' },
      { selector: '.RichContent-actions.Sticky', status: 'verified' },
    ],
  },
];
