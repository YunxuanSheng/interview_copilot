# 故障排查指南

## 401 Unauthorized 错误

如果登录时出现 `401 Unauthorized` 错误，请按以下步骤排查：

### 1. 检查环境变量

确保 `.env.local` 文件包含以下必需配置：

```env
# NextAuth 配置（必需）
NEXTAUTH_URL="http://localhost:3000"  # 本地开发必须是这个
NEXTAUTH_SECRET="your-secret-key-here"  # 必须设置

# 数据库配置（必需）
DATABASE_URL="your-database-url"
```

### 2. 验证用户是否存在

**方法1：使用 Demo 登录**
- Demo 登录不需要数据库，可以直接测试认证流程

**方法2：注册新用户**
1. 在登录页面点击"注册"标签
2. 填写邮箱、密码和姓名
3. 同意条款后注册
4. 注册成功后使用该账号登录

**方法3：检查数据库**
```bash
# 使用 Prisma Studio 查看数据库
npx prisma studio
```

### 3. 检查服务器日志

启动开发服务器后，查看终端输出：

1. **成功的认证流程应该看到：**
   ```
   [Auth] Credentials authorize called with email: xxx@example.com
   [Auth] Credentials authorization successful for user: xxx@example.com
   [Auth] User signed in: { userId: '...', email: '...', provider: 'credentials' }
   ```

2. **如果看到错误：**
   - `[Auth] User not found` - 用户不存在，需要先注册
   - `[Auth] Invalid password` - 密码错误
   - `[Auth] Database connection error` - 数据库连接失败

### 4. 常见问题和解决方案

#### 问题1：用户不存在
**解决方案：**
- 先注册账号
- 或者使用 Demo 登录

#### 问题2：密码错误
**解决方案：**
- 确认密码正确
- 或者使用"忘记密码"功能（如果已实现）

#### 问题3：数据库连接失败
**解决方案：**
```bash
# 测试数据库连接
npx prisma db push

# 如果失败，检查 DATABASE_URL 是否正确
```

#### 问题4：NEXTAUTH_SECRET 未设置
**解决方案：**
```bash
# 生成新的密钥
openssl rand -base64 32

# 或者访问
# https://generate-secret.vercel.app/32
```

### 5. 调试步骤

1. **清除缓存并重启**
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **检查浏览器控制台**
   - 打开开发者工具（F12）
   - 查看 Console 标签的错误信息
   - 查看 Network 标签的请求详情

3. **测试 API 端点**
   ```bash
   # 健康检查
   curl http://localhost:3000/api/health
   
   # 测试认证
   curl -X POST http://localhost:3000/api/auth/callback/credentials \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}'
   ```

## React Hydration Mismatch 警告

这个警告通常是由以下原因引起的：

### 1. 浏览器扩展
**症状：** 看到 `jf-ext-*` 属性
**原因：** 浏览器扩展（如翻译工具、广告拦截器等）修改了 HTML
**解决方案：**
- 禁用浏览器扩展后重试
- 或者在隐私/无痕模式下测试
- **这不影响功能，可以忽略**

### 2. 客户端/服务器不一致
**症状：** 服务端渲染的内容与客户端不匹配
**解决方案：**
- 确保组件不依赖 `Date.now()`、`Math.random()` 等动态值
- 避免在 SSR 组件中使用 `typeof window !== 'undefined'` 判断

### 3. 日期格式化
**症状：** 日期显示不一致
**解决方案：**
- 使用统一的日期格式化函数
- 在客户端进行日期格式化

## 其他常见问题

### Q: Demo 登录失败？
**A:** 检查：
1. `NEXTAUTH_SECRET` 是否设置
2. 服务器是否已重启
3. 查看服务器日志的错误信息

### Q: 注册成功但无法登录？
**A:** 检查：
1. 注册时密码是否正确保存
2. 登录时输入的邮箱和密码是否完全匹配（注意大小写和空格）
3. 数据库中的用户记录是否正确

### Q: 登录成功但会话不持久？
**A:** 检查：
1. Cookie 设置是否正确
2. 浏览器是否允许 Cookie
3. `NEXTAUTH_URL` 是否与访问地址一致

## 获取帮助

如果以上步骤都无法解决问题，请提供：

1. **错误日志**
   - 服务器终端输出
   - 浏览器控制台错误

2. **环境信息**
   ```bash
   node --version
   npm --version
   cat .env.local | grep -E "NEXTAUTH|DATABASE"  # 隐藏敏感信息
   ```

3. **复现步骤**
   - 详细的操作步骤
   - 预期结果 vs 实际结果

4. **相关代码**
   - 修改的文件
   - 错误堆栈信息

