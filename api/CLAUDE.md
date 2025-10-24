# API 模块 - CLAUDE.md

> **🧭 导航面包屑**：[根目录](../CLAUDE.md) → **API 模块**
>
> **模块路径**：`/api/`
>
> **模块类型**：Vercel Serverless Functions
>
> **最后更新**：2025-10-24 14:01:12 UTC

## 📋 模块概览

API 模块包含 Vercel Serverless Functions，为前端提供后端 API 服务。当前主要提供 Vercel Blob 存储相关的 API 接口。

### 技术栈
- **运行时**：Node.js (Vercel Functions)
- **存储服务**：Vercel Blob Storage
- **认证方式**：Bearer Token (BLOB_READ_WRITE_TOKEN)

## 🏗️ 架构结构

### 目录结构
```
api/
└── blob-keys.js              # Blob 存储密钥获取 API
```

## 🚀 核心接口

### Blob 密钥 API (`blob-keys.js`)

**端点**：`GET /api/blob-keys`

**功能**：从 Vercel Blob 存储中获取 API 密钥列表

**请求头**：
```
Method: GET
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET
Access-Control-Allow-Headers: Content-Type
```

**响应格式**：
```typescript
interface BlobKeysResponse {
  keys: Array<{
    key: string;        // 密钥内容
    name: string;       // 密钥名称 (格式: "密钥 N")
    isSystem: boolean;  // 是否系统密钥 (固定为 true)
    group: string;      // 密钥分组 (固定为 "默认组")
  }>;
}
```

**错误响应**：
```typescript
interface ErrorResponse {
  error: string;
  details?: string;  // 详细错误信息
}
```

### 错误处理

| 状态码 | 错误类型 | 描述 |
|--------|----------|------|
| 200 | 成功 | 成功获取密钥列表 |
| 404 | 未找到 | key.txt 文件不存在 |
| 405 | 方法不允许 | 非 GET 请求 |
| 500 | 服务器错误 | 配置缺失或内部错误 |

## 🔧 依赖关系

### 核心依赖
```javascript
import { list } from '@vercel/blob';
```

### 环境变量
```env
BLOB_READ_WRITE_TOKEN=your_blob_token  # Vercel Blob 读写令牌
```

## 📊 关键文件详情

### 1. Blob 密钥获取 (`blob-keys.js`)

**主要功能**：
- 从 Vercel Blob 存储中读取 `key.txt` 文件
- 解析文件内容并格式化为密钥对象数组
- 提供跨域支持 (CORS)
- 完善的错误处理机制

**工作流程**：
1. 验证请求方法 (仅允许 GET)
2. 检查环境变量配置
3. 查找 Blob 存储中的 `key.txt` 文件
4. 读取并解析文件内容
5. 格式化返回密钥列表

**安全特性**：
- 环境变量验证
- 文件存在性检查
- HTTP 状态码规范
- 错误信息脱敏

## 🧪 测试覆盖

**当前状态**：暂无测试
**建议测试场景**：
- 正常密钥获取流程
- 环境变量缺失处理
- 文件不存在处理
- 非 GET 请求处理
- 文件格式错误处理

### 建议测试代码结构
```javascript
// tests/api/blob-keys.test.js
import { describe, it, expect, vi } from 'vitest';
import handler from '../api/blob-keys.js';

describe('/api/blob-keys', () => {
  it('should return keys list on GET request', async () => {
    // 测试正常流程
  });

  it('should handle missing BLOB_READ_WRITE_TOKEN', async () => {
    // 测试环境变量缺失
  });

  it('should handle non-GET requests', async () => {
    // 测试方法验证
  });
});
```

## 🔒 安全考虑

### 当前安全措施
- **环境变量保护**：敏感配置通过环境变量管理
- **方法限制**：仅允许 GET 请求
- **错误脱敏**：避免敏感信息泄露
- **CORS 配置**：控制跨域访问

### 建议增强
- **速率限制**：防止 API 滥用
- **请求验证**：添加请求头验证
- **日志记录**：记录访问日志用于监控
- **缓存机制**：减少 Blob 存储访问频率

## 🚀 性能优化

### 当前性能特点
- **冷启动延迟**：Serverless Function 特性
- **文件读取**：依赖 Blob 存储响应时间
- **内存使用**：轻量级处理

### 建议优化
- **缓存策略**：内存缓存密钥数据
- **CDN 集成**：静态化密钥数据
- **并发控制**：限制并发请求数
- **监控告警**：性能指标监控

## 📈 待开发功能

### 计划中 API
1. **FSD 交易相关 API**
   - `POST /api/listings` - 发布交易
   - `GET /api/listings` - 获取交易列表
   - `PUT /api/listings/:id` - 更新交易信息

2. **用户相关 API**
   - `GET /api/users/profile` - 获取用户信息
   - `PUT /api/users/profile` - 更新用户信息
   - `POST /api/users/avatar` - 上传头像

3. **支付相关 API**
   - `POST /api/payments/create` - 创建支付
   - `POST /api/payments/confirm` - 确认支付
   - `GET /api/payments/history` - 支付历史

4. **消息相关 API**
   - `GET /api/messages` - 获取消息列表
   - `POST /api/messages` - 发送消息
   - `PUT /api/messages/:id/read` - 标记已读

### 技术改进
1. **API 文档**：OpenAPI/Swagger 规范
2. **版本管理**：API 版本控制策略
3. **错误标准化**：统一错误响应格式
4. **请求验证**：输入数据校验中间件

---

## 🔗 相关文档

- **[Vercel Functions 文档](https://vercel.com/docs/concepts/functions)**
- **[Vercel Blob 文档](https://vercel.com/docs/concepts/projects/environment-variables#system-environment-variables)**
- **[前端主模块](../src/CLAUDE.md)**

---

*此文档由 init-architect 自动生成，最后更新：2025-10-24 14:01:12 UTC*