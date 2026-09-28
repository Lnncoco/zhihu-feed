(() => {
  const sels = {
    '关注': '.AppHeader a[href$="/follow"]',
    '推荐': '.AppHeader a[href="https://www.zhihu.com/"]',
    '热榜': '.AppHeader a[href$="/hot"]',
    '专栏': '.AppHeader a[href$="/column-square"]',
    '圈子': '.AppHeader a[href$="/ring-feeds"]',
    'AIWorks': '.AppHeader a[href$="/project-square"]',
    '故事': '.AppHeader a[href$="/vip-web"]',
    '直答': '.AppHeader a[href="https://zhida.zhihu.com/"]',
    '搜索框': '.AppHeader .SearchBar-tool',
    '提问': '.AppHeader .SearchBar-askContainer',
    '创作中心': '.AppHeader a[href$="/creator"]',
    '通知': '.AppHeader button[aria-label$="通知"]',
    '私信': '.AppHeader button[aria-label$="私信"]',
    '头像': '.AppHeader .AppHeader-profileMenu',
    '吸顶父层': 'div:has(> .AppHeader)',
  };
  const out = {};
  for (const [k, s] of Object.entries(sels)) {
    const els = [...document.querySelectorAll(s)];
    out[k] = { n: els.length, txt: els.map((e) => (e.innerText||'').replace(/\s+/g,' ').trim().slice(0,10)),
               w: els.map((e) => Math.round(e.getBoundingClientRect().width)) };
  }
  return out;
})()
