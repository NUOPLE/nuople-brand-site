# 技术方案

## 开发元信息
- 开发模式: 全栈应用
- 涉及层级: [数据库, 服务端, 前端]

## 页面路由与导航

### 页面路由
| 页面 | 路由路径 | 说明 |
|------|----------|------|
| 登录页 | /login | 管理员登录入口，未登录时所有受保护页面重定向至此 |
| 仪表盘 | /dashboard | 后台首页，数据概览与快捷操作 |
| 作品管理 | /works | 作品列表、搜索、筛选、删除 |
| 新增作品 | /works/new | 新增作品表单 |
| 编辑作品 | /works/:id/edit | 编辑作品表单 |
| 留言管理 | /messages | 留言列表、详情、回复、状态管理 |
| 智能客服设置 | /keyword-rules | 关键词规则列表、增删改、排序 |
| 网站内容设置 | /site-settings | 网站各项配置的统一设置页 |

### 导航设计
- 导航机制：页面路由（左侧固定侧边栏导航）
- 导航项：
  - 仪表盘（/dashboard）
  - 作品管理（/works）
  - 留言管理（/messages）
  - 客服设置（/keyword-rules）
  - 网站设置（/site-settings）
  - 退出登录（触发 logout 动作，跳转 /login）

## 数据模型

### 数据库设计

#### 管理员表（admin）
用途：存储后台管理员账号信息，用于登录认证。
核心字段：
- username: varchar (用户名，唯一)
- password_hash: varchar (bcrypt 哈希后的密码)

#### 作品表（work）
用途：存储品牌设计作品的完整信息。
核心字段：
- title: varchar (作品标题)
- category: varchar ['logo', 'vis', 'packaging'] (分类：LOGO设计/品牌形象/包装设计)
- client: varchar (客户名称)
- industry: varchar (所属行业)
- design_type: varchar (设计类型)
- year: varchar (年份)
- description: varchar (一句话描述)
- tags: text[] (标签数组)
- content: text (项目介绍，多段落)
- cover_image: text (列表封面图 URL)
- hero_image: text (详情页 Hero 大图 URL)
- gallery: jsonb (画廊图片数组，每项含 url 和 layout: full/side-by-side)

#### 留言表（message）
用途：存储用户从官网提交的留言信息及管理员回复。
核心字段：
- name: varchar (留言人姓名)
- email: varchar (邮箱)
- content: text (留言内容)
- is_read: boolean default false 是否已读
- reply_content: text (回复内容)
- replied_at: timestamptz (回复时间)

#### 关键词规则表（keyword_rule）
用途：存储智能客服的关键词自动回复规则。
核心字段：
- keywords: text[] (关键词数组，命中任一即触发)
- reply_content: text (回复内容)
- sort_order: integer (排序序号，越小越优先)

#### 网站设置表（site_setting）
用途：键值对存储网站前端展示的所有配置项。
核心字段：
- setting_key: varchar (配置键，唯一)
- setting_value: text (配置值，JSON 字符串或纯文本)

预置数据（初始化时自动插入）：
- admin 表：username='admin', password_hash=bcrypt('admin123')
- site_setting 表：预置所有默认配置项（网站标题、公司名称、服务默认值等）
- keyword_rule 表：空
- work 表：3~5 条示例作品
- message 表：3 条示例留言

## 业务模型

### API 设计

#### 登录认证相关
**页面路径**: /login
**功能全景**：
| 功能 | 实现方式 | 说明 |
|------|----------|------|
| 管理员登录 | API | POST /api/auth/login |
| 获取当前管理员信息 | API | GET /api/auth/me |
| 退出登录 | API | POST /api/auth/logout |
| 登录态检查 | 服务端中间件 | 基于 session/cookie 的认证守卫 |

