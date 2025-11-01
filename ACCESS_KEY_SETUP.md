# AccessKey 配置指南

## 重要说明

您当前提供的是阿里云 **AccessKey**（`accessKeyId` 和 `accessKeySecret`），但通义千问的 **OpenAI 兼容模式**需要的是 **DashScope API Key**（格式：`sk-xxx`）。

## 解决方案

### 方案一：获取 DashScope API Key（推荐）

1. 访问 [阿里云百炼控制台](https://bailian.console.aliyun.com/)
2. 登录您的阿里云账号
3. 进入 **API-KEY 管理** 页面
4. 创建新的 API Key
5. 复制 API Key（格式类似：`sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）

然后在 `.env.local` 中配置：
```env
DASHSCOPE_API_KEY=sk-your-api-key-here
```

### 方案二：使用 AccessKey 签名认证（需要修改代码）

如果您必须使用 AccessKey，需要：
1. 实现阿里云签名算法（复杂）
2. 直接使用 DashScope 原生 API（不使用 OpenAI 兼容模式）

## AccessKey 认证方式

如果您需要暂时使用 AccessKey，可以在 `.env.local` 中配置（用于签名认证）：

```env
# 阿里云 AccessKey（用于签名认证）
ALIBABA_ACCESS_KEY_ID=LTAI5tASfxVXm5TCzmfJK2a6
ALIBABA_ACCESS_KEY_SECRET=jCogIayDWGaAddHEJ6tqi0hz1KXzSu

# 如果获取到 DashScope API Key，使用这个（优先级更高）
# DASHSCOPE_API_KEY=sk-xxx
```

**注意**：使用 AccessKey 需要实现签名算法，代码会更复杂。建议优先使用方案一。

