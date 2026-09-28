// 在扩展 service worker 里执行 JS。用法: node tools/cdp-sw.mjs [exprFile]
// 不给 exprFile 时默认查 chrome.scripting 注册表。
import { readFileSync } from 'node:fs';

const exprFile = process.argv[2];
const expr = exprFile
  ? readFileSync(exprFile, 'utf8')
  : `chrome.scripting.getRegisteredContentScripts().then((r) => JSON.stringify(r, null, 1))`;
const list = await (await fetch('http://127.0.0.1:9333/json')).json();
const sw = list.find((t) => t.type === 'service_worker' && t.url.includes('background.js'));
if (!sw) { console.log('no sw target'); process.exit(1); }
const ws = new WebSocket(sw.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const send = (method, params) => new Promise((res) => {
  const mid = ++id;
  pending.set(mid, res);
  ws.send(JSON.stringify({ id: mid, method, params }));
});
await new Promise((r) => (ws.onopen = r));
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
await send('Runtime.enable');
const out = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
console.log(out.result?.result?.value ?? JSON.stringify(out.result?.exceptionDetails ?? out));
process.exit(0);