**所需 API**:
```typescript
// 管理员登录 [领域模型: AdminModel] [对应页面功能: 登录提交]
POST /api/auth/login
Request: { username: string; password: string }
Response: { id: string; username: string }

// 获取当前登录管理员信息 [领域模型: AdminModel] [对应页面功能: 顶部栏用户信息]
GET /api/auth/me
Response: { id: string; username: string }

// 退出登录 [领域模型: AdminModel] [对应页面功能: 退出登录]
POST /api/auth/logout
Response: { success: true }
```

#### 仪表盘相关
**页面路径**: /dashboard
**功能全景**：
| 功能 | 实现方式 | 说明 |
|------|----------|------|
| 获取仪表盘统计数据 | API | GET /api/dashboard/stats |

**所需 API**:
```typescript
// 获取仪表盘统计数据 [领域模型: DashboardStats] [对应页面功能: 数据概览卡片 + 最近留言 + 分类统计]
GET /api/dashboard/stats
Response: {
  totalWorks: number;
  totalMessages: number;
  unreadMessages: number;
  totalKeywordRules: number;
  recentMessages: Array<{ id: string; name: string; content: string; createdAt: string; isRead: boolean }>;
  categoryStats: Array<{ category: string; count: number }>;
}
```

#### 作品管理相关
**页面路径**: /works, /works/new, /works/:id/edit
**功能全景**：
| 功能 | 实现方式 | 说明 |
|------|----------|------|
| 作品列表（分页+搜索+筛选） | API | GET /api/works |
| 作品详情 | API | GET /api/works/:id |
| 新增作品 | API | POST /api/works |
| 编辑作品 | API | PUT /api/works/:id |
| 删除作品 | API | DELETE /api/works/:id |
| 图片上传 | 平台能力 | 前端使用 dataloom.storage 上传，返回 URL 存入作品表 |

**所需 API**:
```typescript
// 作品列表（分页+搜索+分类筛选） [领域模型: WorkModel] [对应页面功能: 作品列表展示、搜索、筛选]
GET /api/works?page=1&pageSize=10&keyword=&category=
Response: {
  items: Array<{
    id: string;
    title: string;
    category: string;
    client: string;
    year: string;
    coverImage: string;
  }>;
  total: number;
}

// 获取作品详情 [领域模型: WorkModel] [对应页面功能: 编辑作品表单预填]
GET /api/works/:id
Response: {
  id: string;
  title: string;
  category: string;
  client: string;
  industry: string;
  designType: string;
  year: string;
  description: string;
  tags: string[];
  content: string;
  coverImage: string;
  heroImage: string;
  gallery: Array<{ url: string; layout: 'full' | 'side-by-side' }>;
}

// 新增作品 [领域模型: WorkModel] [对应页面功能: 新增作品提交]
POST /api/works
Request: {
  title: string;
  category: string;
  client: string;
  industry: string;
  designType: string;
  year: string;
  description: string;
  tags: string[];
  content: string;
  coverImage: string;
  heroImage: string;
  gallery: Array<{ url: string; layout: 'full' | 'side-by-side' }>;
}
Response: { id: string }

// 编辑作品 [领域模型: WorkModel] [对应页面功能: 编辑作品保存]
PUT /api/works/:id
Request: 同 POST /api/works
Response: { success: true }

// 删除作品 [领域模型: WorkModel] [对应页面功能: 删除作品]
DELETE /api/works/:id
Response: { success: true }
```

#### 留言管理相关
**页面路径**: /messages
**功能全景**：
| 功能 | 实现方式 | 说明 |
|------|----------|------|
| 留言列表（分页+状态筛选） | API | GET /api/messages |
| 留言详情 | API | GET /api/messages/:id |
| 标记已读/未读 | API | PATCH /api/messages/:id/read-status |
| 回复留言 | API | POST /api/messages/:id/reply |
| 删除留言 | API | DELETE /api/messages/:id |

