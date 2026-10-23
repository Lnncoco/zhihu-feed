// 面板↔页面取数协议。现阶段只有 counts 一项，协议增多时再拆独立目录。
export const COUNTS_MSG = 'zf-counts';

/** key=开关 id，value=「本页有几处目标」 */
export type CountsResponse = Record<string, number>;
