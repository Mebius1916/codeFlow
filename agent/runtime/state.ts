import type { RunVisualRepairParams, VisualRepairState } from "../types/index.js";

export function createInitialVisualRepairState(
  params: Pick<RunVisualRepairParams, "html">
): VisualRepairState {
  return {
    currentHtml: params.html,
    iteration: 1,
  };
}
