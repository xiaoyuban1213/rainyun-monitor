import type { NodeItem, RawNode, ServiceEvent, StatusResponse } from '../types';

const API_BASE: string =
  (import.meta.env.VITE_RAINYUN_API_BASE as string | undefined) ??
  'https://api.v2.rainyun.com';

/** 接口单页上限为 100，超过会被服务端截断 */
const PER_PAGE = 100;
/** 防御性上限，避免接口异常时无限翻页 */
const MAX_PAGES = 30;

function buildUrl(page: number): string {
  const options = encodeURIComponent(
    JSON.stringify({ page, perpage: PER_PAGE }),
  );
  return `${API_BASE}/status?options=${options}`;
}

async function fetchPage(page: number): Promise<StatusResponse> {
  const res = await fetch(buildUrl(page), {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });

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

    const updatedAt = Number(raw.UpdateTime) * 1000;
    nodes.push({
      id: raw.UUID,
      name: raw.ChineseName || raw.UUID,
      product: raw.Product || 'unknown',
      cpu: Number.isFinite(raw.CPU) ? raw.CPU : 0,
      memory: Number.isFinite(raw.Memory) ? raw.Memory : 0,
      netOut: Number.isFinite(raw.NetOut) ? raw.NetOut : 0,
      updatedAt: Number.isFinite(updatedAt) ? updatedAt : 0,
      status: raw.Status || 'unknown',
      healthy: (raw.Status || '').toLowerCase() === 'ok',
    });
  }

  return {
    nodes,
    events: first.data.OngoingServiceEvents ?? [],
    total,
    fetchedAt: Date.now(),
  };
}
