/**
 * Factory for LangChain chat models: OpenAI (openai/groq) and Anthropic (Claude).
 * Used by queryApi to invoke the correct model per provider.
 */

import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import type { BaseMessage } from "@langchain/core/messages";
import type { LLMProvider } from "./llmProviders";
import { LLM_PROVIDERS, resolveModel } from "./llmProviders";

export interface InvokableChatModel {
  invoke(messages: BaseMessage[]): Promise<{ content: string }>;
}

export function createChatModel(
  provider: LLMProvider,
  modelName: string
): InvokableChatModel {
  const config = LLM_PROVIDERS[provider];
  if (!config?.apiKey) {
    throw new Error(`Provider ${provider} has no API key`);
  }

  if (provider === "anthropic") {
    return new ChatAnthropic({
      model: modelName,
      temperature: 0.7,
      maxTokens: 1500,
      anthropicApiKey: config.apiKey,
    }) as unknown as InvokableChatModel;
  }

  return new ChatOpenAI({
    modelName,
    temperature: 0.7,
    maxTokens: 1500,
    apiKey: config.apiKey,
    ...(config.endpoint && { configuration: { baseURL: config.endpoint } }),
  }) as unknown as InvokableChatModel;
}

/** Resolve model name for a provider (user preference or default). */
export function getModelForProvider(
  provider: LLMProvider,
  userModel: string | undefined
): string {
  return resolveModel(provider, userModel);
}
