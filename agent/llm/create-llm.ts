import { ChatOpenAI } from "@langchain/openai";
import type { CreateLLMParams } from "../types/index.js";

export function createLLM(params: CreateLLMParams) {
  return new ChatOpenAI({
    apiKey: params.apiKey,
    model: params.model,
    configuration: { baseURL: params.baseUrl },
    temperature: params.temperature,
  });
}
