import type { RewriteResult } from "../interfaces/rewriteResult.js";
import { extractDataIds, type SanitizeOutputContext } from "./shared.js";

export function sanitizeRewriteResult(
  result: RewriteResult,
  context: SanitizeOutputContext
): RewriteResult {
  const nextHtml = result.html.trim();
  if (!nextHtml || !passesRewriteGuards(nextHtml, context.previousHtml)) {
    return {
      html: context.previousHtml ?? result.html,
    };
  }

  return {
    html: nextHtml,
  };
}

function passesRewriteGuards(
  nextHtml: string,
  previousHtml: string | undefined
): boolean {
  if (!nextHtml.startsWith("<")) {
    return false;
  }

  if (/<html[\s>]|<head[\s>]|<body[\s>]|<script[\s>]|<style[\s>]/i.test(nextHtml)) {
    return false;
  }

  if (/\sstyle=/i.test(nextHtml)) {
    return false;
  }

  if (!previousHtml) {
    return true;
  }

  const previousDataIds = extractDataIds(previousHtml);
  const nextDataIds = new Set(extractDataIds(nextHtml));
  return previousDataIds.every((dataId) => nextDataIds.has(dataId));
}
