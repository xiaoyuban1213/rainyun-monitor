import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchStatus } from '../api/rainyun';
import type { NodeItem, ServiceEvent } from '../types';

const AUTO_REFRESH_KEY = 'rainyun-monitor:auto-refresh';

export const REFRESH_OPTIONS = [
  { value: 0, label: '关闭' },
  { value: 30, label: '30 秒' },
  { value: 60, label: '1 分钟' },
  { value: 300, label: '5 分钟' },
] as const;

function readAutoRefresh(): number {
  const raw = localStorage.getItem(AUTO_REFRESH_KEY);
  if (raw === null) return 60;
  const value = Number(raw);
  return REFRESH_OPTIONS.some((o) => o.value === value) ? value : 60;
}

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

  const [autoRefresh, setAutoRefreshState] = useState<number>(readAutoRefresh);
  const [now, setNow] = useState(() => Date.now());

  const taskRef = useRef<Promise<void> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback((): Promise<void> => {
    // 同一时刻只允许一个请求，避免自动刷新与手动刷新叠在一起。
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

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = window.setInterval(() => {
      void load();
    }, autoRefresh * 1000);
    return () => window.clearInterval(timer);
  }, [autoRefresh, load]);

  // 倒计时用的秒级心跳
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [autoRefresh]);

  const setAutoRefresh = useCallback((seconds: number) => {
    setAutoRefreshState(seconds);
    localStorage.setItem(AUTO_REFRESH_KEY, String(seconds));
  }, []);

  const nextRefreshAt =
    autoRefresh && state.lastUpdated
      ? state.lastUpdated + autoRefresh * 1000
      : null;

  const secondsUntilRefresh = nextRefreshAt
    ? Math.max(0, Math.ceil((nextRefreshAt - now) / 1000))
    : null;

  return {
    ...state,
    now,
    autoRefresh,
    setAutoRefresh,
    secondsUntilRefresh,
    refresh: load,
  };
}
