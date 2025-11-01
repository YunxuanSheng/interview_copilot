# 认证问题修复指南

## 问题描述

在本地测试时出现 `401 Unauthorized` 错误，通常是因为 `NEXTAUTH_URL` 配置不正确。

## 解决方案

### 1. 检查并更新 `.env.local` 文件

在项目根目录的 `.env.local` 文件中，确保 `NEXTAUTH_URL` 设置为本地开发地址：

```env
# 本地开发环境
NEXTAUTH_URL="http://localhost:3000"

# 生产环境（部署时使用）
# NEXTAUTH_URL="https://your-domain.vercel.app"
```

### 2. 验证配置

确保 `.env.local` 包含以下必需的环境变量：

```env
# 数据库连接
DATABASE_URL="your-database-url"

# NextAuth 配置（必需）
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# 通义千问 API（可选，用于AI功能）
DASHSCOPE_API_KEY="sk-your-api-key"
```

### 3. 生成新的 NEXTAUTH_SECRET

如果还没有设置 `NEXTAUTH_SECRET`，可以使用以下命令生成：

```bash
openssl rand -base64 32
```

或者访问：https://generate-secret.vercel.app/32

### 4. 重启开发服务器

修改 `.env.local` 后，需要重启开发服务器才能生效：

```bash
# 停止当前服务器 (Ctrl+C)
# 然后重新启动
npm run dev
```

### 5. 测试登录

1. 访问 http://localhost:3000/auth/signin
2. 尝试使用以下方式登录：
   - **Demo模式**：直接点击"Demo登录"按钮
   - **邮箱登录**：需要先注册账号
   - **Google登录**：需要配置 Google OAuth

## 常见问题

### Q: 仍然出现 401 错误？

**A:** 检查以下几点：
1. 确认 `.env.local` 文件存在且配置正确
2. 确认已重启开发服务器
3. 检查控制台是否有错误日志
4. 确认数据库连接正常

### Q: Demo 登录失败？

**A:** Demo 登录不需要数据库，但需要：
1. `NEXTAUTH_SECRET` 已设置
2. `NEXTAUTH_URL` 设置为 `http://localhost:3000`
3. 服务器已重启

### Q: 邮箱登录失败？

**A:** 邮箱登录需要：
1. 先注册账号（点击"注册"标签）
2. 确认邮箱和密码正确
3. 数据库连接正常

### Q: 如何查看详细错误信息？

**A:** 
1. 打开浏览器开发者工具（F12）
2. 查看 Console 标签的日志
3. 查看 Network 标签的请求详情
4. 检查服务器终端输出的日志

## 调试步骤

如果问题仍然存在，按以下步骤调试：

1. **检查环境变量**
   ```bash
   cat .env.local | grep NEXTAUTH
   ```

2. **检查数据库连接**
   ```bash
   npx prisma db push
   ```

3. **查看服务器日志**
   启动服务器后，查看终端输出的错误信息

4. **测试API端点**
   访问 http://localhost:3000/api/health 检查服务状态

5. **清除缓存**
   ```bash
   rm -rf .next
   npm run dev
   ```

## 联系支持

如果以上步骤都无法解决问题，请提供：
1. 错误日志（浏览器控制台和服务器终端）
2. `.env.local` 配置（隐藏敏感信息）
3. 数据库连接状态
4. Node.js 和 npm 版本

