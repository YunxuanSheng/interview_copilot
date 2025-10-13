# Demo 模式线上问题解决方案

## 问题描述

- **本地环境**: Demo 模式正常工作
- **线上环境**: 点击 Demo 登录按钮无反应，导航栏不显示

## 问题原因分析

### 1. 导航栏不显示的原因
```typescript
// src/components/navigation.tsx
if (!session) {
  return null  // 没有会话时导航栏不显示
}
```

### 2. Demo 登录失败的可能原因
1. **环境变量配置错误**
2. **数据库连接失败**
3. **NextAuth 配置问题**
4. **网络请求被阻止**

## 解决方案

### 1. 修复登录跳转问题 ✅

**问题**: 使用 `router.push()` 和 `router.refresh()` 在线上环境可能不生效

**解决**: 改用 `window.location.href` 进行页面跳转

```typescript
// 修改前
if (result?.ok) {
  router.push("/")
  router.refresh()
}

// 修改后
if (result?.ok) {
  window.location.href = "/"
}
```

### 2. 增强调试信息 ✅

**添加了详细的日志输出**:
- 环境变量状态检查
- 登录过程详细日志
- 数据库连接状态
- 会话状态监控

### 3. 创建调试工具 ✅

**新增调试页面**:
- `/debug` - 环境状态检查
- `/test-auth` - 认证流程测试
- `/api/health` - 健康检查端点

## 使用调试工具

### 1. 检查环境状态
访问 `/debug` 页面查看:
- 会话状态
- 环境变量配置
- 健康检查结果

### 2. 测试认证流程
访问 `/test-auth` 页面:
- 测试 Demo 登录
- 查看控制台日志
- 验证会话状态

### 3. 健康检查
访问 `/api/health` 端点:
```json
{
  "status": "ok",
  "database": "connected",
  "environment": "production",
  "nextAuthUrl": "https://your-domain.com",
  "hasNextAuthSecret": true
}
```

## 线上环境检查清单

### 1. 环境变量配置
确保以下环境变量已正确设置:
```env
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-production-secret"
DATABASE_URL="postgresql://..."
```

### 2. 数据库连接
- 确保数据库服务可访问
- 运行数据库迁移: `npx prisma db push`
- 检查数据库表是否正确创建

### 3. 网络配置
- 检查 CORS 设置
- 确保 API 路由可访问
- 检查防火墙设置

## 常见问题排查

### 问题 1: Demo 按钮点击无反应
**可能原因**:
- JavaScript 错误阻止执行
- 网络请求失败
- 环境变量未设置

**排查步骤**:
1. 打开浏览器开发者工具
2. 查看控制台错误信息
3. 检查网络请求状态
4. 访问 `/debug` 页面检查环境状态

### 问题 2: 登录后导航栏不显示
**可能原因**:
- 会话未正确创建
- 数据库连接失败
- NextAuth 配置错误

**排查步骤**:
1. 检查会话状态: `console.log(session)`
2. 查看数据库连接状态
3. 检查 NextAuth 配置

### 问题 3: 401 认证错误
**可能原因**:
- NEXTAUTH_SECRET 未设置
- 数据库连接失败
- 用户创建失败

**排查步骤**:
1. 检查环境变量配置
2. 查看服务器日志
3. 测试数据库连接

## 部署建议

### 1. 分步部署
1. 先部署代码修复
2. 配置环境变量
3. 运行数据库迁移
4. 测试功能

### 2. 监控设置
1. 设置健康检查监控
2. 监控错误日志
3. 设置告警机制

### 3. 回滚准备
1. 保留旧版本代码
2. 准备快速回滚方案
3. 备份数据库

## 联系支持

如果问题仍然存在，请提供:
1. `/debug` 页面的输出信息
2. 浏览器控制台错误日志
3. 服务器错误日志
4. 环境变量配置（隐藏敏感信息）

## 测试验证

部署完成后，请验证:
1. ✅ 访问 `/debug` 页面检查环境状态
2. ✅ 访问 `/test-auth` 页面测试认证
3. ✅ 点击 Demo 登录按钮
4. ✅ 检查导航栏是否显示
5. ✅ 验证用户会话状态
