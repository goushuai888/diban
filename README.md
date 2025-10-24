# 特斯拉 FSD 权限交易平台

> 安全、便捷的特斯拉 FSD 完全自动驾驶权限担保交易服务

[![Vue 3](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)

---

## 📖 项目简介

本平台致力于为特斯拉车主提供安全、透明的 FSD（Full Self-Driving）完全自动驾驶权限交易服务。支持 FSD 权限的买卖、出租等多种交易方式，平台提供全程担保，确保买卖双方权益。

### 核心功能

- 🛡️ **担保交易**：平台全程担保，资金安全有保障
- ⚡ **极速转移**：专业团队快速处理，FSD 权限转移流程高效便捷
- 💎 **透明定价**：市场化定价机制，买卖双方自由协商，公开透明
- 📱 **响应式设计**：支持桌面端和移动端，随时随地交易
- 🔐 **用户认证**：Supabase 认证系统，安全可靠

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0
- pnpm >= 8.0
- TypeScript ~5.7

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

创建 `.env` 文件并填入以下变量：

```env
# Supabase 配置
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Vercel Blob 存储（可选）
BLOB_READ_WRITE_TOKEN=your_blob_token
```

### 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:5173](http://localhost:5173) 查看应用。

### 构建生产版本

```bash
pnpm build
```

### 预览生产构建

```bash
pnpm preview
```

---

## 🏗️ 技术架构

### 前端技术栈

- **框架**：Vue 3 (Composition API)
- **语言**：TypeScript
- **构建工具**：Vite 6.0
- **样式**：Tailwind CSS 4.0
- **UI 组件库**：Shadcn-Vue (New York 风格)
- **路由**：Vue Router
- **图标**：Lucide Icons

### 后端服务

- **认证**：Supabase Auth
- **数据库**：Supabase PostgreSQL
- **Serverless 函数**：Vercel Functions
- **存储**：Vercel Blob Storage

### 部署平台

- **托管**：Vercel
- **域名**：自定义域名支持
- **CI/CD**：Git 推送自动部署

---

## 📂 项目结构

```
falai-app/
├── src/
│   ├── views/              # 页面组件
│   │   ├── Home.vue        # 首页
│   │   ├── TradingHallPage.vue  # 交易大厅
│   │   ├── LoginPage.vue   # 登录页
│   │   ├── SignUpPage.vue  # 注册页
│   │   └── SettingsPage.vue # 设置页
│   ├── components/         # UI 组件
│   │   ├── ui/            # Shadcn-Vue 基础组件
│   │   ├── Navbar.vue     # 导航栏
│   │   ├── NavbarSheet.vue # 移动端侧边栏
│   │   └── UserMenu.vue   # 用户菜单
│   ├── router/            # 路由配置
│   ├── services/          # 业务服务层
│   │   └── auth.ts       # 认证服务
│   ├── lib/              # 工具库
│   │   ├── supabase.ts   # Supabase 客户端
│   │   └── utils.ts      # 工具函数
│   └── types/            # TypeScript 类型定义
├── api/                  # Vercel Serverless 函数
├── public/               # 静态资源
└── vercel.json          # Vercel 部署配置
```

---

## 🎨 UI 设计

### 设计风格

- **极简黑白配色**：Shadcn-Vue New York 风格
- **专业商务感**：适合金融交易平台
- **响应式布局**：移动端、平板、桌面端完美适配

### 主要页面

1. **首页**：展示平台特色、热门套餐
2. **交易大厅**：FSD 权限交易列表（出售/求购/出租）
3. **个人中心**：用户信息、交易记录
4. **设置页面**：账户设置、安全设置

---

## 🔐 安全特性

- ✅ Supabase Row Level Security (RLS) 数据隔离
- ✅ JWT Token 认证
- ✅ HTTPS 加密传输
- ✅ 密码哈希存储
- ✅ 担保交易机制

---

## 📝 开发规范

### 代码风格

- **TypeScript 严格模式**：启用 `strict: true`
- **组件命名**：PascalCase
- **文件命名**：PascalCase (组件) / kebab-case (路由)
- **CSS 规范**：优先使用 Tailwind 原子类

### Git 提交规范

```
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建/工具链相关
```

---

## 🛣️ 开发路线图

### Phase 1: MVP（当前阶段）
- [x] 首页设计
- [x] 交易大厅（模拟数据）
- [x] 用户认证（登录/注册）
- [ ] 交易详情页

### Phase 2: 核心功能
- [ ] 真实交易数据接入
- [ ] 发布交易功能
- [ ] 担保交易流程
- [ ] 支付集成

### Phase 3: 优化迭代
- [ ] 用户评价系统
- [ ] 消息通知
- [ ] 交易数据统计
- [ ] 移动端 App

---

## 🤝 贡献指南

欢迎贡献代码！请遵循以下流程：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交改动 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 📄 开源协议

本项目采用 MIT 协议开源。

---

## 📧 联系方式

- **项目主页**：[GitHub](https://github.com/your-username/falai-app)
- **问题反馈**：[Issues](https://github.com/your-username/falai-app/issues)
- **邮箱**：support@fsd-trading.com

---

**© 2025 特斯拉 FSD 权限交易平台. All rights reserved.**
