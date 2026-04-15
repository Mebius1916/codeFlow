import { analyzeVisualDiff } from "./analyzeVisualDiff.js";
import { createLLM } from "./createLLM.js";
import { fixHtml } from "./fixHtml.js";

import type { RunAgentParams } from "../types/index.js";

export async function runAgent(params: RunAgentParams): Promise<string> {
  const llm = createLLM({ 
    model: params.model, 
    apiKey: params.apiKey, 
    baseUrl: params.baseUrl 
  });
  const analysisJson = await analyzeVisualDiff(llm, params);
  return fixHtml(llm, { analysisJson, html: params.html });
}
