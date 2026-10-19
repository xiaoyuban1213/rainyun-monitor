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
  const [overloadValue, overloadBusy] = useAnimatedNumber(overload);
  const [downValue, downBusy] = useAnimatedNumber(down);
  const [cpuValue, cpuBusy] = useAnimatedNumber(avgCpu);
  const [memoryValue, memoryBusy] = useAnimatedNumber(avgMemory);

  const busy =
    totalBusy ||
    healthyBusy ||
    overloadBusy ||
    downBusy ||
    cpuBusy ||
    memoryBusy;

  const ratio = (value: number) =>
    totalValue > 0 ? (value / totalValue) * 100 : 0;

  // 正常 + 阻塞 + 中断 之外的节点（Status 是未知值），单独补一句，保证总数能对上
  const unknownCount = Math.max(0, total - healthy - overload - down);

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
          {unknownCount > 0 ? ` · ${unknownCount} 个状态未知` : ''}
        </span>
      </article>

      <article className="stat-card stat-card--ok">
        <span className="stat-card__label">运行正常</span>
        <strong className="stat-card__value">
          {Math.round(healthyValue)}
        </strong>
        <span className="stat-card__foot">
          可用率 {formatPercent(ratio(healthyValue))}
        </span>
      </article>

      <article className={`stat-card ${overload > 0 ? 'stat-card--warn' : ''}`}>
        <span className="stat-card__label">运行阻塞</span>
        <strong className="stat-card__value">
          {Math.round(overloadValue)}
        </strong>
        <span className="stat-card__foot">
          {overload > 0
            ? `占 ${formatPercent(ratio(overloadValue))}`
            : '当前无阻塞节点'}
        </span>
      </article>

      <article className={`stat-card ${down > 0 ? 'stat-card--bad' : ''}`}>
        <span className="stat-card__label">服务中断</span>
        <strong className="stat-card__value">{Math.round(downValue)}</strong>
        <span className="stat-card__foot">
          {down > 0
            ? `超过 ${OFFLINE_THRESHOLD_SECONDS / 60} 分钟未上报`
            : '当前无中断节点'}
        </span>
      </article>

      <article className="stat-card">
        <span className="stat-card__label">平均负载</span>
        <strong className="stat-card__value stat-card__value--split">
          {formatPercent(cpuValue)}
          <span className="stat-card__divider">/</span>
          {formatPercent(memoryValue)}
        </strong>
        <span className="stat-card__foot">CPU / 内存</span>
      </article>
    </section>
  );
}
