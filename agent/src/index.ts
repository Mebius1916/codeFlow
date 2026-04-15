import { diffPng } from "./utils/diffPng.js";
import { runAgent, type RunAgentParams } from "./core/runAgent.js";

export type { RunAgentParams };

export type VisualDiffParams = {
  baselinePngBase64: string;
  currentPngBase64: string;
  model: string;
  apiKey: string;
  baseUrl?: string;
};

export function visualDiff(params: VisualDiffParams) {
  const { baselinePngBase64, currentPngBase64, model, apiKey, baseUrl } = params;
  const diff = diffPng(baselinePngBase64, currentPngBase64);

  return runAgent({
    baselinePngBase64,
    currentPngBase64,
    diffPngBase64: diff.diffBase64,
    diffRatio: diff.diffRatio,
    similarity: 1 - diff.diffRatio,
    model,
    apiKey,
    baseUrl,
  });
}
