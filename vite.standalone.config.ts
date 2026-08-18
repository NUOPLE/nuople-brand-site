import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  root: path.resolve(__dirname, 'client'),
  plugins: [react(), tailwindcss()],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
      '@client': path.resolve(__dirname, 'client'),
      '@shared': path.resolve(__dirname, 'shared'),
      '@lark-apaas/client-toolkit/components/AppContainer': path.resolve(__dirname, 'client/src/compat/app-container.tsx'),
      '@lark-apaas/client-toolkit/lib/components/AppContainer/index.js': path.resolve(__dirname, 'client/src/compat/app-container.tsx'),
      '@lark-apaas/client-toolkit/components/ErrorRender': path.resolve(__dirname, 'client/src/compat/error-render.tsx'),
      '@lark-apaas/client-toolkit/lib/components/ErrorRender/index.js': path.resolve(__dirname, 'client/src/compat/error-render.tsx'),
      '@lark-apaas/client-toolkit/lib/components/AppContainer/utils/tea.js': path.resolve(__dirname, 'client/src/compat/tea-stub.ts'),
      '@lark-apaas/client-toolkit/components/AppContainer/utils/tea': path.resolve(__dirname, 'client/src/compat/tea-stub.ts'),
      '@lark-apaas/client-toolkit/lib/utils/getInitialInfo.js': path.resolve(__dirname, 'client/src/compat/get-initial-info-stub.ts'),
      '@lark-apaas/client-toolkit/lib/integrations/dataloom.js': path.resolve(__dirname, 'client/src/compat/dataloom-stub.ts'),
      '@lark-apaas/client-toolkit/lib/integrations/getAppInfo.js': path.resolve(__dirname, 'client/src/compat/get-app-info-stub.ts'),
      '@lark-apaas/client-toolkit/lib/utils/getUserProfile.js': path.resolve(__dirname, 'client/src/compat/get-user-profile-stub.ts'),
      '@lark-apaas/client-toolkit/lib/components/AppContainer/utils/getLarkUser.js': path.resolve(__dirname, 'client/src/compat/get-lark-user-stub.ts'),
      '@lark-apaas/client-toolkit/lib/components/AppContainer/utils/observable.js': path.resolve(__dirname, 'client/src/compat/observable-stub.ts'),
      '@lark-apaas/client-toolkit/lib/components/AppContainer/safety.js': path.resolve(__dirname, 'client/src/compat/safety-stub.tsx'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'dist/client'),
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
