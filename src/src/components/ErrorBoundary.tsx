import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { logger } from '@/utils/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('[ErrorBoundary] Uncaught error:', error);
    logger.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center size-16 rounded-full bg-destructive/10 mb-4">
                <RefreshCw className="size-8 text-destructive" />
              </div>
              <h1 className="text-xl font-semibold text-foreground mb-2">
                页面加载失败
              </h1>
              <p className="text-sm text-muted-foreground mb-6">
                抱歉，页面出现了意外错误。请尝试刷新页面，如果问题持续存在，请联系技术支持。
              </p>
              {this.state.error && process.env.NODE_ENV === 'development' && (
                <div className="text-left bg-accent/50 p-3 rounded-sm mb-4 overflow-auto max-h-40">
                  <p className="text-xs font-mono text-destructive break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              <button
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm rounded-sm hover:opacity-90 transition-opacity"
              >
                <RefreshCw className="size-4" />
                刷新重试
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
