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
npx vite build --config vite.standalone.config.ts
echo "Client built to dist/client/"

echo "=== Vercel Build: Cleanup ==="
rm -f index.html

echo "=== Build complete ==="
