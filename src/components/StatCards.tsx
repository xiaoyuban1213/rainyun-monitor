import { formatPercent } from '../utils/format';

interface StatCardsProps {
  total: number;
  healthy: number;
  down: number;
  productCount: number;
  avgCpu: number;
  avgMemory: number;
  staleCount: number;
}

export function StatCards({
  total,
  healthy,
  down,
  productCount,
  avgCpu,
  avgMemory,
  staleCount,
}: StatCardsProps) {
  const healthyRate = total > 0 ? (healthy / total) * 100 : 0;

  return (
    <section className="stats" aria-label="总览统计">
      <article className="stat-card">
        <span className="stat-card__label">节点总数</span>
        <strong className="stat-card__value">{total}</strong>
        <span className="stat-card__foot">
          覆盖 {productCount} 类产品
        </span>
      </article>

      <article className="stat-card stat-card--ok">
        <span className="stat-card__label">运行正常</span>
        <strong className="stat-card__value">{healthy}</strong>
        <span className="stat-card__foot">
          可用率 {formatPercent(healthyRate)}
        </span>
      </article>

      <article className={`stat-card ${down > 0 ? 'stat-card--bad' : ''}`}>
        <span className="stat-card__label">服务中断</span>
        <strong className="stat-card__value">{down}</strong>
        <span className="stat-card__foot">
          {down > 0 ? '存在异常节点，请关注' : '当前无异常节点'}
        </span>
      </article>

      <article className="stat-card">
        <span className="stat-card__label">平均负载</span>
        <strong className="stat-card__value stat-card__value--split">
          {formatPercent(avgCpu)}
          <span className="stat-card__divider">/</span>
          {formatPercent(avgMemory)}
        </strong>
        <span className="stat-card__foot">
          CPU / 内存
          {staleCount > 0 ? ` · ${staleCount} 个节点数据偏旧` : ''}
        </span>
      </article>
    </section>
  );
}
