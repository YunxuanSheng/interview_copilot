# AI面试助理

基于思维导图设计的AI驱动面试管理平台，专注于面试进度管理和过程记录。

## 功能特性

### 🎯 核心功能

- **面试进度管理** - 智能管理面试日程和进度
- **面试过程记录** - 记录和分析面试过程
- **个人面经库** - 个人面试经验数据库
- **个人档案管理** - 用户个人信息和简历管理

### 🚀 技术栈

- **前端**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **后端**: Next.js API Routes, Prisma ORM
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **认证**: NextAuth.js
- **AI服务**: OpenAI API (语音转文字 + 文本分析)

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd interview_copilot
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **环境配置**
   ```bash
   cp .env.example .env.local
   ```
   
   编辑 `.env.local` 文件，配置以下环境变量：
   ```env
   # 数据库
   DATABASE_URL="file:./dev.db"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"
   
   # Google OAuth (可选)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   
   # OpenAI API (可选)
   OPENAI_API_KEY="your-openai-api-key"
   ```

4. **初始化数据库**
   ```bash
   npx prisma db push
   ```

5. **启动开发服务器**
   ```bash
   npm run dev
   ```

6. **访问应用**
   打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── auth/          # 认证相关
│   │   ├── ai/            # AI 功能
│   │   ├── schedules/     # 面试日程
│   │   ├── interviews/    # 面试记录
│   │   ├── experiences/   # 面经库
│   │   └── user/          # 用户管理
│   ├── auth/              # 认证页面
│   ├── schedules/         # 面试日程页面
│   ├── interviews/        # 面试记录页面
│   ├── experiences/       # 面经库页面
│   ├── profile/          # 个人档案页面
│   └── layout.tsx        # 根布局
├── components/            # React 组件
│   ├── ui/               # UI 组件库
│   ├── auth-provider.tsx # 认证提供者
│   ├── navigation.tsx    # 导航组件
│   └── dashboard.tsx     # 仪表板组件
├── lib/                   # 工具库
│   ├── auth.ts           # 认证配置
│   ├── prisma.ts         # Prisma 客户端
│   └── utils.ts          # 工具函数
└── prisma/               # 数据库模式
    └── schema.prisma     # Prisma 模式文件
```

## 主要功能说明

### 1. 面试进度管理

- 创建和管理面试日程
- 支持日历视图和列表视图
- 按公司、职位、部门分组
- 面试轮次关联管理

### 2. 面试记录复盘

- 录音文件上传和语音转文字
- AI题库整理和评价
- 面试建议生成
- 题目导出到面经库

### 3. 个人面经库

- 按公司和题型分类管理
- 面试题目和答案记录
- 难度等级标记
- 搜索和筛选功能

### 4. 个人档案管理

- 个人信息维护
- 简历上传功能
- 账户设置管理

## API 接口

### 认证相关
- `POST /api/auth/signin` - 用户登录
- `POST /api/auth/signout` - 用户登出

### 面试日程
- `GET /api/schedules` - 获取面试日程列表
- `POST /api/schedules` - 创建面试日程
- `GET /api/schedules/:id` - 获取面试日程详情
- `PUT /api/schedules/:id` - 更新面试日程
- `DELETE /api/schedules/:id` - 删除面试日程

### 面试记录
- `GET /api/interviews` - 获取面试记录列表
- `POST /api/interviews` - 创建面试记录
- `GET /api/interviews/:id` - 获取面试记录详情

### 面经库
- `GET /api/experiences` - 获取面经列表
- `POST /api/experiences` - 添加面经记录
- `GET /api/experiences/:id` - 获取面经详情

### AI 功能
- `POST /api/ai` - AI 功能统一接口
  - `parse-email` - 解析邮件内容
  - `transcribe` - 语音转文字
  - `analyze` - 分析面试内容

## 数据库设计

### 核心表结构

- **users** - 用户表
- **interview_schedules** - 面试日程表
- **interview_records** - 面试记录表
- **interview_questions** - 面试题目表
- **personal_experiences** - 个人面经库表

## 部署说明

### Vercel 部署

1. 连接 GitHub 仓库到 Vercel
2. 配置环境变量
3. 设置数据库连接
4. 部署应用

### 环境变量配置

生产环境需要配置以下环境变量：

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-production-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
OPENAI_API_KEY="your-openai-api-key"
```

## 开发指南

### 代码规范

- 使用 TypeScript 进行类型检查
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码
- 组件使用函数式组件和 Hooks

### 提交规范

```bash
# 功能开发
git commit -m "feat: 添加面试日程管理功能"

# 问题修复
git commit -m "fix: 修复用户认证问题"

# 文档更新
git commit -m "docs: 更新README文档"
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

如有问题或建议，请通过以下方式联系：

- 项目 Issues: [GitHub Issues](https://github.com/your-username/interview_copilot/issues)
- 邮箱: your-email@example.com

---

**注意**: 这是一个演示项目，AI功能目前使用模拟数据。在生产环境中需要集成真实的AI服务。