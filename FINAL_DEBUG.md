# 最终调试指南 - Demo 登录失败

## 当前状态
- 数据库状态：`"disconnected"`
- 已配置 Prisma Postgres
- 已重新部署
- 问题：Demo 登录仍然失败

## 可能的原因

### 1. 环境变量没有正确设置
检查 Vercel 中是否有 `DATABASE_URL`

### 2. 环境变量格式问题
连接字符串可能需要调整

### 3. 数据库权限问题
Prisma Postgres 可能需要额外配置

## 立即检查步骤

### 步骤 1: 确认环境变量
在 Vercel 项目设置中确认：
- `DATABASE_URL` 是否存在
- 值是否正确
- 作用域是否包含 Production

### 步骤 2: 检查 Vercel 函数日志
1. 进入 Vercel 项目页面
2. 点击 "Functions" 标签
3. 查看最近的函数执行日志
4. 查找数据库连接错误

### 步骤 3: 尝试不同的连接字符串格式

**当前格式**：
```
postgres://37893a7c2cad2c6e2d380b6dbf45de4c8c836d90111ec6e63d4ed87806874458:sk_zbCXC_ypIq8xBMmZCCNQU@db.prisma.io:5432/postgres?sslmode=require
```

**尝试格式 1**：
```
postgresql://37893a7c2cad2c6e2d380b6dbf45de4c8c836d90111ec6e63d4ed87806874458:sk_zbCXC_ypIq8xBMmZCCNQU@db.prisma.io:5432/postgres?sslmode=require
```

**尝试格式 2**：
```
postgresql://37893a7c2cad2c6e2d380b6dbf45de4c8c836d90111ec6e63d4ed87806874458:sk_zbCXC_ypIq8xBMmZCCNQU@db.prisma.io:5432/postgres
```

### 步骤 4: 本地测试连接
```bash
# 设置环境变量
export DATABASE_URL="postgres://37893a7c2cad2c6e2d380b6dbf45de4c8c836d90111ec6e63d4ed87806874458:sk_zbCXC_ypIq8xBMmZCCNQU@db.prisma.io:5432/postgres?sslmode=require"

# 测试连接
npx prisma db push
```

## 快速修复方案

### 方案 1: 重新配置环境变量
1. 删除现有的 `DATABASE_URL`
2. 重新添加，使用 `postgresql://` 前缀
3. 重新部署

### 方案 2: 使用 Vercel 原生 Postgres
如果 Prisma Postgres 有问题，可以：
1. 在 Vercel 中创建原生 Postgres 数据库
2. 使用 Vercel 提供的连接字符串
3. 重新部署

### 方案 3: 临时禁用数据库检查
修改认证配置，临时跳过数据库检查：

```typescript
// 在 src/lib/auth.ts 中临时修改
const dbConnected = true; // 临时跳过数据库检查
```

## 验证修复
修复后，访问 `/api/health` 应该看到：
```json
{
  "database": "connected"
}
```

## 如果仍然失败
请提供：
1. Vercel 函数日志中的错误信息
2. 本地测试 `npx prisma db push` 的结果
3. Vercel 环境变量截图
