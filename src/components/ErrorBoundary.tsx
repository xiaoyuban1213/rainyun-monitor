import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * 兜住渲染期异常，避免某个组件报错就把整页刷成白屏。
 * 边界只处理渲染错误，网络错误仍由 useStatusData 的 error 状态展示。
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[rainyun] 渲染异常：', error, info.componentStack);
  }

  render() {
    const { error } = this.state;

    if (!error) return this.props.children;

    return (
      <div className="page">
        <div className="error" role="alert">
          <span className="error__title">页面渲染出错</span>
          <span className="error__message">{error.message}</span>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => window.location.reload()}
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }
}
