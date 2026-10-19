import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import { formatPercent, OFFLINE_THRESHOLD_SECONDS } from '../utils/format';

interface StatCardsProps {
  total: number;
  healthy: number;
  overload: number;
  down: number;
  productCount: number;
  avgCpu: number;
  avgMemory: number;
}

export function StatCards({
  total,
  healthy,
  overload,
  down,
  productCount,
  avgCpu,
  avgMemory,
}: StatCardsProps) {
  const [totalValue, totalBusy] = useAnimatedNumber(total);
  const [healthyValue, healthyBusy] = useAnimatedNumber(healthy);
  const [downValue, downBusy] = useAnimatedNumber(down);
  const [cpuValue, cpuBusy] = useAnimatedNumber(avgCpu);
  const [memoryValue, memoryBusy] = useAnimatedNumber(avgMemory);

  const busy = totalBusy || healthyBusy || downBusy || cpuBusy || memoryBusy;
  const healthyRate =
    totalValue > 0 ? (healthyValue / totalValue) * 100 : 0;

  const downFoot =
    down > 0
      ? `超过 ${OFFLINE_THRESHOLD_SECONDS / 60} 分钟未上报`
      : overload > 0
        ? `${overload} 个节点运行阻塞`
        : '当前无异常节点';

  return (
    <section
      className={`stats ${busy ? 'is-updating' : ''}`}
      aria-label="总览统计"
    >
      <article className="stat-card">
        <span className="stat-card__label">节点总数</span>
        <strong className="stat-card__value">{Math.round(totalValue)}</strong>
        <span className="stat-card__foot">
          覆盖 {productCount} 类产品
        </span>
      </article>

      <article className="stat-card stat-card--ok">
        <span className="stat-card__label">运行正常</span>
        <strong className="stat-card__value">
          {Math.round(healthyValue)}
        </strong>
        <span className="stat-card__foot">
          可用率 {formatPercent(healthyRate)}
        </span>
      </article>

      <article className={`stat-card ${down > 0 ? 'stat-card--bad' : ''}`}>
        <span className="stat-card__label">服务中断</span>
        <strong className="stat-card__value">{Math.round(downValue)}</strong>
        <span className="stat-card__foot">{downFoot}</span>
      </article>

      <article className="stat-card">
        <span className="stat-card__label">平均负载</span>
        <strong className="stat-card__value stat-card__value--split">
          {formatPercent(cpuValue)}
          <span className="stat-card__divider">/</span>
          {formatPercent(memoryValue)}
        </strong>
        <span className="stat-card__foot">
          CPU / 内存
          {overload > 0 ? ` · ${overload} 个节点运行阻塞` : ''}
        </span>
      </article>
    </section>
  );
}
