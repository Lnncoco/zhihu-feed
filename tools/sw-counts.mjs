const expr = `(async () => {
  const [t] = await chrome.tabs.query({ url: 'https://www.zhihu.com/*' });
  const counts = await chrome.tabs.sendMessage(t.id, { type: 'zf-counts' });
  return { tabId: t.id, url: t.url, counts };
})()`;
const list = await (await fetch('http://127.0.0.1:9333/json')).json();
const sw = list.find((t) => t.type === 'service_worker' && t.url.includes('background.js'));
if (!sw) { console.log('no SW target; targets:', list.map((t) => t.type)); process.exit(1); }
const ws = new WebSocket(sw.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id === 1) { console.log(JSON.stringify(m.result?.result?.value ?? m, null, 1)); process.exit(0); } };
ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: expr, awaitPromise: true, returnByValue: true } }));
