# Vercel 部署指南

## 架构说明

- **前端**：React SPA 静态资源部署到 Vercel Edge
- **后端**：NestJS API 通过 Vercel Serverless Function 运行（入口：`api/[...slug].js`）
- **数据库**：Supabase PostgreSQL（连接串通过环境变量配置）
- **认证**：JWT Bearer Token
- **图片**：URL 手动输入（Vercel Serverless 无持久化文件存储）

## 环境变量

在 Vercel 项目后台的 Environment Variables 中配置：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DATABASE_URL` | Supabase PostgreSQL 连接串 | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | JWT 签名密钥（生产环境请使用随机字符串） | `your-random-secret-key` |
| `NODE_ENV` | 运行环境 | `production` |

## 部署步骤

### 1. 准备数据库

确保 Supabase 数据库已建好表结构。可在本地执行：

```bash
export DATABASE_URL="postgresql://..."
psql "$DATABASE_URL" < server/database/init.sql
```

初始化脚本包含：admin 表、work 表、message 表、keyword_rule 表、site_setting 表，以及种子数据（admin/admin123）。

### 2. 连接代码仓库

在 Vercel 中导入 Git 仓库，框架选择 **Other**（手动配置）。

### 3. 配置项目设置

Vercel 会自动读取项目根目录的 `vercel.json`：

- **Build Command**: `npm run build:vercel`
- **Output Directory**: `dist/client`
- **Install Command**: `npm install`

### 4. 配置环境变量

在 Project Settings → Environment Variables 中添加 `DATABASE_URL` 和 `JWT_SECRET`。

### 5. 部署

点击 Deploy，等待构建完成。

## 构建命令说明

```bash
npm run build:vercel
# 等价于：
# npm run build:client && npm run build:server
# - build:client: vite 构建前端到 dist/client
# - build:server: tsc 构建后端到 dist/server（commonjs 格式）
```

## 文件清单

| 文件 | 作用 |
|------|------|
| `api/[...slug].js` | Vercel Serverless Function 入口，转发所有 /api/* 请求到 NestJS |
| `vercel.json` | Vercel 部署配置（构建命令、rewrites、函数超时） |
| `tsconfig.vercel.json` | 服务端构建配置（CommonJS 输出到 dist/server） |
| `server/standalone.module.ts` | 独立部署 AppModule（不依赖平台 SDK） |
| `server/database/connection.ts` | 标准 Drizzle ORM + postgres 驱动 |
| `server/modules/auth/auth.service.ts` | JWT 认证服务 |

## 路由说明

| 路径 | 处理 |
|------|------|
| `/api/*` | 转发到 NestJS Serverless Function |
| `/*` | 前端 SPA，回退到 index.html |

## 注意事项

1. **冷启动**：Serverless Function 首次请求有冷启动延迟（约 1-3 秒），后续请求很快
2. **执行时长**：默认 10s，已配置为 30s（`vercel.json` 中 `maxDuration`）
3. **图片上传**：Vercel Serverless 环境没有持久化存储，图片上传已改为手动输入 URL。如需图片上传功能，推荐接入：
   - **Vercel Blob**：Vercel 官方对象存储
   - **Cloudflare R2** / **AWS S3**：第三方对象存储
   - **Supabase Storage**：与数据库配套
4. **数据库连接**：Serverless 函数每次调用可能新建数据库连接，注意 Supabase 的连接数限制。生产环境建议使用 PgBouncer 或 Supabase 的 Connection Pooler
5. **CORS**：已启用同源 CORS，跨域部署需调整 `standalone.module.ts` 中的 `enableCors` 配置
