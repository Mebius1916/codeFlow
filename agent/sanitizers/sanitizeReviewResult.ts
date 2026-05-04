import type { ReviewResult } from "../interfaces/reviewResult.js";

export function sanitizeReviewResult(result: ReviewResult): ReviewResult {
  return {
    ...result,
    summary: result.summary.trim() || "未提供评审总结。",
    issues: result.issues.filter(
      (issue) =>
        issue.description.trim() !== "" && issue.suggestion.trim() !== ""
    ),
  };
}
