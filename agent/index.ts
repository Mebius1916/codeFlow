import { createLLM } from "./llm/createLLM.js";
import { diffPng } from "./utils/diffPng.js";
import type { RunVisualRepairParams, VisualDiffParams } from "./interfaces/runtime.js";
import { runVisualRepairLoop } from "./runtime/loop.js";

export function visualDiff(params: VisualDiffParams) {
  const {
    baselinePngBase64,
    currentPngBase64,
    html,
    model,
    apiKey,
    baseUrl,
    temperature,
    threshold,
  } = params;
  const diff = diffPng(baselinePngBase64, currentPngBase64, threshold);

  const runParams = {
    baselinePngBase64,
    currentPngBase64,
    diffPngBase64: diff.diffBase64,
    diffRatio: diff.diffRatio,
    similarity: 1 - diff.diffRatio,
    html,
    model,
    apiKey,
    baseUrl,
    temperature,
  } satisfies RunVisualRepairParams;

  const llm = createLLM({
    model,
    apiKey,
    baseUrl,
    temperature,
  });

  return runVisualRepairLoop(llm, runParams);
}
