# NUOPLE 品牌设计公司官网 — 独立部署指南

本项目是一个品牌设计公司官网 + CMS 管理后台的全栈应用，基于 NestJS + React + Drizzle ORM + PostgreSQL 构建。

## 技术栈

- **后端**: NestJS 10 + TypeScript
- **前端**: React 19 + Vite + TailwindCSS 4
- **数据库**: PostgreSQL + Drizzle ORM
- **认证**: JWT (JSON Web Token)
- **文件存储**: 本地文件系统 (uploads/ 目录)

## 环境变量

复制 `.env.example` 为 `.env` 并修改：

| 变量名 | 必须 | 说明 | 默认值 |
|--------|------|------|--------|
| `DATABASE_URL` | ✅ | PostgreSQL 连接字符串 | - |
| `JWT_SECRET` | ✅ | JWT 签名密钥（生产环境请使用强随机字符串） | - |
| `PORT` | - | 服务监听端口 | `3000` |
| `NODE_ENV` | - | 运行环境 | `production` |

## 数据库初始化

首次部署前需要在 PostgreSQL 中执行建表 SQL：

```bash
psql $DATABASE_URL -f scripts/init-db.sql
```

种子数据：
- 默认管理员账号：`admin` / `admin123`
- 预置网站设置和示例作品

## 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 配置数据库
cp .env.example .env
# 编辑 .env 填入 DATABASE_URL

# 3. 初始化数据库
psql $DATABASE_URL -f scripts/init-db.sql

# 4. 启动后端 (端口 3000)
npm run dev:server

# 5. 启动前端 (端口 5173，已配置代理)
npm run dev:client
```

## 构建与运行

```bash
# 构建
npm run build:standalone

# 运行
npm run start:standalone
```

## 部署到 Render

### 方式一：使用 render.yaml

将仓库推送到 GitHub/GitLab，在 Render 中选择 "Blueprint" 导入 `render.yaml`。

### 方式二：手动配置

1. **创建 Web Service**
   - Runtime: Node.js
   - Build Command: `npm install && npm run build:standalone`
   - Start Command: `node dist/server/standalone.js`
   - 环境变量：`DATABASE_URL`、`JWT_SECRET`、`NODE_ENV=production`

2. **创建 PostgreSQL**
   - 创建后将连接字符串填入 Web Service 的 `DATABASE_URL`

3. **初始化数据库**
   - 在 Render Dashboard 中打开 PostgreSQL 的 Shell
   - 执行 `scripts/init-db.sql` 中的 SQL 语句

## 部署到 Koyeb

1. 创建新 Service，选择 Docker/Node.js runtime
2. Build command: `npm install && npm run build:standalone`
3. Run command: `node dist/server/standalone.js`
4. 配置环境变量：`DATABASE_URL`、`JWT_SECRET`、`PORT=3000`
5. 添加 PostgreSQL 数据库（Koyeb Managed Database 或外部）
6. 健康检查路径: `/api/public/site-settings`

## 部署到 Railway

1. 导入仓库，Railway 自动检测 Node.js
2. 添加 PostgreSQL 插件
3. 配置环境变量：`JWT_SECRET`
4. Build command: `npm run build:standalone`
5. Start command: `node dist/server/standalone.js`

## 文件存储说明

上传的图片存储在应用根目录的 `uploads/` 文件夹中，通过 `/uploads/文件名` URL 访问。

**注意**：在 Serverless / 容器化环境中，本地文件存储是**临时**的，容器重启后会丢失。生产环境建议：

- **Render/Railway/Koyeb**: 挂载持久化磁盘 (Disk Volume) 到 `uploads/` 目录
- 或替换为对象存储 (AWS S3 / Cloudflare R2 / Backblaze B2)

## 项目结构

```
├── client/                 # 前端 React 应用
│   └── src/
│       ├── api/            # API 请求封装
│       ├── pages/          # 页面组件
│       ├── components/     # 可复用组件
│       └── hooks/          # 自定义 Hooks
├── server/                 # 后端 NestJS 应用
│   ├── standalone.ts       # 独立部署入口
│   ├── database/           # 数据库 schema + 连接
│   ├── modules/            # 业务模块
│   └── common/             # 共享工具
├── shared/                 # 前后端共享类型
├── uploads/                # 上传文件目录 (运行时生成)
├── scripts/
│   ├── init-db.sql         # 数据库初始化脚本
│   └── build-standalone.sh # 独立构建脚本
├── render.yaml             # Render 部署配置
└── package.json
```

## API 路由

### 公开接口 (无需认证)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/public/works` | 作品列表 |
| GET | `/api/public/works/:id` | 作品详情 |
| GET | `/api/public/works/featured` | 精选作品 |
| GET | `/api/public/site-settings` | 网站设置 |
| GET | `/api/public/keyword-rules` | 关键词规则 |
| POST | `/api/public/messages` | 提交留言 |

### 管理接口 (需 JWT)

请求头: `Authorization: Bearer <token>`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 登录获取 token |
| GET | `/api/auth/me` | 当前用户信息 |
| POST | `/api/auth/logout` | 退出登录 |
| GET/POST/PUT/DELETE | `/api/works` | 作品 CRUD |
| GET/PUT/DELETE | `/api/messages` | 留言管理 |
| GET/POST/PUT/DELETE | `/api/keyword-rules` | 关键词规则 |
| GET/PUT | `/api/site-settings` | 网站设置 |
| POST | `/api/upload/image` | 图片上传 |

## 修改默认密码

首次部署后请立即修改管理员密码。可以在数据库中执行：

```sql
-- 生成新密码哈希 (在 Node.js 中执行)
-- const { pbkdf2Sync, randomBytes } = require('crypto');
-- const salt = randomBytes(16).toString('hex');
-- const hash = pbkdf2Sync('新密码', salt, 10000, 64, 'sha256').toString('hex');
-- const passwordHash = `SALTED_SHA256$${salt}$${hash}`;

UPDATE admin SET password_hash = 'SALTED_SHA256$...$...' WHERE username = 'admin';
```
