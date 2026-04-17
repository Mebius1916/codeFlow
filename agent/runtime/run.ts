import { createLLM } from "../llm/create-llm.js";
import type { RunVisualRepairParams } from "../types/index.js";
import { runVisualRepairLoop } from "./loop.js";

export async function runVisualRepair(
  params: RunVisualRepairParams
): Promise<string> {
  const llm = createLLM({
    model: params.model,
    apiKey: params.apiKey,
    baseUrl: params.baseUrl,
    temperature: params.temperature,
  });

  return runVisualRepairLoop(llm, params);
}
