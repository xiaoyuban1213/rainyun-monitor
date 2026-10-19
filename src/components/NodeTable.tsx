import type { NodeItem } from '../types';
import {
  formatClock,
  formatDuration,
  formatRelative,
  OFFLINE_THRESHOLD_SECONDS,
  productLabel,
  resolveNodeState,
  STATE_LABELS,
} from '../utils/format';
import { Meter } from './Meter';

interface NodeTableProps {
  nodes: NodeItem[];
  now: number;
  loading: boolean;
  /** 正在进行中的服务事件所涉及的节点 UUID */
  affectedNodeIds: ReadonlySet<string>;
}

/** View Transitions 要求自定义标识符，UUID 里的字符处理后加上前缀即可 */
function rowTransitionName(id: string): string {
  return `row-${id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

export function NodeTable({
  nodes,
  now,
  loading,
  affectedNodeIds,
}: NodeTableProps) {
  if (loading) {
    return (
      <div className="table-skeleton" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="skeleton-row" />
        ))}
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="empty">
        <p className="empty__title">没有符合条件的节点</p>
        <p className="empty__hint">试试调整搜索关键字或筛选条件。</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="node-table">
        <thead>
          <tr>
            <th scope="col" className="col-name">
              节点
            </th>
            <th scope="col" className="col-product">
              产品
            </th>
            <th scope="col" className="col-status">
              状态
            </th>
            <th scope="col" className="col-load">
              CPU
            </th>
            <th scope="col" className="col-load">
              内存
            </th>
            <th scope="col" className="col-updated">
              数据时间
            </th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((node) => {
            const state = resolveNodeState(node.status, node.updatedAt, now);
            const silentSeconds = node.updatedAt
              ? Math.floor((now - node.updatedAt) / 1000)
              : Number.POSITIVE_INFINITY;
            const affected = affectedNodeIds.has(node.id);

            return (
              <tr
                key={node.id}
                style={{ viewTransitionName: rowTransitionName(node.id) }}
              >
                <td className="col-name">
                  <span className="node-name">
                    {node.name}
                    {affected ? (
                      <span className="pill pill--event">事件影响中</span>
                    ) : null}
                  </span>
                  <span className="node-id">{node.id.slice(0, 8)}</span>
                </td>
                <td className="col-product">
                  <span className="pill">{productLabel(node.product)}</span>
                </td>
                <td className="col-status">
                  <span
                    className={`status status--${state}`}
                    title={
                      state === 'down'
                        ? `已 ${formatDuration(silentSeconds)}未上报数据（阈值 ${OFFLINE_THRESHOLD_SECONDS} 秒）`
                        : STATE_LABELS[state]
                    }
                  >
                    <span className="status__dot" aria-hidden="true" />
                    {STATE_LABELS[state]}
                  </span>
                </td>
                <td className="col-load">
                  <Meter value={node.cpu} label={`${node.name} CPU`} />
                </td>
                <td className="col-load">
                  <Meter value={node.memory} label={`${node.name} 内存`} />
                </td>
                <td
                  className={`col-updated ${state === 'down' ? 'is-stale' : ''}`}
                  title={
                    node.updatedAt
                      ? `最后上报：${formatClock(node.updatedAt)}`
                      : '尚未上报'
                  }
                >
                  {formatRelative(node.updatedAt, now)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
