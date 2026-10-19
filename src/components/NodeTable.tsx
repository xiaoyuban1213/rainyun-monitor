import type { NodeItem } from '../types';
import { formatRelative, productLabel } from '../utils/format';
import { Meter } from './Meter';

interface NodeTableProps {
  nodes: NodeItem[];
  now: number;
  loading: boolean;
}

export function NodeTable({ nodes, now, loading }: NodeTableProps) {
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
            const ageSeconds = node.updatedAt
              ? (now - node.updatedAt) / 1000
              : Number.POSITIVE_INFINITY;
            const stale = ageSeconds > 300;

            return (
              <tr key={node.id}>
                <td className="col-name">
                  <span className="node-name">{node.name}</span>
                  <span className="node-id">{node.id.slice(0, 8)}</span>
                </td>
                <td className="col-product">
                  <span className="pill">{productLabel(node.product)}</span>
                </td>
                <td className="col-status">
                  <span
                    className={`status status--${node.healthy ? 'ok' : 'down'}`}
                  >
                    <span className="status__dot" aria-hidden="true" />
                    {node.healthy ? '运行正常' : '服务中断'}
                  </span>
                </td>
                <td className="col-load">
                  <Meter value={node.cpu} label={`${node.name} CPU`} />
                </td>
                <td className="col-load">
                  <Meter value={node.memory} label={`${node.name} 内存`} />
                </td>
                <td className={`col-updated ${stale ? 'is-stale' : ''}`}>
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
