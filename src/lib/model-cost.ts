/**
 * 模型成本和定价配置
 * 基于通义千问和 OpenAI 的实际定价
 */

export type ModelProvider = 'dashscope' | 'openai' | 'tencent'
export type ModelName = 'qwen-turbo' | 'qwen-plus' | 'qwen-max' | 'gpt-4' | 'gpt-3.5-turbo' | 'gpt-4-turbo' | 'tencent-asr'

// 模型定价（每1000 tokens，人民币）
export const MODEL_PRICING: Record<ModelName, {
  prompt: number    // 输入 tokens 价格（元/1K tokens）
  completion: number // 输出 tokens 价格（元/1K tokens）
  provider: ModelProvider
}> = {
  // 通义千问定价（2024年）
  'qwen-turbo': {
    prompt: 0.003,
    completion: 0.003,
    provider: 'dashscope'
  },
  'qwen-plus': {
    prompt: 0.008,
    completion: 0.008,
    provider: 'dashscope'
  },
  'qwen-max': {
    prompt: 0.02,
    completion: 0.02,
    provider: 'dashscope'
  },
  // OpenAI 定价（美元转换为人民币，汇率按 7.2 计算）
  'gpt-3.5-turbo': {
    prompt: 0.0015 * 7.2,      // $0.0015/1K tokens
    completion: 0.002 * 7.2,   // $0.002/1K tokens
    provider: 'openai'
  },
  'gpt-4': {
    prompt: 0.03 * 7.2,         // $0.03/1K tokens
    completion: 0.06 * 7.2,     // $0.06/1K tokens
    provider: 'openai'
  },
  'gpt-4-turbo': {
    prompt: 0.01 * 7.2,         // $0.01/1K tokens
    completion: 0.03 * 7.2,     // $0.03/1K tokens
    provider: 'openai'
  },
  // 腾讯云 ASR（按小时计费，这里估算）
  'tencent-asr': {
    prompt: 0.006,              // 估算值，按分钟计
    completion: 0,
    provider: 'tencent'
  }
}

// 服务类型到模型的映射
export const SERVICE_MODEL_MAP: Record<string, {
  model: ModelName
  estimatedPromptTokens?: number    // 估算的输入 tokens
  estimatedCompletionTokens?: number // 估算的输出 tokens
}> = {
  'interview_analysis': {
    model: 'qwen-turbo',
    estimatedPromptTokens: 2000,
    estimatedCompletionTokens: 1500
  },
  'audio_transcription': {
    model: 'tencent-asr',
    estimatedPromptTokens: 0,
    estimatedCompletionTokens: 0
  },
  'suggestion_generation': {
    model: 'qwen-turbo',
    estimatedPromptTokens: 1000,
    estimatedCompletionTokens: 500
  },
  'job_parsing': {
    model: 'qwen-turbo',
    estimatedPromptTokens: 1500,
    estimatedCompletionTokens: 800
  },
  'resume_parsing': {
    model: 'qwen-turbo',
    estimatedPromptTokens: 2000,
    estimatedCompletionTokens: 1000
  },
  'email_parsing': {
    model: 'qwen-turbo',
    estimatedPromptTokens: 1200,
    estimatedCompletionTokens: 600
  }
}

/**
 * 计算模型调用成本
 */
export function calculateModelCost(
  modelName: ModelName,
  promptTokens: number = 0,
  completionTokens: number = 0
): number {
  const pricing = MODEL_PRICING[modelName]
  if (!pricing) {
    return 0
  }

  const promptCost = (promptTokens / 1000) * pricing.prompt
  const completionCost = (completionTokens / 1000) * pricing.completion
  return promptCost + completionCost
}

/**
 * 估算服务类型的成本（基于估算 tokens）
 */
export function estimateServiceCost(serviceType: string): number {
  const config = SERVICE_MODEL_MAP[serviceType]
  if (!config) {
    return 0
  }

  const promptTokens = config.estimatedPromptTokens || 0
  const completionTokens = config.estimatedCompletionTokens || 0
  return calculateModelCost(config.model, promptTokens, completionTokens)
}

/**
 * 获取模型信息
 */
export function getModelInfo(modelName: string): {
  name: ModelName
  provider: ModelProvider
  pricing: typeof MODEL_PRICING[ModelName]
} | null {
  const model = modelName as ModelName
  if (!MODEL_PRICING[model]) {
    return null
  }

  return {
    name: model,
    provider: MODEL_PRICING[model].provider,
    pricing: MODEL_PRICING[model]
  }
}

/**
 * 格式化成本显示
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `¥${(cost * 1000).toFixed(2)}分`
  }
  return `¥${cost.toFixed(4)}`
}

