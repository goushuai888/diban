# API 模块 - CLAUDE.md

> **🧭 导航面包屑**：[根目录](../CLAUDE.md) → **API 模块**
>
> **模块路径**：`/api/`
>
> **模块类型**：Vercel Serverless Functions
>
> **最后更新**：2025-10-24 23:30:00 UTC

## 📋 模块概览

API 模块包含 Vercel Serverless Functions，为特斯拉FSD权限交易平台提供完整的后端 API 服务。包含用户认证、交易管理、支付处理等核心功能。

### 技术栈
- **运行时**：Node.js (Vercel Functions)
- **数据库**：Supabase (PostgreSQL + Auth)
- **认证方式**：JWT Token (Supabase Auth)
- **支付集成**：支付宝、微信支付、银行转账

## 🏗️ 架构结构

### 目录结构
```
api/
├── auth.js                  # 用户认证 API (注册/登录/个人信息)
├── listings.js              # 交易管理 API (发布/查看/搜索交易)
├── payments.js              # 支付处理 API (创建支付/支付历史)
└── backup/
    └── blob-keys.js.backup  # 备份的原始API文件
```

## 🚀 核心接口

### 1. 用户认证 API (`auth.js`)

**端点**：`GET|POST /api/auth`

**功能**：处理用户注册、登录、登出和用户信息获取

**主要接口**：
- `POST /api/auth` - 注册/登录/登出
- `GET /api/auth` - 获取用户信息和统计数据

**请求格式**：
```typescript
// 注册
{
  action: 'signup',
  email: string,
  password: string,
  username: string
}

// 登录
{
  action: 'signin',
  email: string,
  password: string
}
```

**响应格式**：
```typescript
interface AuthResponse {
  message: string;
  user?: SupabaseUser;
  session?: SupabaseSession;
  profile?: UserProfile;
  needs_verification?: boolean;
}
```

### 2. 交易管理 API (`listings.js`)

**端点**：`GET|POST /api/listings`

**功能**：处理FSD权限交易的发布、查看和搜索

**主要接口**：
- `GET /api/listings` - 获取交易列表（支持分页、筛选）
- `POST /api/listings` - 创建新交易

**查询参数**：
```typescript
interface ListingQuery {
  page?: number;        // 页码 (默认: 1)
  limit?: number;       // 每页数量 (默认: 20)
  status?: string;      // 交易状态 (默认: 'active')
  type?: string;        // 交易类型 ('sell'|'rent'|'transfer')
  min_price?: number;   // 最低价格
  max_price?: number;   // 最高价格
}
```

**交易数据格式**：
```typescript
interface Listing {
  id: string;
  seller_id: string;
  type: 'sell'|'rent'|'transfer';
  title: string;
  description: string;
  price: number;
  duration_days?: number;  // 租赁时长
  tesla_account: string;
  location: string;
  contact_method: string;
  terms?: string;
  status: 'active'|'sold'|'cancelled';
  created_at: string;
  seller?: {
    username: string;
    avatar_url?: string;
    rating?: number;
    total_trades?: number;
  };
}
```

### 3. 支付处理 API (`payments.js`)

**端点**：`GET|POST|PUT /api/payments`

**功能**：处理支付订单创建、支付历史和状态更新

**主要接口**：
- `POST /api/payments` - 创建支付订单
- `GET /api/payments` - 获取支付历史
- `PUT /api/payments` - 更新支付状态（管理员）

**支付方式**：
- 支付宝 (`alipay`)
- 微信支付 (`wechat`)
- 银行转账 (`bank_transfer`)

**支付数据格式**：
```typescript
interface Payment {
  id: string;
  order_no: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  payment_method: 'alipay'|'wechat'|'bank_transfer';
  status: 'pending'|'paid'|'completed'|'refunded'|'cancelled';
  message?: string;
  created_at: string;
  expires_at: string;
}
```

## 🔧 依赖关系

### 核心依赖
```javascript
import { createClient } from '@supabase/supabase-js';
```

### 环境变量
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📊 关键文件详情

### 1. 用户认证 (`auth.js`)

**主要功能**：
- Supabase Auth 集成
- 用户注册/登录/登出
- 用户配置文件管理
- JWT Token 验证

