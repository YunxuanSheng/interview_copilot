# 腾讯云语音识别配置指南

已成功集成腾讯云录音文件识别服务，支持中英文混合识别，准确率97.2%。

## 📋 环境变量配置

在项目根目录的 `.env.local` 文件中添加：

```env
# 腾讯云语音识别配置（必需）
# 请在腾讯云控制台获取您的 SecretId 和 SecretKey
# https://console.cloud.tencent.com/cam/capi
TENCENTCLOUD_SECRET_ID=your-tencent-cloud-secret-id
TENCENTCLOUD_SECRET_KEY=your-tencent-cloud-secret-key
```

## 🎯 功能特点

### 优先使用腾讯云ASR
- ✅ 系统会**优先**使用腾讯云语音识别
- ✅ 如果腾讯云失败，自动回退到通义千问ASR
- ✅ 无需修改代码，自动选择最优服务

### 腾讯云ASR优势
- ✅ **中英文混合识别准确率 97.2%**
- ✅ 支持多种方言（30种方言，准确率92%）
- ✅ 支持长音频（最多5小时）
- ✅ 识别完成后自动进行说话人分离
- ✅ 成本：约 **0.6-1.0元/次**（30分钟面试）

## 🔄 使用流程

1. **自动选择服务**：
   - 如果配置了 `TENCENTCLOUD_SECRET_ID` 和 `TENCENTCLOUD_SECRET_KEY`，优先使用腾讯云
   - 如果腾讯云不可用或失败，自动切换到通义千问ASR

2. **识别流程**：
   ```
   上传音频 → 创建识别任务 → 轮询查询结果 → 返回转录文本 → 说话人分离
   ```

3. **等待时间**：
   - 腾讯云采用异步识别，需要轮询查询结果
   - 通常30分钟音频需要等待 **30-60秒**
   - 最长等待时间：5分钟

## 📊 成本对比

| 服务 | 一次30分钟面试成本 | 特点 |
|------|------------------|------|
| **腾讯云录音文件识别** | **￥0.6-1.0** ⭐ | 准确率高，中英文混合97.2% |
| 通义千问ASR | 免费（有限制） | 文件≤10MB，时长≤3分钟 |

## ⚙️ 配置说明

### 腾讯云地域
默认使用 `ap-shanghai`（上海），如需修改，编辑 `src/app/api/ai/route.ts`：

```typescript
region: 'ap-shanghai', // 可改为: ap-beijing, ap-guangzhou 等
```

### 识别引擎
当前使用 `16k_zh`（16k中文），支持中英文混合识别。

如需更改引擎类型，修改 `transcribeWithTencentCloudASR` 函数中的 `EngineModelType` 参数。

## 🔍 故障排查

### 1. 客户端初始化失败
- **检查**：确认 `TENCENTCLOUD_SECRET_ID` 和 `TENCENTCLOUD_SECRET_KEY` 已正确配置
- **检查**：确认已运行 `npm install tencentcloud-sdk-nodejs-asr`
- **查看**：服务器启动日志，应显示 "✅ 腾讯云ASR客户端初始化成功"

### 2. 识别任务创建失败
- **检查**：确认 SecretId 和 SecretKey 正确且有效
- **检查**：确认已在腾讯云控制台开通语音识别服务
- **查看**：服务器日志中的错误信息

### 3. 识别超时
- **原因**：音频文件过大或格式不兼容
- **解决**：检查音频格式，推荐使用 MP3 或 WAV
- **说明**：系统最多等待5分钟，超过会自动报错

### 4. 自动回退到通义千问
- **原因**：腾讯云识别失败或超时
- **说明**：这是正常的降级机制，确保服务可用性
- **查看**：服务器日志会显示 "⚠️ 腾讯云ASR调用失败，回退到通义千问ASR"

## 📚 相关文档

- [腾讯云语音识别文档](https://cloud.tencent.com/document/product/1093)
- [录音文件识别API](https://cloud.tencent.com/document/product/1093/37823)
- [音频格式指南](./AUDIO_FORMAT_GUIDE.md)

## 🎉 开始使用

1. **配置环境变量**：在 `.env.local` 中添加 SecretId 和 SecretKey
2. **重启服务器**：`npm run dev`
3. **上传音频**：在面试页面上传音频文件
4. **查看日志**：服务器会显示使用的服务（腾讯云或通义千问）

现在您可以使用腾讯云高质量的中英文混合语音识别了！🚀

