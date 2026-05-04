import type { RewriteResult } from "../interfaces/rewriteResult.js";

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
    const extractDataIds = (html: string): string[] => 
      [...html.matchAll(/data-id=(["'])(.*?)\1/g)].map((match) => match[2]);
    
    // 查看是否有元素丢失
    const previousDataIds = extractDataIds(context.previousHtml);
    const nextDataIds = new Set(extractDataIds(nextHtml));
    const keepsAllDataIds = previousDataIds.every((dataId) =>
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
