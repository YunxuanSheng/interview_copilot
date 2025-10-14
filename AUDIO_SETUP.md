# 音频转文字功能设置指南

## 环境变量配置

在项目根目录创建 `.env.local` 文件，并添加以下配置：

```bash
# 数据库配置
DATABASE_URL="file:./dev.db"

# NextAuth配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# OpenAI配置（用于语音转文字）
OPENAI_API_KEY="your-openai-api-key-here"

# 其他配置
NODE_ENV="development"
```

## 获取OpenAI API密钥

1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 注册或登录账户
3. 进入 API Keys 页面
4. 创建新的API密钥
5. 将密钥复制到 `.env.local` 文件中的 `OPENAI_API_KEY` 字段

## 功能说明

### 支持的音频格式
- MP3 (.mp3)
- WAV (.wav)
- M4A (.m4a)
- OGG (.ogg)

### 文件大小限制
- 最大文件大小：100MB
- 推荐文件大小：< 50MB（处理速度更快）

### 使用方法

1. **在面试复盘页面使用**：
   - 访问 `/interviews/new`
   - 上传音频文件
   - 点击"语音转文字"按钮
   - 等待处理完成

2. **测试页面**：
   - 访问 `/test-audio`
   - 上传音频文件进行测试

### 技术实现

- 使用 OpenAI Whisper API 进行语音转文字
- 支持中文语音识别
- 自动降级到模拟数据（如果API不可用）
- 文件类型和大小验证

### 故障排除

1. **API密钥错误**：
   - 检查 `.env.local` 文件中的 `OPENAI_API_KEY` 是否正确
   - 确保API密钥有足够的额度

2. **文件上传失败**：
   - 检查文件格式是否支持
   - 检查文件大小是否超过限制

3. **转文字失败**：
   - 检查网络连接
   - 查看浏览器控制台错误信息
   - 系统会自动降级到模拟数据

### 成本说明

- OpenAI Whisper API 按使用量计费
- 建议先使用测试页面验证功能
- 可以设置使用限制来控制成本
