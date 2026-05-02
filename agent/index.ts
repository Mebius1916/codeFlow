import { runVisualRepair } from "./runtime/run.js";
import { diffPng } from "./utils/diffPng.js";
import type { RunVisualRepairParams, VisualDiffParams } from "./interfaces/runtime.js";

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

  return runVisualRepair({
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
  } satisfies RunVisualRepairParams);
}
