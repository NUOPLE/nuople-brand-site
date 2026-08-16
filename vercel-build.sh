#!/usr/bin/env bash
# Vercel 构建脚本
# 1. 编译后端 TypeScript 到 api/_nest/（供 Serverless Function 引用）
# 2. 复制 client/index.html 到项目根目录（Vite 需要 index.html 在 root 下）
# 3. 构建前端到 dist/client/
set -euo pipefail

echo "=== Vercel Build: Server ==="
npx tsc -p tsconfig.vercel.json
echo "Server compiled to api/_nest/"

echo "=== Vercel Build: Prepare index.html ==="
cp client/index.html index.html
echo "index.html prepared"

echo "=== Vercel Build: Client ==="
# Patch root tsconfig files to remove @lark-apaas/fullstack-presets extends
# before vite build — private package not available in Vercel env.
node -e "
const fs = require('fs');
const path = require('path');
const files = ['tsconfig.app.json', 'tsconfig.node.json'];
for (const f of files) {
  const p = path.resolve(process.cwd(), f);
  if (!fs.existsSync(p)) continue;
  const orig = fs.readFileSync(p, 'utf8');
  if (!/\"extends\".*fullstack-presets/.test(orig)) continue;
  fs.writeFileSync(p + '.bak', orig);
  const inline = f === 'tsconfig.app.json'
    ? JSON.stringify({
        compilerOptions: {
          target: 'ES2020', useDefineForClassFields: true,
          lib: ['ES2020', 'DOM', 'DOM.Iterable'], module: 'ESNext',
          skipLibCheck: true, moduleResolution: 'bundler',
          allowImportingTsExtensions: true, resolveJsonModule: true,
          isolatedModules: true, moduleDetection: 'force', noEmit: true,
          jsx: 'react-jsx', strict: false, noUnusedLocals: false,
          noUnusedParameters: false, noImplicitAny: false,
          noFallthroughCasesInSwitch: false, sourceMap: true, allowJs: true,
          strictNullChecks: false, esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          forceConsistentCasingInFileNames: false, incremental: true,
          baseUrl: './',
          paths: {
            '@client/*': ['client/*'], '@shared/*': ['shared/*'],
            '@/*': ['./client/src/*'],
            '@lark-apaas/client-toolkit/tools/*': ['node_modules/@lark-apaas/client-toolkit/lib/apis/tools/*']
          }
        },
        include: ['client/**/*', 'shared/**/*'],
        exclude: ['node_modules','dist','public','source_package','client/src/api/gen']
      }, null, 2) + '\\n'
    : JSON.stringify({
        compilerOptions: {
          target: 'ES2022', lib: ['ES2022'], module: 'commonjs',
          moduleResolution: 'node', skipLibCheck: true,
          esModuleInterop: true, allowSyntheticDefaultImports: true,
          forceConsistentCasingInFileNames: false, resolveJsonModule: true,
          isolatedModules: true, strict: false, noImplicitAny: false,
          strictNullChecks: false, strictBindCallApply: false,
          noFallthroughCasesInSwitch: false, declaration: true,
          removeComments: true, emitDecoratorMetadata: true,
          experimentalDecorators: true, sourceMap: true, outDir: './dist',
          baseUrl: './', incremental: true, preserveWatchOutput: true,
          paths: { '@server/*': ['server/*'], '@shared/*': ['shared/*'] }
        },
        watchOptions: { excludeDirectories: ['node_modules/**'] },
        include: ['server/**/*', 'shared/**/*.ts'],
        exclude: ['node_modules','dist','client','source_package','**/*.spec.ts','**/*.e2e-spec.ts']
      }, null, 2) + '\\n';
  fs.writeFileSync(p, inline);
  console.log('Patched ' + f);
}
"
npx vite build --config vite.standalone.config.ts
echo "Client built to dist/client/"

echo "=== Vercel Build: Cleanup ==="
rm -f index.html
# Restore original tsconfig files after build
node -e "
const fs = require('fs');
const path = require('path');
const files = ['tsconfig.app.json', 'tsconfig.node.json'];
for (const f of files) {
  const bak = path.resolve(process.cwd(), f + '.bak');
  const p = path.resolve(process.cwd(), f);
  if (fs.existsSync(bak)) {
    fs.renameSync(bak, p);
    console.log('Restored ' + f);
  }
}
"

echo "=== Build complete ==="
