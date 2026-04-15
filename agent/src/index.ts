import { diffPng } from "./utils/diffPng.js";
import { runAgent } from "./core/runAgent.js";
import type { RunAgentParams, VisualDiffParams } from "./types/index.js";

export type { RunAgentParams };
export type { VisualDiffParams };

export function visualDiff(params: VisualDiffParams) {
  const { baselinePngBase64, currentPngBase64, html, model, apiKey, baseUrl } = params;
  const diff = diffPng(baselinePngBase64, currentPngBase64);

  return runAgent({
    baselinePngBase64,
    currentPngBase64,
    diffPngBase64: diff.diffBase64,
    diffRatio: diff.diffRatio,
    similarity: 1 - diff.diffRatio,
    html,
    model,
    apiKey,
    baseUrl,
  } satisfies RunAgentParams);
}
