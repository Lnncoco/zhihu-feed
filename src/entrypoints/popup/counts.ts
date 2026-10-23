// 命中数只服务面板展示：向当前标签页的 content script 请求「本页有几处目标」。
import { COUNTS_MSG, type CountsResponse } from '@/settings/messages';

/** 连续拨开关时只认最后一次响应，避免旧请求覆盖新状态 */
let requestSeq = 0;

export async function loadCounts(tabId: number | undefined): Promise<void> {
  const seq = ++requestSeq;
  if (tabId === undefined) return;

  const visible = [...document.querySelectorAll<HTMLElement>('.hits:not([hidden])')];
  if (!visible.length) return;
  for (const el of visible) {
    if (!el.textContent) el.textContent = '…';
  }

  let counts: CountsResponse | null = null;
  try {
    counts = await chrome.tabs.sendMessage(tabId, { type: COUNTS_MSG });
  } catch {
    // 页面无 content script（未注入或尚未加载完）
  }
  if (seq !== requestSeq) return;

  for (const el of visible) {
    if (!el.isConnected) continue;
    if (!counts) {
      el.textContent = '—';
      el.title = '无法读取当前页目标数';
      el.classList.remove('has');
      continue;
    }
    const total = counts[el.dataset.id ?? ''] ?? 0;
    el.textContent = total > 0 ? `${total} 处` : '无目标';
    el.classList.toggle('has', total > 0);
    el.title = total > 0 ? `本页共 ${total} 处目标` : '本页无该目标';
  }
}
