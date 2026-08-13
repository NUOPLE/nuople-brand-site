# Vercel 部署指南

## 架构说明

- **前端**：React SPA 静态资源部署到 Vercel Edge
- **后端**：NestJS API 通过 Vercel Serverless Function 运行
  - 入口文件：`api/[...slug].js`（Vercel 自动检测为 catch-all function）
  - 后端编译产物：`api/_nest/`（构建时生成，Vercel 自动打包进 function）
- **数据库**：Supabase PostgreSQL（连接串通过 `DATABASE_URL` 环境变量配置）
- **认证**：JWT Bearer Token（密钥通过 `JWT_SECRET` 环境变量配置）
- **图片**：URL 手动输入（Vercel Serverless 无持久化文件存储）

## 环境变量

在 Vercel 项目后台的 Environment Variables 中配置：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DATABASE_URL` | Supabase PostgreSQL 连接串 | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | JWT 签名密钥（请使用随机字符串） | `your-random-secret-key` |
| `NODE_ENV` | 运行环境 | `production` |

> 注意：Vercel 的环境变量需要在部署前配置好，重新部署后生效。

## 部署步骤

### 1. 准备数据库

在 Supabase 中建表。使用项目中的初始化 SQL：

```bash
psql "postgresql://user:pass@host:5432/db" < server/database/init.sql
```

初始化脚本包含：admin、work、message、keyword_rule、site_setting 表，以及默认管理员账号（admin / admin123）。

### 2. 导入代码仓库

在 Vercel 点击 **Add New → Project**，选择你的 Git 仓库。

### 3. 配置项目

Vercel 会自动读取根目录的 `vercel.json`：

- **Framework Preset**: Other
- **Build Command**: `npx tsc -p tsconfig.vercel.json && npx vite build --config vite.standalone.config.ts`
- **Output Directory**: `dist/client`
- **Install Command**: `npm install`

> 以上配置已在 `vercel.json` 中声明，通常不需要手动改。

### 4. 添加环境变量

在 **Project Settings → Environment Variables** 中添加：
- `DATABASE_URL`
- `JWT_SECRET`

### 5. 点击 Deploy

等待构建完成。构建流程：
1. `npm install` 安装依赖
2. `tsc -p tsconfig.vercel.json` 编译后端到 `api/_nest/`
3. `vite build` 构建前端到 `dist/client/`
4. Vercel 自动检测 `api/[...slug].js` 并打包为 Serverless Function

## 关键文件

| 文件 | 作用 |
|------|------|
| `api/[...slug].js` | Vercel Serverless Function 入口，转发所有 /api/* 请求到 NestJS |
| `api/_nest/paths.js` | 运行时路径别名解析（@server、@shared → 实际路径） |
| `vercel.json` | Vercel 部署配置 |
| `tsconfig.vercel.json` | 后端 TypeScript 编译配置（CommonJS，输出到 api/_nest/） |
| `vite.standalone.config.ts` | 前端 Vite 配置（输出到 dist/client） |
| `server/standalone.module.ts` | NestJS 独立部署 AppModule |
| `server/database/connection.ts` | Drizzle ORM + postgres 驱动（从 DATABASE_URL 读取） |
| `server/modules/auth/auth.service.ts` | JWT 认证（从 JWT_SECRET 读取） |

## 路由规则

| 路径 | 处理 |
|------|------|
| `/api/*` | 转发到 NestJS Serverless Function (`api/[...slug].js`) |
| 静态资源 (`/assets/*`、图片等) | Vercel 静态托管（来自 `dist/client`） |
| 其他路径 | 前端 SPA，回退到 `index.html` |

## 调试

### 查看函数日志

Vercel 后台 → Functions → 选择 `api/[...slug]` → 查看实时日志。

### 本地测试 Serverless Function

```bash
# 编译后端
npx tsc -p tsconfig.vercel.json

# 用 node 直接加载测试
node -e "
const handler = require('./api/[...slug].js');
// handler 是一个 (req, res) => Promise<void> 函数
// 可以用 http.createServer(handler) 本地测试
"
```

### 常见问题

**Q: 部署后 API 返回 500**
- 检查 `DATABASE_URL` 是否配置正确
- 检查 Supabase 数据库是否允许 Vercel 的 IP 访问（建议设为 0.0.0.0/0）
- 查看 Vercel Functions 日志

**Q: 冷启动慢**
- Serverless 函数首次调用有 1-3 秒冷启动，正常现象
- Pro 计划可配置 cron 定时触发保活

**Q: 数据库连接耗尽**
- Serverless 每次调用可能新建连接
- 建议使用 Supabase 的 Connection Pooler（PgBouncer）
- 连接串改为 Pooler 地址（端口 6543）

**Q: 图片上传功能不可用**
- Vercel Serverless 环境没有持久化文件存储
- 已改为手动输入图片 URL
- 如需上传功能，推荐接入：Vercel Blob、Supabase Storage、Cloudflare R2、AWS S3

## 注意事项

1. `api/_nest/` 是构建产物，不要手动修改，也不需要提交到 Git（已被 .gitignore 忽略）
2. 每次 Vercel 构建时会重新生成 `api/_nest/`
3. 后端运行时依赖必须在 `dependencies` 中（不是 `devDependencies`）
4. `@lark-apaas/fullstack-nestjs-core` 在 Serverless 环境不使用，独立部署使用标准 NestJS + Drizzle
