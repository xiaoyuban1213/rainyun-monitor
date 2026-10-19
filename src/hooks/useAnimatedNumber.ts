import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../utils/motion';

const DEFAULT_DURATION = 480;

/** easeOutCubic：起步快、收尾稳，和界面里其它过渡的观感一致 */
function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

/**
 * 让数字从旧值平滑过渡到新值。
 * 返回 [当前显示值, 是否正在动画]；首次挂载时从 0 滚上来。
 */
export function useAnimatedNumber(
  target: number,
  duration = DEFAULT_DURATION,
): [number, boolean] {
  const reduced = prefersReducedMotion();
  const [value, setValue] = useState(() => (reduced ? target : 0));
  const [animating, setAnimating] = useState(false);

  const fromRef = useRef(reduced ? target : 0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      fromRef.current = target;
      setValue(target);
      setAnimating(false);
      return;
    }

    const from = fromRef.current;
    if (from === target) {
      setValue(target);
      setAnimating(false);
      return;
    }

    const start = performance.now();
    setAnimating(true);

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const next = from + (target - from) * easeOutCubic(progress);
      setValue(progress < 1 ? next : target);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = target;
        setAnimating(false);
      }
    };

    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      // 中途被打断时，下一次动画从「已经走到的地方」继续，避免跳变
      fromRef.current = value;
    };
    // value 只用于清理阶段，故意不放进依赖，避免每帧重建动画
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return [value, animating];
}
