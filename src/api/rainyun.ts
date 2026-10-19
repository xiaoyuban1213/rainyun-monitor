import type { NodeItem, RawNode, ServiceEvent, StatusResponse } from '../types';

const API_BASE: string =
  (import.meta.env.VITE_RAINYUN_API_BASE as string | undefined) ??
  'https://api.v2.rainyun.com';

/** 接口单页上限为 100，超过会被服务端截断 */
const PER_PAGE = 100;
/** 防御性上限，避免接口异常时无限翻页 */
const MAX_PAGES = 30;
/** 单次请求超时：卡住时要能失败，否则界面会永远停在「正在刷新」 */
const REQUEST_TIMEOUT_MS = 15_000;

function buildUrl(page: number): string {
  const options = encodeURIComponent(
    JSON.stringify({ page, perpage: PER_PAGE }),
  );
  return `${API_BASE}/status?options=${options}`;
}

/**
 * 接口字段并不总是数字：`UpdateTime` 就是字符串，其余字段也可能变化。
 * 统一走 Number() 再校验，避免 `Number.isFinite('0.04') === false`
 * 导致负载被静默当成 0。
 */
function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function fetchPage(page: number): Promise<StatusResponse> {
  let res: Response;
  try {
    res = await fetch(buildUrl(page), {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      // 只做超时中止，不与组件生命周期绑定：StrictMode 的模拟卸载不会把它掐断
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    if (
      err instanceof DOMException &&
      (err.name === 'TimeoutError' || err.name === 'AbortError')
    ) {
      throw new Error(
        `请求超时（${REQUEST_TIMEOUT_MS / 1000} 秒），请检查网络或代理`,
      );
    }
    throw err;
  }

  if (!res.ok) {
    throw new Error(`接口请求失败：HTTP ${res.status}`);
  }

  const json = (await res.json()) as StatusResponse;
  if (json.code !== 200 || !json.data) {
    throw new Error(json.message || `接口返回异常（code ${json.code}）`);
  }
  return json;
}

export interface StatusSnapshot {
  nodes: NodeItem[];
  events: ServiceEvent[];
  total: number;
  fetchedAt: number;
}

export async function fetchStatus(): Promise<StatusSnapshot> {
  const first = await fetchPage(1);
  const total = first.data.TotalRecords ?? 0;
  const pages = Math.min(MAX_PAGES, Math.max(1, Math.ceil(total / PER_PAGE)));
  if (total > pages * PER_PAGE) {
    console.warn(
      `[rainyun] 节点总数 ${total} 超过单次可拉取上限 ${pages * PER_PAGE}，已截断`,
    );
  }

  const rest =
    pages > 1
      ? await Promise.all(
          Array.from({ length: pages - 1 }, (_, i) => fetchPage(i + 2)),
        )
      : [];

  const rawNodes: RawNode[] = [
    ...(first.data.Records ?? []),
    ...rest.flatMap((r) => r.data.Records ?? []),
  ];

  // 去重，防止翻页期间数据变动导致重复行
  const seen = new Set<string>();
  const nodes: NodeItem[] = [];
  for (const raw of rawNodes) {
    if (seen.has(raw.UUID)) continue;
    seen.add(raw.UUID);

    const updatedAt = toNumber(raw.UpdateTime) * 1000;
    nodes.push({
      id: raw.UUID,
      name: raw.ChineseName || raw.UUID,
      product: raw.Product || 'unknown',
      cpu: toNumber(raw.CPU),
      memory: toNumber(raw.Memory),
      netOut: toNumber(raw.NetOut),
      updatedAt,
      status: raw.Status || 'unknown',
    });
  }

  return {
    nodes,
    events: first.data.OngoingServiceEvents ?? [],
    total,
    fetchedAt: Date.now(),
  };
}
