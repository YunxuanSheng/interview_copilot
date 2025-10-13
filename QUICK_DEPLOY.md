# 快速部署指南

## 解决 Demo 登录失败问题

### 问题
- 本地环境：Demo 登录正常
- 生产环境：Demo 登录失败，提示 `CredentialsSignin`

### 原因
Vercel 生产环境不支持 SQLite 本地文件数据库

### 解决步骤

#### 1. 创建 PostgreSQL 数据库

**选项 A：使用 Vercel Postgres（推荐）**
1. 在 Vercel 项目页面，点击 "Storage" 标签
2. 点击 "Create Database" → "Postgres"
3. 选择 Hobby 计划（免费）
4. 创建数据库

**选项 B：使用其他服务**
- PlanetScale
- Supabase
- Railway
- Neon

#### 2. 配置环境变量

在 Vercel 项目设置 → Environment Variables 中添加：

```
Name: DATABASE_URL
Value: postgresql://username:password@host:port/database
Environment: Production, Preview, Development

Name: NEXTAUTH_URL
Value: https://your-domain.vercel.app
Environment: Production, Preview, Development

Name: NEXTAUTH_SECRET
Value: your-random-secret-key
Environment: Production, Preview, Development
```

#### 3. 重新部署

1. 推送代码到 GitHub
2. Vercel 会自动重新部署
3. 或者手动点击 "Redeploy"

#### 4. 运行数据库迁移

部署完成后，运行：
```bash
npx prisma db push
```

#### 5. 验证

访问以下页面检查状态：
- `https://your-domain.vercel.app/debug` - 环境检查
- `https://your-domain.vercel.app/api/health` - 健康检查
- 测试 Demo 登录功能

### 常见问题

**Q: 环境变量配置后仍然失败？**
A: 确保重新部署项目，环境变量需要重新构建才能生效。

**Q: 数据库连接失败？**
A: 检查 `DATABASE_URL` 格式是否正确，确保数据库服务正常运行。

**Q: Demo 登录还是失败？**
A: 检查 `NEXTAUTH_URL` 是否与部署域名一致，`NEXTAUTH_SECRET` 是否已设置。

### 调试工具

- `/debug` - 查看环境状态
- `/api/health` - 检查服务健康状态
- Vercel 函数日志 - 查看详细错误信息
