import { runVisualRepair } from "./runtime/run.js";
import { diffPng } from "./utils/diff-png.js";

export * from "./tools/index.js";
export { runAgent, runVisualRepair } from "./runtime/run.js";

import type { RunAgentParams, RunVisualRepairParams, VisualDiffParams } from "./types/index.js";

export type { RunAgentParams, RunVisualRepairParams, VisualDiffParams };

export function visualDiff(params: VisualDiffParams) {
  const { baselinePngBase64, currentPngBase64, html, model, apiKey, baseUrl } = params;
  const diff = diffPng(baselinePngBase64, currentPngBase64);

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
  } satisfies RunVisualRepairParams);
}
