# 通义千问配置指南

本项目已集成阿里云通义千问API，使用OpenAI兼容模式，方便国内使用且成本更低。

## 环境变量配置

### 1. 获取API Key

1. 访问 [阿里云百炼平台](https://bailian.console.aliyun.com/)
2. 登录阿里云账号
3. 在控制台中获取您的 API Key（格式类似：`sk-xxx`）

### 2. 配置环境变量

在项目根目录创建或编辑 `.env.local` 文件，添加以下配置：

```env
# 通义千问 DashScope API Key（必需）
DASHSCOPE_API_KEY=sk-your-dashscope-api-key-here

# 或者继续使用旧的变量名（向后兼容）
# OPENAI_API_KEY=sk-your-dashscope-api-key-here
```

**注意**: 
- `DASHSCOPE_API_KEY` 优先级更高，如果两个都设置了，会优先使用 `DASHSCOPE_API_KEY`
- API Key 格式类似：`sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- 请妥善保管您的 API Key，不要提交到代码仓库

## 模型说明

项目已配置以下通义千问模型：

### 文本生成模型
- **qwen-plus**: 高性能模型，用于复杂分析任务（如长文本面试分析）
- **qwen-turbo**: 快速响应模型，用于一般任务（如姓名检测、简历解析等）

### 语音识别模型
- **qwen3-asr-flash**: 用于音频转文字功能
  - 支持多语言识别
  - 支持逆文本规范化（ITN）
  - 免费额度：36,000秒（10小时），有效期：开通后90天内

## 功能对应关系

### 已替换的功能

1. **面试分析** (`/api/ai`)
   - 原来: GPT-4o / GPT-4o-mini
   - 现在: qwen-plus / qwen-turbo
   - 功能: 分析面试对话，生成评价和建议

2. **语音转文字** (`/api/ai`)
   - 原来: OpenAI Whisper API
   - 现在: 通义千问 ASR (qwen3-asr-flash)
   - 功能: 将面试录音转换为文字

3. **姓名检测** (`/api/ai/detect-names`)
   - 原来: GPT-3.5-turbo
   - 现在: qwen-turbo
   - 功能: 从文本中检测中文人名

4. **简历解析** (`/api/ai/parse-resume`)
   - 原来: GPT-4o-mini
   - 现在: qwen-turbo
   - 功能: 解析简历文件，提取结构化信息

5. **岗位描述解析** (`/api/ai/parse-job-description`)
   - 原来: GPT-3.5-turbo
   - 现在: qwen-turbo
   - 功能: 解析岗位描述，提取关键信息

6. **隐私处理** (`/api/ai/batch-privacy-process`)
   - 原来: GPT-3.5-turbo
   - 现在: qwen-turbo
   - 功能: 批量处理敏感信息脱敏

7. **工作经历卡片生成** (`/api/work-experiences/[id]/cards/generate`)
   - 原来: GPT-4o-mini
   - 现在: qwen-turbo
   - 功能: 基于工作经历生成面试问题

8. **建议生成** (`/api/work-experiences/[id]/cards/[cardId]/suggestion`)
   - 原来: GPT-4o-mini
   - 现在: qwen-turbo
   - 功能: 为面试问题生成回答建议

## API端点

### OpenAI兼容模式

所有文本生成功能都使用通义千问的OpenAI兼容接口：
- Base URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`
- 兼容OpenAI SDK的调用方式，无需修改业务代码

### DashScope原生API

语音转文字功能使用DashScope原生API：
- 使用 `dashscope.MultiModalConversation.call()` 方法
- 模型: `qwen3-asr-flash`

## 依赖安装

项目已添加 `dashscope` 依赖包，运行以下命令安装：

```bash
npm install
```

或单独安装：

```bash
npm install dashscope
```

## 成本优势

相比OpenAI API，通义千问具有以下优势：

1. **国内访问**: 无需代理，访问速度快
2. **成本更低**: 按量计费，价格更优惠
3. **免费额度**: ASR功能提供10小时免费额度
4. **中文优化**: 对中文场景优化更好

## 故障排查

### 1. API Key验证失败

**错误**: `通义千问 API 密钥验证失败`

**解决方案**:
- 检查 `.env.local` 文件中的 `DASHSCOPE_API_KEY` 是否正确
- 确认API Key格式为 `sk-` 开头
- 检查API Key是否过期或被禁用

### 2. 音频转录失败

**错误**: `通义千问ASR API错误`

**解决方案**:
- 确认音频文件格式支持（aac, amr, mp3, wav等）
- 检查音频文件大小（不超过10MB）
- 检查音频时长（不超过3分钟）
- 确认采样率为16kHz，单声道

### 3. 模型调用失败

**错误**: `模型不存在` 或 `模型不可用`

**解决方案**:
- 检查模型名称是否正确（qwen-plus, qwen-turbo等）
- 确认账号有该模型的使用权限
- 检查账号余额或配额是否充足

## 测试配置

运行以下命令测试API配置：

```bash
# 如果有测试脚本
npm run test:qwen
```

或手动测试：

1. 访问 `/api/ai` 端点
2. 发送测试请求
3. 查看控制台日志确认连接成功

## 参考文档

- [通义千问API文档](https://help.aliyun.com/zh/model-studio/developer-reference/api-details-9)
- [OpenAI兼容模式说明](https://help.aliyun.com/zh/model-studio/developer-reference/api-details-9)
- [DashScope SDK文档](https://help.aliyun.com/zh/model-studio/developer-reference/sdk-details)

## 注意事项

1. **API Key安全**: 永远不要将API Key提交到代码仓库
2. **速率限制**: 注意API的调用频率限制
3. **费用监控**: 定期检查API使用量和费用
4. **备份方案**: 建议保留OpenAI API Key作为备用

## 迁移说明

从OpenAI迁移到通义千问已完成以下变更：

✅ OpenAI客户端配置已更新为通义千问兼容模式
✅ 所有模型名称已替换为通义千问模型
✅ 音频转录功能已迁移到DashScope ASR API
✅ 环境变量支持向后兼容（OPENAI_API_KEY仍可使用）
✅ 错误处理和日志已更新

无需修改业务逻辑代码，所有API调用保持兼容。

