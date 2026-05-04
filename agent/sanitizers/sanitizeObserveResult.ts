import type { ObserveResult } from "../interfaces/observeResult.js";

export function sanitizeObserveResult(result: ObserveResult): ObserveResult {
  return {
    ...result,
    summary: result.summary.trim() || "未提供观察总结。",
    dimensions: result.dimensions.map((dimension) => ({
      ...dimension,
      issues: dimension.issues.filter(
        (issue) =>
          issue.description.trim() !== "" && issue.evidence.trim() !== ""
      ),
    })),
  };
}
