import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchStatus } from '../api/rainyun';
import type { NodeItem, ServiceEvent } from '../types';

/** 固定的自动刷新间隔（秒）。界面不再提供调整入口。 */
export const REFRESH_INTERVAL_SECONDS = 30;

export interface StatusDataState {
  nodes: NodeItem[];
  events: ServiceEvent[];
  total: number;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  lastUpdated: number | null;
}

export function useStatusData() {
  const [state, setState] = useState<StatusDataState>({
    nodes: [],
    events: [],
    total: 0,
    loading: true,
    refreshing: false,
    error: null,
    lastUpdated: null,
  });

  const [now, setNow] = useState(() => Date.now());
  const [hidden, setHidden] = useState(() => document.hidden);

  const taskRef = useRef<Promise<void> | null>(null);
  const mountedRef = useRef(true);
  /** 供可见性回调读取最新一次成功刷新的时间，避免把 state 塞进依赖 */
  const lastUpdatedRef = useRef<number | null>(null);

  useEffect(() => {
    lastUpdatedRef.current = state.lastUpdated;
  }, [state.lastUpdated]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback((): Promise<void> => {
    // 同一时刻只允许一个请求，避免自动刷新与手动重试叠在一起。
    // 不使用 AbortController：StrictMode 的模拟卸载会把请求掐断，
    // 导致重新挂载后界面一直停在加载态（结果靠 mountedRef 丢弃即可）。
    if (taskRef.current) return taskRef.current;

    setState((prev) => ({
      ...prev,
      loading: prev.lastUpdated === null,
      refreshing: prev.lastUpdated !== null,
      error: null,
    }));

    let task: Promise<void>;
    task = fetchStatus()
      .then((snapshot) => {
        if (!mountedRef.current) return;
        setState({
          nodes: snapshot.nodes,
          events: snapshot.events,
          total: snapshot.total,
          loading: false,
          refreshing: false,
          error: null,
          lastUpdated: snapshot.fetchedAt,
        });
      })
      .catch((err: unknown) => {
        if (!mountedRef.current) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          refreshing: false,
          error: err instanceof Error ? err.message : '未知错误',
        }));
      })
      .finally(() => {
        // 仅清理自己，避免覆盖之后发起的新请求
        if (taskRef.current === task) taskRef.current = null;
      });

    taskRef.current = task;
    return task;
  }, []);

  // 首次加载
  useEffect(() => {
    void load();
  }, [load]);

  // 跟踪页面可见性：后台标签页没必要继续轮询
  useEffect(() => {
    const onVisibilityChange = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  // 自动刷新：隐藏时暂停；回到前台时若数据已过期，立即补一次
  useEffect(() => {
    if (hidden) return;

    const last = lastUpdatedRef.current;
    const stale =
      last === null || Date.now() - last >= REFRESH_INTERVAL_SECONDS * 1000;
    if (stale) void load();

    const timer = window.setInterval(
      () => void load(),
      REFRESH_INTERVAL_SECONDS * 1000,
    );
    return () => window.clearInterval(timer);
  }, [hidden, load]);

  // 秒级心跳：驱动相对时间与「5 分钟未上报」判定，隐藏时无需空转
  useEffect(() => {
    if (hidden) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [hidden]);

  return {
    ...state,
    now,
    refresh: load,
  };
}
