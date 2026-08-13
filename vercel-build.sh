#!/usr/bin/env bash
# Vercel 构建脚本
# 1. 编译后端 TypeScript 到 api/_nest/（供 Serverless Function 引用）
# 2. 构建前端到 dist/client/
set -euo pipefail

echo "=== Vercel Build: Server ==="
npx tsc -p tsconfig.vercel.json
echo "Server compiled to api/_nest/"

echo "=== Vercel Build: Client ==="
npx vite build --config vite.standalone.config.ts
echo "Client built to dist/client/"

echo "=== Build complete ==="
