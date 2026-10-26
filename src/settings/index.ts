// 「用户改了什么值」的唯一实现：storage.sync 权威值 + localStorage 导航快照。
// content script 与 popup 都必须经由本模块读写，禁止各自触碰 chrome.storage。
import { SWITCHES, type RangeSpec } from '@/switches';

const OVERRIDE_KEY = 'overrides';
const PARAM_KEY = 'params';
/** localStorage 键：上次生效的开关/数值快照。localStorage 跨标签共享（sessionStorage 按标签隔离，
 *  新标签首帧读不到会按默认值绘一帧再纠正，即「闪一下」）；document_start 同步读、首绘前 apply */
const SNAPSHOT_KEY = 'zf-overrides-snapshot';
const PARAM_SNAPSHOT_KEY = 'zf-params-snapshot';

export type Overrides = Record<string, boolean>;
/** key=注册了 range 的开关 id，value=用户值；缺省时按注册表默认值 */
export type Params = Record<string, number>;

/** 只保留注册在案的布尔键；已改名/删除的旧键在读取时被丢弃，下次写回自然清除。
 *  数值项不参与布尔层，避免同一个 id 同时存在两种语义。 */
export function sanitizeOverrides(raw: unknown): Overrides {
  const out: Overrides = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const s of SWITCHES) {
    if (s.range) continue;
    const value = (raw as Record<string, unknown>)[s.id];
    if (typeof value === 'boolean') out[s.id] = value;
  }
  return out;
}

function clampToRange(value: number, range: RangeSpec): number {
  const stepped = Math.round((value - range.min) / range.step) * range.step + range.min;
  const clamped = Math.min(range.max, Math.max(range.min, stepped));
  // step 非整数时消除浮点尾数（例如 0.30000000000000004）
  return Number(clamped.toFixed(6));
}

/** 只保留注册了 range 的数值键，并按 min/max/step 收敛 */
export function sanitizeParams(raw: unknown): Params {
  const out: Params = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const s of SWITCHES) {
    if (!s.range) continue;
    const value = (raw as Record<string, unknown>)[s.id];
    if (typeof value !== 'number' || !Number.isFinite(value)) continue;
    out[s.id] = clampToRange(value, s.range);
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

/** sync 通道不可用（企业策略/断网）时返回 {}，调用方按默认值路径降级 */
export async function getParams(): Promise<Params> {
  try {
    return sanitizeParams((await chrome.storage.sync.get(PARAM_KEY))[PARAM_KEY]);
  } catch {
    return {};
  }
}

export function setParams(params: Params): void {
  chrome.storage.sync.set({ [PARAM_KEY]: params });
}

/** 订阅权威数值变化（含其他端写入），回调收到已 sanitize 的值 */
export function onParamsChanged(cb: (params: Params) => void): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes[PARAM_KEY]) {
      cb(sanitizeParams(changes[PARAM_KEY].newValue));
    }
  });
}

export function readParamsSnapshot(): Params | null {
  try {
    const raw = localStorage.getItem(PARAM_SNAPSHOT_KEY);
    return raw ? sanitizeParams(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function writeParamsSnapshot(params: Params): void {
  try {
    localStorage.setItem(PARAM_SNAPSHOT_KEY, JSON.stringify(params));
  } catch {
    /* 无痕模式等写入失败可忽略，最多退回冷启动路径 */
  }
}
