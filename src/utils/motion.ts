import { flushSync } from 'react-dom';

/** 用户是否在系统层面要求「减少动态效果」 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * 用 View Transitions 包住一次状态更新，让列表重排有连贯的位移。
 * 浏览器不支持该 API、或用户偏好减少动效时，退回普通更新（行为不变，只是没有动画）。
 */
export function runWithViewTransition(update: () => void): void {
  if (
    typeof document.startViewTransition !== 'function' ||
    prefersReducedMotion()
  ) {
    update();
    return;
  }

  document.startViewTransition(() => {
    // React 的更新是异步的，必须同步提交，否则浏览器截图截到的是旧画面
    flushSync(update);
  });
}