**安全特性**：
- 密码强度验证
- 用户名唯一性检查
- Token 自动刷新
- CORS 跨域保护

### 2. 交易管理 (`listings.js`)

**主要功能**：
- 交易发布和管理
- 分页和筛选功能
- 关联数据查询（卖家信息、出价等）
- 实时状态更新

**业务逻辑**：
- 交易类型验证
- 价格范围筛选
- 地理位置支持
- 担保交易机制

### 3. 支付处理 (`payments.js`)

**主要功能**：
- 多种支付方式集成
- 订单生成和管理
- 支付状态跟踪
- 交易历史查询

**支付流程**：
1. 创建支付订单
2. 生成支付信息（二维码/转账信息）
3. 支付状态确认
4. 自动完成交易

## 🧪 测试覆盖

**当前状态**：暂无测试
**建议测试场景**：
- 用户注册/登录流程测试
- 交易发布和搜索功能测试
- 支付订单创建和状态更新测试
- 权限验证和错误处理测试

### 建议测试代码结构
```javascript
// tests/api/auth.test.js
import { describe, it, expect, vi } from 'vitest';
import handler from '../api/auth.js';

describe('/api/auth', () => {
  it('should handle user signup', async () => {
    // 测试用户注册流程
  });

  it('should handle user signin', async () => {
    // 测试用户登录流程
  });

  it('should validate required fields', async () => {
    // 测试字段验证
  });
});
```

## 🔒 安全考虑

### 当前安全措施
- **JWT Token 认证**：基于 Supabase Auth 的安全认证
- **CORS 配置**：控制跨域访问
- **输入验证**：严格的参数验证和类型检查
- **权限控制**：基于角色的访问控制
- **错误脱敏**：避免敏感信息泄露

### 建议增强
- **速率限制**：防止 API 滥用
- **请求日志**：记录访问日志用于监控
- **加密传输**：确保 HTTPS 加密
- **SQL 注入防护**：使用参数化查询
- **XSS 防护**：输入输出过滤

## 🚀 性能优化

### 当前性能特点
- **冷启动延迟**：Serverless Function 特性
- **数据库查询**：Supabase PostgreSQL 高性能
- **连接池**：数据库连接复用
- **缓存机制**：JWT Token 和查询结果缓存

### 建议优化
- **Redis 缓存**：缓存热点数据
- **CDN 集成**：静态资源加速
- **分页优化**：大数据集分页处理
- **监控告警**：性能指标监控

## 📈 待开发功能

### 计划中 API
1. **消息通信 API**
   - `GET /api/messages` - 获取消息列表
   - `POST /api/messages` - 发送消息
   - `PUT /api/messages/:id/read` - 标记已读

2. **评价系统 API**
   - `POST /api/reviews` - 创建评价
   - `GET /api/reviews/user/:id` - 获取用户评价
   - `PUT /api/reviews/:id` - 更新评价

3. **文件上传 API**
   - `POST /api/upload/avatar` - 上传头像
   - `POST /api/upload/document` - 上传交易凭证

4. **统计分析 API**
   - `GET /api/stats/platform` - 平台统计数据
   - `GET /api/stats/user/:id` - 用户统计信息

### 技术改进
1. **API 文档**：OpenAPI/Swagger 规范
2. **版本管理**：API 版本控制策略
3. **错误标准化**：统一错误响应格式
4. **请求验证**：Zod 或 Joi 数据校验
5. **实时通信**：WebSocket 或 SSE 支持

---

## 🔗 相关文档

- **[Vercel Functions 文档](https://vercel.com/docs/concepts/functions)**
- **[Supabase 文档](https://supabase.com/docs)**
- **[前端主模块](../src/CLAUDE.md)**
- **[项目根目录](../CLAUDE.md)**

## 🔄 API 重构历史

**v1.0.0 - 2025-10-24**
- ✨ 完全重构 API 模块
- 🔄 从 AI 图像生成迁移到 FSD 交易平台
- 📦 新增用户认证、交易管理、支付处理 API
- 📚 完整的 TypeScript 接口定义
- 🛡️ 增强的安全性和错误处理

**备份说明**：原始的 `blob-keys.js` 已备份到 `/api/backup/` 目录，保留了历史代码。

---

*此文档由老王重构，最后更新：2025-10-24 23:30:00 UTC*