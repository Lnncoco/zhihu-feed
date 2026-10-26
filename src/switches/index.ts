import { PAGES, type PageType } from '@/pages';

export interface Anchor {
  selector: string;
}

/** 页面区域，popup 按此分区排列（自上而下的阅读顺序） */
export type Region = 'header' | 'content' | 'sidebar' | 'overlay';

/** 数值型调节项的取值范围；值通过 <html> 上的 --zf-<id> 变量传给 CSS */
export interface RangeSpec {
  min: number;
  max: number;
  step: number;
  default: number;
  unit: string;
}

export interface Switch {
  /** 对应 <html> 上的 data-zf-<id> 属性开关，content.css 规则按此生效 */
  id: string;
  title: string;
  /** 面板紧凑控件（顶栏开关格）的短标签；缺省用 title */
  short?: string;
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
  /** 有值时面板用滑块调节，值存 params 而非布尔 overrides */
  range?: RangeSpec;
}

export const REGION_TITLES: Record<Region, string> = {
  header: '顶栏',
  content: '内容区',
  sidebar: '侧栏',
  overlay: '悬浮',
};

export const REGION_ORDER: Region[] = ['header', 'content', 'sidebar', 'overlay'];

export const SWITCHES: Switch[] = [
  /* ---------- 顶栏：新版 header.LeanAppHeaderBar 逐项独立开关，默认全开 ---------- */
  {
    id: 'hide-logo',
    title: 'Logo',
    short: 'Logo',
    desc: '左上角知乎标识',
    pages: ['home', 'question', 'answer', 'column', 'hot'],
    region: 'header',
    default: false,
    anchors: [{ selector: 'header.LeanAppHeaderBar a[aria-label="知乎"]' }],
  },
  {
    id: 'hdr-nav-follow',
    title: '导航 · 关注',
    short: '关注',
    desc: '顶栏「关注」入口',
    pages: ['home', 'question', 'answer', 'column', 'hot'],
    region: 'header',
    default: false,
    anchors: [{ selector: 'header.LeanAppHeaderBar nav a[href$="/follow"]' }],
  },
  {
    id: 'hdr-nav-recommend',
    title: '导航 · 推荐',
    short: '推荐',
    desc: '顶栏「推荐」入口',
    pages: ['home', 'question', 'answer', 'column', 'hot'],
    region: 'header',
    default: false,
    anchors: [{ selector: 'header.LeanAppHeaderBar nav a[href="https://www.zhihu.com/"]' }],
  },
  {
    id: 'hdr-nav-hotlist',
    title: '导航 · 热榜',
    short: '热榜',
    desc: '顶栏「热榜」入口',
    pages: ['home', 'question', 'answer', 'column', 'hot'],
    region: 'header',
    default: false,
    anchors: [{ selector: 'header.LeanAppHeaderBar nav a[href$="/hot"]' }],
  },
  {
    id: 'hdr-search',
    title: '搜索框',
    short: '搜索',
    desc: '搜索输入框与提问入口',
    pages: ['home', 'question', 'answer', 'column', 'hot'],
    region: 'header',
    default: false,
    anchors: [{ selector: 'header.LeanAppHeaderBar [role="search"]' }],
  },
  {
    id: 'hdr-creator',
    title: '创作中心入口',
    short: '创作',
    desc: '顶栏「创作中心」',
    pages: ['home', 'question', 'answer', 'column', 'hot'],
    region: 'header',
    default: false,
    anchors: [{ selector: 'header.LeanAppHeaderBar a[href$="/creator"]' }],
  },
  {
    id: 'hdr-notify',
    title: '通知',
    short: '通知',
    desc: '通知按钮（含未读数）',
    pages: ['home', 'question', 'answer', 'column', 'hot'],
    region: 'header',
    default: false,
    anchors: [{ selector: 'header.LeanAppHeaderBar button[aria-label$="通知"]' }],
  },
  {
    id: 'hdr-dm',
    title: '私信',
    short: '私信',
    desc: '私信按钮（含未读数）',
    pages: ['home', 'question', 'answer', 'column', 'hot'],
    region: 'header',
    default: false,
    anchors: [{ selector: 'header.LeanAppHeaderBar button[aria-label$="私信"]' }],
  },
  {
    id: 'hdr-avatar',
    title: '用户头像',
    short: '头像',
    desc: '头像与个人菜单',
    pages: ['home', 'question', 'answer', 'column', 'hot'],
    region: 'header',
    default: false,
    anchors: [{ selector: 'header.LeanAppHeaderBar .AppHeader-profileMenu' }],
  },

  /* ---------- 内容区 ---------- */
  {
    id: 'hide-write-area',
    title: '快速分享',
    desc: '信息流顶部的发帖卡',
    pages: ['home'],
    region: 'content',
    default: true,
    anchors: [{ selector: '.WriteArea' }],
  },
  {
    id: 'hide-more-answers',
    title: '更多回答',
    desc: '只保留当前回答',
    pages: ['answer'],
    region: 'content',
    default: true,
    anchors: [{ selector: '.MoreAnswers' }, { selector: '.ViewAll' }],
  },
  {
    id: 'clean-question-header',
    title: '问题头按钮',
    desc: '关注/写回答/邀请等操作按钮',
    pages: ['question', 'answer'],
    region: 'content',
    default: true,
    anchors: [{ selector: '.QuestionButtonGroup' }],
  },
  {
    id: 'read-typography',
    title: '阅读排版',
    desc: '大字 17px / 1.76 行高，段距加大',
    pages: ['question', 'answer', 'column'],
    region: 'content',
    default: true,
    anchors: [
      { selector: '.RichContent-inner' },
      { selector: '.Post-RichText' },
    ],
    segments: { off: '小字', on: '大字' },
  },
  {
    id: 'limit-image-width',
    title: '图片宽度',
    desc: '正文与文章封面最大宽度，超出按比例缩小',
    pages: ['home', 'question', 'answer', 'column', 'hot'],
    region: 'content',
    // 参数默认即生效；上限 720px 不小于正文列 704px，拖到最大等价于不限制
    default: true,
    anchors: [
      {
        selector:
          '.RichContent-inner img, .RichText img, .QuestionRichText img, .Post-RichText img',
      },
      {
        selector:
          '.ContentItem.ArticleItem .RichContent > div > div > img[width="100%"][height="100%"]',
      },
    ],
    range: { min: 160, max: 720, step: 20, default: 320, unit: 'px' },
  },
  {
    id: 'read-action-bar',
    title: '底部操作条',
    desc: '文末吸底的赞同/评论/分享条',
    pages: ['column'],
    region: 'content',
    // 默认跟随知乎原生吸底显示；点暗才隐藏（2026-10-23 用户定案：操作条默认应在底部）
    default: false,
    anchors: [{ selector: '.RichContent-actions.Sticky' }],
  },

  /* ---------- 侧栏：左右各一个总开关，右侧栏可逐卡关闭 ---------- */
  {
    id: 'hide-left-nav',
    title: '左侧导航',
    desc: '左侧图标导航栏',
    pages: ['home', 'question', 'answer', 'column', 'hot'],
    region: 'sidebar',
    default: true,
    anchors: [{ selector: 'aside:has(nav)' }],
  },
  {
    id: 'hide-right-sidebar',
    title: '右侧栏',
    desc: '整栏收起，主列按自然宽居中',
    pages: ['home', 'question', 'answer', 'column', 'hot'],
    region: 'sidebar',
    default: true,
    anchors: [
      { selector: '.Topstory-container > :not(.Topstory-mainColumn)' },
      { selector: '.Question-sideColumn' },
      {
        selector:
          '.Post-content > div > div:has(.Card.AuthorCard), .Post-content > div > div:has(.HotSearchCard)',
      },
    ],
  },
  {
    id: 'hide-creator-center',
    title: '创作中心',
    desc: '侧栏创作数据卡',
    pages: ['home', 'hot'],
    region: 'sidebar',
    default: true,
    anchors: [{ selector: '.CreatorEntrance' }],
    suppressedBy: 'hide-right-sidebar',
  },
  {
    id: 'hide-hot-search',
    title: '大家都在搜',
    desc: '侧栏热词卡',
    pages: ['home', 'question', 'answer', 'column', 'hot'],
    region: 'sidebar',
    default: true,
    anchors: [{ selector: '.HotSearchCard' }],
    suppressedBy: 'hide-right-sidebar',
  },
  {
    id: 'hide-salt-promo',
    title: '盐言投稿推广',
    desc: '侧栏盐选推广卡',
    pages: ['home', 'hot'],
    region: 'sidebar',
    default: true,
    anchors: [{ selector: '.Card:has(> .New-KfeCollection-CreateSaltCard)' }],
    suppressedBy: 'hide-right-sidebar',
  },
  {
    id: 'hide-recommended-users',
    title: '推荐关注',
    desc: '侧栏推荐关注卡',
    pages: ['home', 'hot'],
    region: 'sidebar',
    default: true,
    anchors: [{ selector: '.Card:has(> div > svg.ZDI--UserPlusFill24)' }],
    suppressedBy: 'hide-right-sidebar',
  },
  {
    id: 'hide-answer-author',
    title: '作者卡',
    desc: '侧栏「关于作者」',
    pages: ['answer', 'column'],
    region: 'sidebar',
    default: true,
    anchors: [
      { selector: '.TShapeAnswerAuthor' },
      { selector: '.Card.AuthorCard[aria-label="关于作者"]' },
    ],
    suppressedBy: 'hide-right-sidebar',
  },

  /* ---------- 悬浮元素 ---------- */
  {
    id: 'hide-ads',
    title: '广告位',
    desc: '侧栏图卡、信息流与正文广告',
    pages: ['home', 'question', 'answer', 'column', 'hot'],
    region: 'overlay',
    default: true,
    anchors: [
      { selector: '.Pc-card' },
      { selector: '.Question-sideColumnAdContainer' },
      { selector: '.pc-ylh-ad-shell' },
    ],
  },
  {
    id: 'hide-corner-buttons',
    title: '悬浮按钮',
    desc: '右下角「看山」等浮钮，保留回到顶部',
    pages: ['home', 'question', 'answer', 'column', 'hot'],
    region: 'overlay',
    default: true,
    anchors: [{ selector: '.CornerButtons > div:not(:has(> button[aria-label="回到顶部"]))' }],
  },
];

/** 按 id 查开关：resolve 与 popup 共用，避免各自维护一份索引 */
export const SWITCHES_BY_ID: ReadonlyMap<string, Switch> = new Map(
  SWITCHES.map((s) => [s.id, s]),
);

/** 五类页面全覆盖的开关进入面板左列「全站通用」 */
export function isGlobalSwitch(s: Switch): boolean {
  return PAGES.every((p) => s.pages.includes(p.id));
}

/** 隐藏/收起类开关：参与亮暗与「已隐藏」计数；排版与尺寸调节项不计入 */
export function isHideLike(s: Switch): boolean {
  return !s.segments && !s.range;
}
