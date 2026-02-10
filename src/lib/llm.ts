import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { decrypt } from './crypto';

export type LLMProvider = 'openai' | 'anthropic' | 'custom';

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  apiKey: string; // encrypted
  apiBaseUrl?: string | null;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export async function callLLM(
  config: LLMConfig,
  messages: LLMMessage[],
  options?: {
    maxTokens?: number;
    temperature?: number;
  }
): Promise<LLMResponse> {
  const decryptedApiKey = decrypt(config.apiKey);
  const maxTokens = options?.maxTokens ?? 2048;
  const temperature = options?.temperature ?? 0.7;

  if (config.provider === 'anthropic') {
    return callAnthropic(decryptedApiKey, config.model, messages, maxTokens, temperature);
  } else {
    // openai or custom (custom uses OpenAI-compatible API)
    return callOpenAI(
      decryptedApiKey,
      config.model,
      messages,
      maxTokens,
      temperature,
      config.apiBaseUrl
    );
  }
}

async function callOpenAI(
  apiKey: string,
  model: string,
  messages: LLMMessage[],
  maxTokens: number,
  temperature: number,
  baseURL?: string | null
): Promise<LLMResponse> {
  const client = new OpenAI({
    apiKey,
    baseURL: baseURL || undefined,
  });

  const response = await client.chat.completions.create({
    model,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    max_tokens: maxTokens,
    temperature,
  });

  const choice = response.choices[0];
  return {
    content: choice.message?.content || '',
    usage: response.usage
      ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        }
      : undefined,
  };
}

async function callAnthropic(
  apiKey: string,
  model: string,
  messages: LLMMessage[],
  maxTokens: number,
  temperature: number
): Promise<LLMResponse> {
  const client = new Anthropic({
    apiKey,
  });

  // Extract system message if present
  const systemMessage = messages.find((m) => m.role === 'system');
  const nonSystemMessages = messages.filter((m) => m.role !== 'system');

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemMessage?.content,
    messages: nonSystemMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  });

  const textContent = response.content.find((c) => c.type === 'text');
  return {
    content: textContent?.text || '',
    usage: {
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
    },
  };
}
