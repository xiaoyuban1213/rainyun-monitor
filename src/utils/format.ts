import type { NodeState } from '../types';

/** 官方判定阈值：节点超过该时长未上报数据，即视为「服务中断」。
 * 取自状态页前端逻辑 `UpdateTime + 300 > now`。
 */
export const OFFLINE_THRESHOLD_SECONDS = 300;

/** 未超时情况下，状态值对应的展示状态 */
const STATUS_MAP: Record<string, NodeState> = {
  ok: 'ok',
  overload: 'overload',
};

export const STATE_LABELS: Record<NodeState, string> = {
  ok: '运行正常',
  overload: '运行阻塞',
  down: '服务中断',
  unknown: '状态未知',
};

/**
 * 计算节点展示状态：
 * 1. 距最后上报超过 5 分钟 → 服务中断（无论接口里 Status 是什么）
 * 2. 未超时且 Status=ok → 运行正常
 * 3. 未超时且 Status=overload → 运行阻塞
 * 4. 其他值 → 状态未知
 */
export function resolveNodeState(
  status: string,
  updatedAt: number,
  now: number,
): NodeState {
  if (!updatedAt) return 'down';
  if (now - updatedAt > OFFLINE_THRESHOLD_SECONDS * 1000) return 'down';
  return STATUS_MAP[(status || '').toLowerCase()] ?? 'unknown';
}

/** 节点是否处于异常状态（阻塞或中断） */
export function isAbnormal(state: NodeState): boolean {
  return state !== 'ok';
}

/**
 * 产品代码 → 中文名。
 * 状态接口只返回代码（如 rgs / rcs），没有名称字段；这里的中文名来自官方页面
 * 前端硬编码的字典（chunk-common.js），不是我们编的。
 * 未收录的新产品会原样显示为大写代码，并在筛选条里自动出现。
 */
export const PRODUCT_LABELS: Record<string, string> = {
  rcs: '云服务器',
  rgs: '游戏云',
  router: '路由器',
  ros: '对象存储',
  rvh: '虚拟主机',
  storage: '存储',
  rbm: '裸金属物理机',
  rgpu: '显卡云电脑',
  rca: '云应用',
  domain: '域名服务',
  ssl: 'SSL 证书',
  rshop: '软件商店',
};

export function productLabel(code: string): string {
  return PRODUCT_LABELS[code] ?? code.toUpperCase();
}

/** 事件类型 → 中文名 */
export const EVENT_TYPE_LABELS: Record<string, string> = {
  maintain: '维护',
  incident: '故障',
  notice: '公告',
};

export function eventTypeLabel(type: string): string {
  return EVENT_TYPE_LABELS[type] ?? type;
}

/** 事件正文前的引导语，按类型区分 */
const EVENT_BODY_LABELS: Record<string, string> = {
  maintain: '维护内容',
  incident: '故障说明',
  notice: '公告内容',
};

export function eventBodyLabel(type: string): string {
  return EVENT_BODY_LABELS[type] ?? '详情';
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}%`;
}

export function formatDuration(seconds: number): string {
  const diff = Math.max(0, Math.round(seconds));
  if (diff < 5) return '刚刚';
  if (diff < 60) return `${diff} 秒前`;
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  return `${Math.floor(diff / 86400)} 天前`;
}

export function formatRelative(ms: number, now = Date.now()): string {
  if (!ms) return '—';
  return formatDuration((now - ms) / 1000);
}

export function formatClock(ms: number): string {
  if (!ms) return '—';
  return new Date(ms).toLocaleString('zh-CN', { hour12: false });
}

/**
 * 服务事件的时间窗。
 * 没有结束时间时退回「xxx 起」；与开始同一天时省略重复的日期部分。
 */
export function formatEventRange(
  startSeconds: number,
  endSeconds: number,
): string {
  const startMs = startSeconds * 1000;
  if (!startMs) return '—';

  const startText = formatClock(startMs);
  const endMs = endSeconds * 1000;
  if (!endMs) return `${startText} 起`;

  const sameDay =
    new Date(startMs).toDateString() === new Date(endMs).toDateString();
  const endText = sameDay
    ? new Date(endMs).toLocaleTimeString('zh-CN', { hour12: false })
    : formatClock(endMs);

  return `${startText} – ${endText}`;
}

/** 计划结束时间已过，但官方仍把事件挂在「进行中」列表里 */
export function isEventOverdue(endSeconds: number, now: number): boolean {
  return endSeconds > 0 && now > endSeconds * 1000;
}

/**
 * 时长表述，用于「已超出 8 小时 12 分钟」这类句子。
 * 与 formatDuration 的区别是不带「前」字，也不会返回「刚刚」。
 */
export function formatElapsed(seconds: number): string {
  const diff = Math.max(0, Math.round(seconds));
  if (diff < 60) return `${diff} 秒`;
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟`;
  if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    return minutes > 0 ? `${hours} 小时 ${minutes} 分钟` : `${hours} 小时`;
  }
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  return hours > 0 ? `${days} 天 ${hours} 小时` : `${days} 天`;
}

/** 从 HTML 片段中提取纯文本，避免直接注入 innerHTML */
export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** 依据负载给进度条分级 */
export function loadLevel(value: number): 'normal' | 'warn' | 'danger' {
  if (value >= 85) return 'danger';
  if (value >= 60) return 'warn';
  return 'normal';
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}
