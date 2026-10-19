import { clampPercent, formatPercent, loadLevel } from '../utils/format';

interface MeterProps {
  value: number;
  label?: string;
}

export function Meter({ value, label }: MeterProps) {
  const level = loadLevel(value);
  const width = clampPercent(value);

  return (
    <div className="meter" title={label ? `${label} ${formatPercent(value)}` : formatPercent(value)}>
      <div className="meter__track">
        <div
          className={`meter__fill meter__fill--${level}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className={`meter__value meter__value--${level}`}>
        {formatPercent(value)}
      </span>
    </div>
  );
}
