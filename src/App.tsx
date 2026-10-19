import { useEffect, useMemo, useState } from 'react';
import { Announcements } from './components/Announcements';
import { NodeTable } from './components/NodeTable';
import { StatCards } from './components/StatCards';
import { Toolbar } from './components/Toolbar';
import { useStatusData } from './hooks/useStatusData';
import type { SortKey, StatusFilter } from './types';
import {
  formatClock,
  formatDuration,
  OFFLINE_THRESHOLD_SECONDS,
  resolveNodeState,
} from './utils/format';

const PAGE_SIZE = 20;

export default function App() {
  const {
    nodes,
    events,
    total,
    loading,
    refreshing,
    error,
    lastUpdated,
    now,
    refresh,
  } = useStatusData();

  const [query, setQuery] = useState('');
  const [product, setProduct] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortKey>('cpu');
  const [page, setPage] = useState(1);

  const stats = useMemo(() => {
    let healthy = 0;
    let overload = 0;
    let down = 0;
    for (const node of nodes) {
      const state = resolveNodeState(node.status, node.updatedAt, now);
      if (state === 'ok') healthy += 1;
      else if (state === 'overload') overload += 1;
      else if (state === 'down') down += 1;
    }

    const productCount = new Set(nodes.map((n) => n.product)).size;
    const avgCpu =
      nodes.length > 0
        ? nodes.reduce((sum, n) => sum + n.cpu, 0) / nodes.length
        : 0;
    const avgMemory =
      nodes.length > 0
        ? nodes.reduce((sum, n) => sum + n.memory, 0) / nodes.length
        : 0;

    return { healthy, overload, down, productCount, avgCpu, avgMemory };
  }, [nodes, now]);

  // 进行中事件涉及的节点，用于在表格里标记「事件影响中」
  const affectedNodeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const event of events) {
      if (!event.affect_nodes) continue;
      for (const id of event.affect_nodes.split(',')) {
        const trimmed = id.trim();
        if (trimmed) ids.add(trimmed);
      }
    }
    return ids;
  }, [events]);

  const products = useMemo(() => {
    const counts = new Map<string, number>();
    for (const node of nodes) {
      counts.set(node.product, (counts.get(node.product) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count);
  }, [nodes]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const list = nodes.filter((node) => {
      if (product !== 'all' && node.product !== product) return false;
      if (statusFilter !== 'all') {
        const state = resolveNodeState(node.status, node.updatedAt, now);
        if (state !== statusFilter) return false;
      }
      if (!keyword) return true;
      return (
        node.name.toLowerCase().includes(keyword) ||
        node.id.toLowerCase().includes(keyword)
      );
    });

    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sort) {
        case 'memory':
          return b.memory - a.memory;
        case 'name':
          return a.name.localeCompare(b.name, 'zh-CN');
        case 'updated':
          return b.updatedAt - a.updatedAt;
        case 'cpu':
        default:
          return b.cpu - a.cpu;
      }
    });
    return sorted;
  }, [nodes, product, statusFilter, query, sort, now]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageNodes = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  // 筛选条件变化时回到第一页
  useEffect(() => {
    setPage(1);
  }, [query, product, statusFilter, sort]);

  return (
    <div className="page">
      <div className="glow" aria-hidden="true" />

      <header className="header">
        <div className="brand">
          <span className="brand__logo" aria-hidden="true">
            ◈
          </span>
          <div>
            <h1 className="brand__title">雨云节点监控</h1>
            <p className="brand__subtitle">
              {total > 0 ? `共 ${total} 个节点` : '实时拉取官方状态数据'}
            </p>
          </div>
        </div>

        <div className="header__actions">
          <div className="refresh-meta">
            <span className="refresh-meta__label">
              {refreshing
                ? '正在刷新…'
                : lastUpdated
                  ? `更新于 ${formatClock(lastUpdated)}`
                  : '尚未获取数据'}
            </span>
          </div>
        </div>
      </header>

      {error ? (
        <div className="error" role="alert">
          <span className="error__title">数据获取失败</span>
          <span className="error__message">{error}</span>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => void refresh()}
          >
            重试
          </button>
        </div>
      ) : null}

      <Announcements events={events} />

      <StatCards
        total={nodes.length}
        healthy={stats.healthy}
        overload={stats.overload}
        down={stats.down}
        productCount={stats.productCount}
        avgCpu={stats.avgCpu}
        avgMemory={stats.avgMemory}
      />

      <Toolbar
        query={query}
        onQueryChange={setQuery}
        products={products}
        product={product}
        onProductChange={setProduct}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        sort={sort}
        onSortChange={setSort}
        resultCount={filtered.length}
      />

      <NodeTable
        nodes={pageNodes}
        now={now}
        loading={loading}
        affectedNodeIds={affectedNodeIds}
      />

      {!loading && filtered.length > 0 ? (
        <nav className="pagination" aria-label="分页">
          <button
            type="button"
            className="button button--ghost"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
          >
            上一页
          </button>
          <span className="pagination__info">
            第 {currentPage} / {pageCount} 页
            <span className="pagination__sep">·</span>
            每页 {PAGE_SIZE} 条
          </span>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={currentPage >= pageCount}
          >
            下一页
          </button>
        </nav>
      ) : null}

      <footer className="footer">
        <span>
          数据来源：
          <a
            href="https://www.rainyun.com/status"
            target="_blank"
            rel="noreferrer"
          >
            雨云节点监控
          </a>
          （接口 api.v2.rainyun.com，无需鉴权）
          <span className="footer__sep">·</span>
          判定规则：超过 {OFFLINE_THRESHOLD_SECONDS / 60} 分钟未上报即服务中断
        </span>
        {lastUpdated ? (
          <span className="footer__age">
            快照时间 {formatClock(lastUpdated)}（
            {formatDuration((now - lastUpdated) / 1000)}）
          </span>
        ) : null}
      </footer>
    </div>
  );
}
