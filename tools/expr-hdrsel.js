(() => {
  const sels = {
    'Logo': 'header.LeanAppHeaderBar a[aria-label="知乎"]',
    '关注': 'header.LeanAppHeaderBar nav a[href$="/follow"]',
    '推荐': 'header.LeanAppHeaderBar nav a[href="https://www.zhihu.com/"]',
    '热榜': 'header.LeanAppHeaderBar nav a[href$="/hot"]',
    '搜索框': 'header.LeanAppHeaderBar [role="search"]',
    '创作中心': 'header.LeanAppHeaderBar a[href$="/creator"]',
    '通知': 'header.LeanAppHeaderBar button[aria-label$="通知"]',
    '私信': 'header.LeanAppHeaderBar button[aria-label$="私信"]',
    '头像': 'header.LeanAppHeaderBar .AppHeader-profileMenu',
  };
  const out = {};
  for (const [k, s] of Object.entries(sels)) {
    const els = [...document.querySelectorAll(s)];
    out[k] = { n: els.length, txt: els.map((e) => (e.innerText||'').replace(/\s+/g,' ').trim().slice(0,10)),
               w: els.map((e) => Math.round(e.getBoundingClientRect().width)) };
  }
  return out;
})()
