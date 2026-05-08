import type { HtmlCssResult } from "../interfaces/htmlCssResult.js";
import { extractDataIds } from "./utils/dataIds.js";

export function sanitizeHtmlCssResult(
  result: HtmlCssResult,
  context: { previousHtml: string }
): HtmlCssResult {
  const nextHtml = result.html.trim();
  const nextCss = result.css.trim();

  if (!nextHtml || !nextHtml.startsWith("<")) {
    return {
      html: context.previousHtml,
      css: "",
    };
  }

  const previousDataIds = extractDataIds(context.previousHtml);
  const nextDataIds = extractDataIds(nextHtml);
  const keepsAllDataIds = [...previousDataIds].every((dataId) =>
    nextDataIds.has(dataId)
  );

  if (!keepsAllDataIds) {
    return {
      html: context.previousHtml,
      css: nextCss,
    };
  }

  return {
    html: nextHtml,
    css: nextCss,
  };
}
