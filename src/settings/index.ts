// 「用户改了什么值」的唯一实现：storage.sync 权威值 + localStorage 导航快照。
// content script 与 popup 都必须经由本模块读写，禁止各自触碰 chrome.storage。
import { SWITCHES } from '@/switches';

const OVERRIDE_KEY = 'overrides';
/** localStorage 键：上次生效的开关快照。localStorage 跨标签共享（sessionStorage 按标签隔离，
 *  新标签首帧读不到会按默认值绘一帧再纠正，即「闪一下」）；document_start 同步读、首绘前 apply */
const SNAPSHOT_KEY = 'zf-overrides-snapshot';

export type Overrides = Record<string, boolean>;

/** 只保留注册在案的布尔键；已改名/删除的旧键在读取时被丢弃，下次写回自然清除 */
export function sanitizeOverrides(raw: unknown): Overrides {
  const out: Overrides = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const s of SWITCHES) {
    const value = (raw as Record<string, unknown>)[s.id];
    if (typeof value === 'boolean') out[s.id] = value;
  }
  return out;
}

/** sync 通道不可用（企业策略/断网）时返回 {}，调用方按默认值路径降级 */
export async function getOverrides(): Promise<Overrides> {
  try {
    return sanitizeOverrides((await chrome.storage.sync.get(OVERRIDE_KEY))[OVERRIDE_KEY]);
  } catch {
    return {};
  }
}

export function setOverrides(overrides: Overrides): void {
  chrome.storage.sync.set({ [OVERRIDE_KEY]: overrides });
}

/** 订阅权威值变化（含本端与其他端写入），回调收到已 sanitize 的值 */
export function onOverridesChanged(cb: (overrides: Overrides) => void): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes[OVERRIDE_KEY]) {
      cb(sanitizeOverrides(changes[OVERRIDE_KEY].newValue));
    }
  });
}

export function readSnapshot(): Overrides | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    return raw ? sanitizeOverrides(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function writeSnapshot(overrides: Overrides): void {
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(overrides));
  } catch {
    /* 无痕模式等写入失败可忽略，最多退回冷启动路径 */
  }
}
