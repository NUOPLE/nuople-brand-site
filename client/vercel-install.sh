#!/usr/bin/env bash
# Vercel 安装脚本
# 问题：package.json 的 postinstall 调用 fullstack-cli（妙搭平台私有工具），
#       在外部环境不存在，会导致 npm install 失败。
# 方案：临时移除 postinstall 和 prepare 钩子，安装完依赖后恢复。
set -euo pipefail

cp package.json package.json.bak

node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (pkg.scripts) {
    delete pkg.scripts.postinstall;
    delete pkg.scripts.prepare;
  }
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

npm install

mv package.json.bak package.json
