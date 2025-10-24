# 数据库模块 - CLAUDE.md

> **🧭 导航面包屑**：[根目录](../CLAUDE.md) → **数据库模块**
>
> **模块路径**：`/supabase/`
>
> **模块类型**：Supabase PostgreSQL + Edge Functions
>
> **最后更新**：2025-10-24 14:01:12 UTC

## 📋 模块概览

数据库模块基于 Supabase 平台，提供 PostgreSQL 数据库、认证服务、实时订阅和 Edge Functions 功能。当前主要实现了用户账户删除的冷静期机制。

### 技术栈
- **数据库**：PostgreSQL (Supabase)
- **认证**：Supabase Auth
- **Edge Functions**：Deno 运行时
- **实时功能**：Supabase Realtime
- **存储**：Supabase Storage (可选)

## 🏗️ 架构结构

### 目录结构
```
supabase/
├── migrations/                    # 数据库迁移文件
│   ├── 20251024_complete_setup.sql  # 完整设置脚本
│   └── .backup/                   # 迁移备份
└── functions/                     # Edge Functions
    └── cleanup-expired-accounts/  # 定时清理过期账户
```

## 🗄️ 数据库结构

### 1. 待删除账户表 (`pending_deletions`)

**表结构**：
```sql
CREATE TABLE pending_deletions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_deletion_at TIMESTAMPTZ NOT NULL,
  cancel_token TEXT NOT NULL UNIQUE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**字段说明**：
- `id`：主键，随机生成的 UUID
- `user_id`：关联的用户 ID
- `requested_at`：申请删除时间
- `scheduled_deletion_at`：计划删除时间（30 天后）
- `cancel_token`：取消删除的唯一令牌
- `reason`：删除原因（可选）
- `created_at`：记录创建时间

**索引**：
- `idx_pending_deletions_user_id`：用户 ID 索引
- `idx_pending_deletions_scheduled`：计划删除时间索引

### 2. 行级安全策略 (RLS)

**权限策略**：
```sql
-- 用户可以查看自己的删除申请
POLICY "Users can view their own pending deletions"
  ON pending_deletions FOR SELECT USING (auth.uid() = user_id);

-- 用户可以申请删除自己的账户
POLICY "Users can request deletion of their own account"
  ON pending_deletions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户可以取消自己的删除申请
POLICY "Users can cancel their own account deletion"
  ON pending_deletions FOR DELETE USING (auth.uid() = user_id);
```

## 🔧 核心函数

### 用户删除函数 (`delete_user`)

**函数签名**：
```sql
CREATE OR REPLACE FUNCTION delete_user(target_user_id UUID DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
```

**功能**：
- 删除指定用户及其相关数据
- 支持删除当前登录用户或指定用户
- 返回 JSON 格式的执行结果

**使用方式**：
```sql
-- 删除当前登录用户
SELECT delete_user();

-- 删除指定用户（管理员）
SELECT delete_user('user-uuid-here');
```

**返回格式**：
```json
{
  "success": true,
  "message": "用户 xxx 已成功删除",
  "user_id": "user-uuid-here"
}
```

**错误处理**：
- `INSUFFICIENT_PRIVILEGE`：权限不足
- `FOREIGN_KEY_VIOLATION`：存在关联数据
- 其他 SQL 错误

## ⚡ Edge Functions

### 定时清理账户函数

**路径**：`/functions/cleanup-expired-accounts/`

**功能**：
- 定时检查并删除过期的账户删除申请
- 自动执行已到期的删除操作
- 通过 Supabase Cron Jobs 调度

### Cron Jobs 配置

项目已配置定时任务：
- **每分钟执行**：清理过期账户
- **配置文件**：`supabase-cron-job-every-minute.png`

## 🔐 安全特性

### 数据安全
- **行级安全 (RLS)**：数据访问权限控制
- **用户隔离**：用户只能访问自己的数据
- **令牌机制**：删除操作使用唯一令牌
- **冷静期**：30 天删除冷静期，防止误操作

### 权限控制
- **SECURITY DEFINER**：函数以定义者权限执行
- **认证检查**：验证用户登录状态
- **权限验证**：操作权限检查

## 📊 迁移脚本

### 完整设置脚本 (`20251024_complete_setup.sql`)

**执行顺序**：
1. 创建 `pending_deletions` 表
2. 创建 `delete_user` 函数
3. 清理多余函数
4. 设置权限和策略

**脚本特点**：
- 一键部署完整功能
- 包含错误处理
- 自动清理旧版本函数
- 设置适当的权限

## 🧪 测试覆盖

### 数据库测试建议

**单元测试场景**：
```sql
-- 测试删除申请创建
INSERT INTO pending_deletions (user_id, scheduled_deletion_at, cancel_token) VALUES (...);

-- 测试权限策略
SELECT * FROM pending_deletions WHERE user_id = auth.uid();

-- 测试删除函数
SELECT delete_user('test-user-uuid');
```

**集成测试场景**：
- 用户申请删除账户流程
- 取消删除申请流程
- 定时清理过期账户
- 权限验证测试

## 🚀 性能优化

### 当前优化
- **索引优化**：用户 ID 和删除时间索引
- **查询优化**：RLS 策略优化
- **定时任务**：避免过期数据堆积

### 建议优化
- **分区策略**：按时间分区存储删除申请
- **缓存机制**：频繁查询数据缓存
- **监控告警**：数据库性能监控

## 📈 待开发功能

### 计划中表结构

1. **FSD 交易表** (`fsd_listings`)
```sql
CREATE TABLE fsd_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES auth.users(id),
  type TEXT CHECK (type IN ('sell', 'rent')),
  title TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  period TEXT CHECK (period IN ('monthly', 'yearly', 'permanent')),
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

2. **用户资料表** (`user_profiles`)
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  display_name TEXT,
  avatar_url TEXT,
  location TEXT,
  bio TEXT,
  rating DECIMAL(3,2) DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

3. **交易记录表** (`transactions`)
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES fsd_listings(id),
  buyer_id UUID REFERENCES auth.users(id),
  seller_id UUID REFERENCES auth.users(id),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

### 计划中 Edge Functions

1. **支付处理**：`/functions/process-payment/`
2. **消息通知**：`functions/send-notification/`
3. **文件上传**：`functions/upload-image/`
4. **数据导出**：`functions/export-data/`

## 🔧 开发工作流

### 本地开发
```bash
# 启动 Supabase 本地开发环境
supabase start

# 应用迁移
supabase db push

# 部署 Edge Functions
supabase functions deploy
```

### 生产部署
```bash
# 推送迁移到生产环境
supabase db push --remote

# 部署 Edge Functions 到生产环境
supabase functions deploy --remote
```

## 🔗 相关文档

- **[Supabase 文档](https://supabase.com/docs)**
- **[前端主模块](../src/CLAUDE.md)**
- **[API 模块](../api/CLAUDE.md)**

---

*此文档由 init-architect 自动生成，最后更新：2025-10-24 14:01:12 UTC*