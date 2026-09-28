// 扩展版 CDP 助手：可先导航再执行表达式。用法: node cdp-nav.mjs <url|-> <exprFile>
import { readFileSync } from 'node:fs';

const [urlArg, exprFile] = process.argv.slice(2);
if (!urlArg || !exprFile) {
  console.error('usage: node tools/cdp-nav.mjs <url|-> <expr-file>');
  process.exit(1);
}
const expr = readFileSync(exprFile, 'utf8');
const list = await (await fetch('http://127.0.0.1:9333/json')).json();
const page = list.find((t) => t.type === 'page' && t.url.includes('zhihu'));
if (!page) { console.log('no zhihu tab'); process.exit(1); }

const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
let loadWaiter = null;
const send = (method, params) => new Promise((res) => {
  const mid = ++id;
  pending.set(mid, res);
  ws.send(JSON.stringify({ id: mid, method, params }));
});
await new Promise((r) => (ws.onopen = r));
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  else if (m.method === 'Page.loadEventFired' && loadWaiter) { loadWaiter(); loadWaiter = null; }
};
await send('Emulation.setFocusEmulationEnabled', { enabled: true });

if (urlArg !== '-') {
  await send('Page.enable');
  await send('Page.navigate', { url: urlArg });
  await new Promise((res) => { loadWaiter = res; setTimeout(res, 20000); });
  await new Promise((res) => setTimeout(res, 2500));
}

const out = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true, timeout: 9000 });
if (out.result?.exceptionDetails) console.log('EXC:', out.result.exceptionDetails.exception?.description);
else console.log(JSON.stringify(out.result?.result?.value ?? out, null, 1));
process.exit(0);
