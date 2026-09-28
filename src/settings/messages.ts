// 面板↔页面取数协议。现阶段只有 counts 一项，协议增多时再拆独立目录。
export const COUNTS_MSG = 'zf-counts';

export interface CountsRequest {
  type: typeof COUNTS_MSG;
}

/** key=开关 id，value=「关掉它本页会露出几处」 */
export type CountsResponse = Record<string, number>;