**所需 API**:
```typescript
// 留言列表（分页+状态筛选） [领域模型: MessageModel] [对应页面功能: 留言列表展示、状态筛选]
GET /api/messages?page=1&pageSize=10&status=all|unread|read
Response: {
  items: Array<{
    id: string;
    name: string;
    email: string;
    content: string;
    createdAt: string;
    isRead: boolean;
    hasReply: boolean;
  }>;
  total: number;
  totalUnread: number;
}

// 留言详情 [领域模型: MessageModel] [对应页面功能: 查看留言详情]
GET /api/messages/:id
Response: {
  id: string;
  name: string;
  email: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  replyContent: string | null;
  repliedAt: string | null;
}

// 标记已读/未读 [领域模型: MessageModel] [对应页面功能: 标记已读/未读]
PATCH /api/messages/:id/read-status
Request: { isRead: boolean }
Response: { success: true }

// 回复留言 [领域模型: MessageModel] [对应页面功能: 提交回复]
POST /api/messages/:id/reply
Request: { replyContent: string }
Response: { success: true; repliedAt: string }

// 删除留言 [领域模型: MessageModel] [对应页面功能: 删除留言]
DELETE /api/messages/:id
Response: { success: true }
```

#### 关键词规则相关
**页面路径**: /keyword-rules
**功能全景**：
| 功能 | 实现方式 | 说明 |
|------|----------|------|
| 规则列表（按排序号升序） | API | GET /api/keyword-rules |
| 新增规则 | API | POST /api/keyword-rules |
| 编辑规则 | API | PUT /api/keyword-rules/:id |
| 删除规则 | API | DELETE /api/keyword-rules/:id |
| 调整顺序（上移/下移） | API | POST /api/keyword-rules/:id/move |

**所需 API**:
```typescript
// 关键词规则列表 [领域模型: KeywordRuleModel] [对应页面功能: 规则列表展示]
GET /api/keyword-rules
Response: {
  items: Array<{
    id: string;
    keywords: string[];
    replyContent: string;
    sortOrder: number;
  }>;
}

// 新增关键词规则 [领域模型: KeywordRuleModel] [对应页面功能: 新增规则]
POST /api/keyword-rules
Request: { keywords: string[]; replyContent: string }
Response: { id: string }

// 编辑关键词规则 [领域模型: KeywordRuleModel] [对应页面功能: 编辑规则]
PUT /api/keyword-rules/:id
Request: { keywords: string[]; replyContent: string }
Response: { success: true }

// 删除关键词规则 [领域模型: KeywordRuleModel] [对应页面功能: 删除规则]
DELETE /api/keyword-rules/:id
Response: { success: true }

// 调整规则顺序 [领域模型: KeywordRuleModel] [对应页面功能: 上移/下移]
POST /api/keyword-rules/:id/move
Request: { direction: 'up' | 'down' }
Response: { success: true }
```

#### 网站设置相关
**页面路径**: /site-settings
**功能全景**：
| 功能 | 实现方式 | 说明 |
|------|----------|------|
| 获取所有网站设置 | API | GET /api/site-settings |
| 保存网站设置 | API | PUT /api/site-settings |
| 图片上传 | 平台能力 | 前端使用 dataloom.storage 上传 Logo 等图片 |

**所需 API**:
```typescript
// 获取所有网站设置 [领域模型: SiteSettingModel] [对应页面功能: 网站设置页面初始数据]
GET /api/site-settings
Response: {
  siteTitle: string;
  companyName: string;
  logoImage: string;
  heroSlogan: string;
  heroSubtitle: string;
  aboutUs: string;
  services: Array<{ title: string; description: string }>;
  designProcess: Array<{ title: string; description: string }>;
  contact: { phone: string; email: string; address: string };
  footer: { copyright: string; socialLinks: string };
}

// 保存网站设置 [领域模型: SiteSettingModel] [对应页面功能: 保存所有设置]
PUT /api/site-settings
Request: {
  siteTitle: string;
  companyName: string;
  logoImage: string;
  heroSlogan: string;
  heroSubtitle: string;
  aboutUs: string;
  services: Array<{ title: string; description: string }>;
  designProcess: Array<{ title: string; description: string }>;
  contact: { phone: string; email: string; address: string };
  footer: { copyright: string; socialLinks: string };
}
Response: { success: true }
```
