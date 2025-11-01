# 如何获取通义千问 DashScope API Key

## 重要说明

您目前拥有的是 **阿里云 AccessKey**（`accessKeyId` 和 `accessKeySecret`），但通义千问的 **OpenAI 兼容模式**需要的是 **DashScope API Key**（格式：`sk-xxx`）。

## 获取步骤

### 1. 登录阿里云百炼控制台

访问：https://bailian.console.aliyun.com/

使用您的阿里云账号登录（就是拥有 AccessKey 的那个账号）。

### 2. 进入 API-KEY 管理页面

1. 在控制台左侧菜单找到 **API-KEY 管理**
2. 或者直接访问：https://bailian.console.aliyun.com/#/api-key

### 3. 创建 API Key

1. 点击 **创建 API Key** 按钮
2. 输入 API Key 的名称（可选，如：`interview-copilot`）
3. 点击 **创建**
4. **重要**：创建后立即复制 API Key，因为只显示一次！

### 4. API Key 格式

API Key 格式类似：
```
sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

以 `sk-` 开头，后面跟着一串字符。

### 5. 配置到项目

在项目根目录的 `.env.local` 文件中添加：

```env
# 通义千问 DashScope API Key
DASHSCOPE_API_KEY=sk-你的API-Key-这里
```

**注意**：
- 请妥善保管 API Key，不要提交到代码仓库
- API Key 与 AccessKey 是不同的，不能混用
- API Key 用于 DashScope API 调用
- AccessKey 用于阿里云其他服务的签名认证

## AccessKey vs API Key

| 类型 | 用途 | 格式 | 示例 |
|------|------|------|------|
| **AccessKey** | 阿里云服务签名认证 | `LTAI5t...` / `jCogIa...` | 您当前拥有的 |
| **API Key** | DashScope API 调用 | `sk-xxx...` | 需要创建的 |

## 免费额度

开通百炼服务后，通常会有免费额度：
- 文本生成：一定的免费 token 额度
- 语音转文字：36,000秒（10小时）免费额度（90天内有效）

## 如果无法创建 API Key

如果您在百炼控制台找不到 API Key 管理页面，可能需要：
1. 先开通百炼服务
2. 确认账号权限
3. 联系阿里云客服

## 临时解决方案

如果您暂时无法获取 API Key，但想继续开发，可以：
1. 使用模拟数据（代码中已有 fallback）
2. 或者实现 AccessKey 签名认证（需要修改代码，较复杂）

建议优先获取 API Key，这是最简单的方式。

