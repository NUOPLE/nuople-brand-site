// 平台兼容 stub，防止妙搭平台全局变量缺失导致白屏
if (typeof window !== 'undefined') {
  const w = window as any;
  w.__platform__ = w.__platform__ || {};
  w.IS_MIAODA_PREVIEW = false;
  w.csrfToken = w.csrfToken || '';
  w.userId = w.userId || '';
  w.tenantId = w.tenantId || '';
  w.appId = w.appId || '';
  w.ENVIRONMENT = w.ENVIRONMENT || 'production';
  w._appInfo = w._appInfo || null;
  w.__BASENAME__ = w.__BASENAME__ || '/';
  w.KSlardarWeb = w.KSlardarWeb || function () {};
  w.__slardarErrBuf = w.__slardarErrBuf || [];
  if (!w.collectEvent) {
    w.collectEvent = function () {};
    w.collectEvent.q = [];
  }
}

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

import { AppContainer } from '@lark-apaas/client-toolkit/components/AppContainer';
import { ErrorRender } from '@lark-apaas/client-toolkit/components/ErrorRender';

import RoutesComponent from './app';
import './index.css';
import { createPortal } from 'react-dom';
import { Toaster } from '@client/src/components/ui/sonner';

const CLIENT_BASE_PATH = process.env.CLIENT_BASE_PATH || '/';

const MainApp = () => {
  return (
    <BrowserRouter basename={CLIENT_BASE_PATH}>
      <AppContainer defaultTheme="light">
        <ErrorBoundary
          fallbackRender={({ error, resetErrorBoundary }) => (
            <ErrorRender
              error={error as Error}
              resetErrorBoundary={resetErrorBoundary}
            />
          )}
        >
          <RoutesComponent />
          {createPortal(<Toaster />, document.body)}
        </ErrorBoundary>
      </AppContainer>
    </BrowserRouter>
  );
};

createRoot(document.getElementById('root')!).render(<MainApp />);
