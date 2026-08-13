# UI 设计指南

> **设计类型**: App 设计（应用架构设计）
> **确认检查**: 本指南适用于可交互的应用/网站/工具。

> ℹ️ Section 1 为设计意图与决策上下文。Code agent 实现时以 Section 2 及之后的具体参数为准。

## 1. Design Archetype (设计原型)

### 1.1 内容理解

- **目标用户**: 品牌设计公司管理员，高频处理作品/留言/配置数据，需高效专注
- **核心目的**: 高效管理内容、快速响应留言、精准配置网站信息
- **情绪基调**: 专业克制 / 避免花哨干扰

### 1.2 设计方向

- **Design Style**: Muji 极简 — 品牌CMS需"隐形"不抢戏，让作品图成为主角；细边框+充裕留白+无阴影营造编辑室质感
- **Application Type**: Admin/SaaS — 左侧导航+右侧内容区的标准后台布局
- **Aesthetic Direction**: 黑白灰为基底，仅未读状态用红色点睛，所有装饰降至最低

## 2. Color System (色彩系统)

**色彩关系**: 纯黑主色 + 暖灰背景 + 白色卡片容器
**配色设计理由**: 品牌CMS需"退后"衬托作品图片，黑白灰最专业且不干扰视觉判断
**主色推导**: 纯黑 `hsl(0 0% 9%)` 作为 primary，呼应"黑色背景白色文字"的明确需求，表达权威与确定感
**使用比例**: 85% 中性灰白 / 10% 纯黑操作元素 / 5% 红色语义提示；primary 仅用于主按钮、激活态、关键标题

### 2.1 主题颜色

| Token                | HSL 值           | 说明                                |
| -------------------- | ---------------- | ----------------------------------- |
| `background`         | hsl(40 5% 97%)   | 暖灰底色，比冷灰更有质感            |
| `card`               | hsl(0 0% 100%)   | 纯白卡片容器                        |
| `foreground`         | hsl(0 0% 9%)     | 主文字，近纯黑                      |
| `muted-foreground`   | hsl(0 0% 45%)    | 次要文字/辅助说明                   |
| `primary`            | hsl(0 0% 9%)     | 主交互色，纯黑                      |
| `primary-foreground` | hsl(0 0% 100%)   | 主交互文字，纯白                    |
| `accent`             | hsl(40 5% 93%)   | hover/focus 反馈背景，极浅暖灰      |
| `accent-foreground`  | hsl(0 0% 9%)     | accent 上的文字                     |
| `border`             | hsl(0 0% 90%)    | 细分隔线/边框                       |

### 2.2 导航区配色

- **基调关系**: 复用主配色系统，侧边栏背景同 `background`，不独立设色
- **关键状态**: 激活项用 `bg-primary text-primary-foreground` 黑底白字标识；hover 用 `bg-accent`
- **边界与背景**: 右侧 1px `border-r border-border` 分隔，非透明

### 2.3 语义颜色

| 用途       | Token              | HSL 值          | 说明                          |
| ---------- | ------------------ | --------------- | ----------------------------- |
| 未读/紧急  | `destructive`      | hsl(0 72% 51%)  | 红点、未读行背景 tint、错误态 |
| 未读行背景 | `destructive/5`    | hsl(0 72% 51%/0.05) | 留言列表未读行浅红底      |
| 成功       | `success`          | hsl(142 76% 36%)| toast 成功提示、保存反馈      |

## 3. Typography (字体排版)

- **Heading**: Inter, "Noto Sans SC", system-ui, sans-serif
- **Body**: Inter, "Noto Sans SC", system-ui, sans-serif
- **数字/标签**: JetBrains Mono, ui-monospace, monospace — 数据统计、年份、关键词规则序号用等宽体增强数据感
- **字体策略**: Inter 提供专业中性基调；中文回退 Noto Sans SC 保证混排对齐；数字场景切换等宽体强化信息密度感知

## 4. Layout Strategy (布局策略)

- **导航意图**: 应用概要设计已声明「左侧固定导航栏 + 顶部标题栏」，原样执行；至多一套全局导航
- **页面架构**: 经典 Sidebar + Topbar + Content 三区布局；内容区 `max-w-[1200px] mx-auto p-6`
- **响应式**: 桌面端完整三区；平板端侧边栏可折叠为图标模式；移动端隐藏侧边栏，Topbar 内嵌汉堡菜单

## 5. Visual Language (视觉语言)

- **形态参数**: 圆角 `rounded-sm (2px)` · 阴影 `shadow-none` · 间距基调 `spacious (p-6/gap-6)`
- **识别签名**: ① 全界面无阴影，仅用 1px border 分隔层级 ② 数据数字用 JetBrains Mono + font-bold 突出 ③ 按钮全直角或微圆角，无 pill 造型
- **装饰策略**: 零装饰；分类标签用 `bg-muted text-muted-foreground rounded-sm px-2 py-0.5 text-xs` 胶囊样式作为唯一图形元素
- **动效原则**: 仅 hover/focus 有 150ms ease 过渡；抽屉/弹窗 200ms slide-in
- **可及性**: 正文对比度 ≥ 7:1（黑/白）；未读红点在浅红底上叠加文字确保可读；所有交互元素有 focus-visible ring

## 6. Component Principles (组件原则)

- **状态完整性**: Button/Input/TableRow 覆盖 Default/Hover/Focus/Disabled；表格行 hover `bg-accent`，focus `ring-2 ring-primary/20`
- **层级清晰**: Primary 按钮 `bg-primary text-primary-foreground`；Secondary 按钮 `border border-border hover:bg-accent`；Danger 操作 `text-destructive hover:bg-destructive/10`
- **一致性**: 所有表单 label `text-sm font-medium text-foreground mb-1.5`；必填星号 `text-destructive ml-0.5`；上传区域统一虚线边框 `border-dashed border-border`

## 7. Image Direction (图片与视觉资产)

- **Image Role**: 无强制图片需求；作品封面由用户上传，系统仅提供占位符
- **Image Art Direction**: 无
- **Image Prompt Keywords**: 无
- **Image Avoidance**: 禁止在登录页/仪表盘/空状态使用通用插画或渐变背景图；保持纯排版驱动

## 8. 应避免 (Anti-patterns)

- ❌ 给卡片加 shadow-md/large 投影 — 本设计靠 border + spacing 建立层级，阴影会破坏极简克制感
- ❌ 使用蓝色/紫色/渐变作为主色调 — 品牌CMS必须中性退后，彩色会干扰用户对作品图的判断
- ❌ 仪表盘添加欢迎横幅/营销插图/装饰性 Hero — 管理员需要直达数据，无需情感铺垫