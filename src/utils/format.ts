/** 产品代码 → 中文名 */
export const PRODUCT_LABELS: Record<string, string> = {
  rcs: '云服务器',
  rgs: '游戏云',
  router: '路由器',
  ros: '对象存储',
  rvh: '虚拟主机',
  storage: '存储',
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
