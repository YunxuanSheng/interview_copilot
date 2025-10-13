# 部署指南 - Demo 模式线上问题解决方案

## 问题描述

线上环境出现 `/api/auth/callback/demo:1 Failed to load resource: the server responded with a status of 401` 错误。

## 问题原因分析

1. **语法错误**: `auth.ts` 文件中存在多余的逗号导致配置解析失败
2. **环境变量缺失**: 缺少 `NEXTAUTH_SECRET` 配置
3. **数据库连接问题**: 生产环境数据库连接可能失败
4. **错误处理不足**: 缺少详细的错误日志和调试信息

## 解决方案

### 1. 修复语法错误 ✅

已修复 `src/lib/auth.ts` 中的语法错误：
- 移除了多余的逗号
- 添加了 `NEXTAUTH_SECRET` 配置

### 2. 环境变量配置

确保在线上环境配置以下环境变量：

```env
# 必需的环境变量
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-production-secret-key"

# 数据库配置
DATABASE_URL="postgresql://username:password@host:port/database"

# 可选配置
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
OPENAI_API_KEY="your-openai-api-key"
```

### 3. 数据库配置

#### 开发环境 (SQLite)
```env
DATABASE_URL="file:./dev.db"
```

#### 生产环境 (PostgreSQL)
```env
DATABASE_URL="postgresql://username:password@host:port/database"
```

### 4. 部署步骤

1. **推送代码到仓库**
   ```bash
   git add .
   git commit -m "fix: 修复 demo 模式认证问题"
   git push origin main
   ```

2. **配置环境变量**
   - 在 Vercel/Netlify 等平台设置环境变量
   - 确保 `NEXTAUTH_URL` 和 `NEXTAUTH_SECRET` 已正确配置

3. **数据库迁移**
   ```bash
   npx prisma db push
   ```

4. **健康检查**
   访问 `/api/health` 端点检查服务状态

### 5. 调试工具

#### 健康检查端点
```
GET /api/health
```

返回信息：
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected",
  "environment": "production",
  "nextAuthUrl": "https://your-domain.com",
  "hasNextAuthSecret": true
}
```

#### 日志查看
- 查看服务器日志中的详细错误信息
- Demo 模式现在会输出详细的调试日志

### 6. 常见问题排查

#### 问题 1: 401 认证错误
**原因**: 环境变量配置错误或数据库连接失败
**解决**: 
1. 检查 `NEXTAUTH_SECRET` 是否设置
2. 检查 `NEXTAUTH_URL` 是否正确
3. 检查数据库连接是否正常

#### 问题 2: 数据库连接失败
**原因**: 生产环境数据库配置错误
**解决**:
1. 检查 `DATABASE_URL` 格式是否正确
2. 确保数据库服务可访问
3. 运行数据库迁移

#### 问题 3: Demo 用户创建失败
**原因**: 数据库权限或表结构问题
**解决**:
1. 检查数据库表是否正确创建
2. 检查用户权限
3. 查看详细错误日志

### 7. 监控建议

1. **设置健康检查监控**
   - 定期检查 `/api/health` 端点
   - 监控数据库连接状态

2. **日志监控**
   - 监控认证相关错误
   - 设置告警机制

3. **性能监控**
   - 监控 API 响应时间
   - 监控数据库查询性能

## 测试验证

部署完成后，请验证以下功能：

1. ✅ Demo 模式登录功能
2. ✅ 数据库连接正常
3. ✅ 用户创建和查询
4. ✅ 健康检查端点
5. ✅ 错误日志输出

## 联系支持

如果问题仍然存在，请提供：
1. 健康检查端点返回的信息
2. 服务器错误日志
3. 环境变量配置（隐藏敏感信息）
4. 具体的错误信息和复现步骤
