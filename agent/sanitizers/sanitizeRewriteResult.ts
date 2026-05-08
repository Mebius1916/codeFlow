import type { RewriteResult } from "../interfaces/rewriteResult.js";
import { extractDataIds } from "./utils/dataIds.js";

export function sanitizeRewriteResult(
  result: RewriteResult,
  context: { currentHtml?: string; previousHtml?: string }
): RewriteResult {
  const nextHtml = result.html.trim();
  if (!nextHtml || !nextHtml.startsWith("<")) {
    return {
      html: context.previousHtml ?? result.html,
    };
  }

  if (context.previousHtml) {
    // 查看是否有元素丢失
    const previousDataIds = extractDataIds(context.previousHtml);
    const nextDataIds = extractDataIds(nextHtml);
    const keepsAllDataIds = [...previousDataIds].every((dataId) =>
      nextDataIds.has(dataId)
    );

    if (!keepsAllDataIds) {
      return {
        html: context.previousHtml,
      };
    }
  }

  return {
    html: nextHtml,
  };
}
