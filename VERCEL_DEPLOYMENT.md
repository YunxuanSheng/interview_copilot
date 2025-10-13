# Vercel 部署指南

## 问题解决：Demo 登录失败

### 问题原因
在 Vercel 生产环境中，SQLite 本地文件数据库（`file:./dev.db`）不可用，导致 Demo 登录失败。

### 解决方案

#### 1. 配置 PostgreSQL 数据库

**重要**：不要在 `vercel.json` 中配置环境变量，而是通过 Vercel Dashboard 手动配置。

在 Vercel 项目设置中配置以下环境变量：

```env
# 数据库配置 (必需)
DATABASE_URL="postgresql://username:password@host:port/database"

# NextAuth 配置 (必需)
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="your-production-secret-key"

# Google OAuth (可选)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# OpenAI API (可选)
OPENAI_API_KEY="your-openai-api-key"
```

**注意**：`vercel.json` 中的 `env` 配置会导致错误，应该删除。

#### 2. 推荐的数据库服务

- **Vercel Postgres** (推荐)
- **PlanetScale**
- **Supabase**
- **Railway**
- **Neon**

#### 3. 使用 Vercel Postgres

1. 在 Vercel 项目页面，进入 "Storage" 标签
2. 点击 "Create Database" → "Postgres"
3. 选择计划（Hobby 计划免费）
4. 创建数据库后，复制连接字符串
5. 在环境变量中设置 `DATABASE_URL`

#### 4. 数据库迁移

部署后，需要运行数据库迁移：

```bash
# 在 Vercel 部署完成后，运行以下命令
npx prisma db push
```

或者使用 Vercel CLI：

```bash
vercel env pull .env.local
npx prisma db push
```

#### 5. 验证部署

1. 访问 `https://your-domain.vercel.app/debug` 检查环境状态
2. 访问 `https://your-domain.vercel.app/api/health` 检查健康状态
3. 测试 Demo 登录功能

### 环境变量配置步骤

1. **进入 Vercel 项目设置**
   - 登录 Vercel Dashboard
   - 选择你的项目
   - 点击 "Settings" → "Environment Variables"

2. **添加环境变量**
   ```
   Name: DATABASE_URL
   Value: postgresql://username:password@host:port/database
   Environment: Production, Preview, Development
   ```

   ```
   Name: NEXTAUTH_URL
   Value: https://your-domain.vercel.app
   Environment: Production, Preview, Development
   ```

   ```
   Name: NEXTAUTH_SECRET
   Value: your-production-secret-key
   Environment: Production, Preview, Development
   ```

3. **重新部署**
   - 在项目页面点击 "Redeploy"
   - 或者推送新的代码到 GitHub

### 故障排除

#### 1. 数据库连接失败
- 检查 `DATABASE_URL` 格式是否正确
- 确认数据库服务是否正常运行
- 检查网络连接和防火墙设置

#### 2. Demo 登录仍然失败
- 检查 `NEXTAUTH_URL` 是否与部署域名一致
- 确认 `NEXTAUTH_SECRET` 已正确设置
- 查看 Vercel 函数日志排查错误

#### 3. 环境变量未生效
- 确认环境变量已保存
- 重新部署项目
- 检查环境变量作用域设置

### 调试工具

访问以下页面进行调试：

- `/debug` - 环境状态检查
- `/api/health` - 健康检查
- `/test-auth` - 认证测试

### 注意事项

1. **数据库迁移**：每次 schema 变更后需要运行 `npx prisma db push`
2. **环境变量**：确保所有必需的环境变量都已正确配置
3. **域名配置**：`NEXTAUTH_URL` 必须与实际的部署域名一致
4. **安全密钥**：`NEXTAUTH_SECRET` 应该是随机生成的强密钥
