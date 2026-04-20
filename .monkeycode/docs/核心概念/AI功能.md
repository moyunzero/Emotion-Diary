# AI 功能

## 概述

应用集成 AI 能力，提供情绪预测和智能播客生成功能。

## 技术选型

| 项目 | 技术 |
|------|------|
| **模型** | Groq API (llama-3.3-70b) |
| **调用方式** | REST API |
| **密钥** | `EXPO_PUBLIC_GROQ_API_KEY` |

## 功能

### 1. 情绪预测

基于历史情绪数据，预测未来一段时间的情绪趋势。

```typescript
interface EmotionForecast {
  predictions: {
    date: string;                    // 日期
    predictedMoodLevel: number;     // 预测情绪等级
    confidence: number;              // 置信度 0-1
    riskLevel: 'high' | 'medium' | 'low'; // 风险等级
  }[];
  warnings: {
    date: string;
    message: string;                // 预警消息
    severity: 'high' | 'medium' | 'low';
  }[];
  summary: string;                   // 总结
  lastUpdated?: number;              // 更新时间
}
```

#### 生成流程

```
输入: entries[], days (预测天数)
     │
     ▼
构建 Prompt (few-shot examples)
     │
     ▼
调用 Groq API
     │
     ▼
解析 JSON 响应
     │
     ▼
存储到 store.emotionForecast
```

#### Prompt 示例

```
基于以下情绪记录，预测未来7天的情绪趋势：

[情绪记录...]
[示例输出格式...]

请以JSON格式返回预测结果。
```

### 2. 情绪播客

生成周期性的情绪总结播客内容。

```typescript
interface EmotionPodcast {
  content: string;        // 播客文本内容
  period: 'week' | 'month'; // 周期
  generatedAt: number;    // 生成时间
}
```

#### 生成流程

```
输入: period ('week' | 'month'), entries[]
     │
     ▼
构建 Prompt (角色设定 + 数据)
     │
     ▼
调用 Groq API
     │
     ▼
解析响应 (Markdown 格式)
     │
     ▼
存储到 store.emotionPodcast
```

## API 调用

### AI Service

```typescript
// utils/aiService.ts

export const generateForecast = async (
  entries: MoodEntry[],
  days: number = 7
): Promise<EmotionForecast> => {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.EXPO_PUBLIC_GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: '你是一个情绪分析助手...',
        },
        {
          role: 'user', 
          content: buildForecastPrompt(entries, days),
        },
      ],
    }),
  });
  
  return JSON.parse(response.choices[0].message.content);
};
```

### Store 集成

```typescript
// store/modules/ai.ts

const generateForecast = async (days?: number) => {
  const { entries } = get();
  
  // 调用 AI service
  const forecast = await aiService.generateForecast(entries, days);
  
  set({ emotionForecast: forecast });
};
```

## 错误处理

| 错误 | 处理 |
|------|------|
| API Key 未配置 | 提示用户配置 |
| 网络错误 | 显示错误提示，允许重试 |
| 解析失败 | 使用默认空结果 |
| 配额超限 | 显示提示，优雅降级 |

## 使用场景

### Dashboard

显示近期情绪预测和风险预警。

### Insights 页面

展示 AI 生成的情绪播客内容。

### 通知提醒

基于预测结果，在高风险日期发送通知提醒。

## 隐私考虑

- AI 调用仅使用必要的情绪数据
- 不包含可识别个人信息
- 数据不持久化在 AI 服务端

---

*最后更新: 2026-04-20*
