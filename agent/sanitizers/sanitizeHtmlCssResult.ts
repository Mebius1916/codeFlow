import type { HtmlCssResult } from "../interfaces/htmlCssResult.js";

function stripStyleWrapper(css: string): string {
  const trimmedCss = css.trim();
  const styleMatch = trimmedCss.match(/^<style[^>]*>([\s\S]*?)<\/style>$/i);
  return styleMatch ? styleMatch[1].trim() : trimmedCss;
}

function extractStyleBlocks(html: string): {
  htmlWithoutStyle: string;
  extractedCss: string;
} {
  const cssChunks: string[] = [];
  const htmlWithoutStyle = html.replace(
    /<style[^>]*>([\s\S]*?)<\/style>/gi,
    (_, css: string) => {
      if (css.trim()) {
        cssChunks.push(css.trim());
      }
      return "";
    }
  );

  return {
    htmlWithoutStyle: htmlWithoutStyle.trim(),
    extractedCss: cssChunks.join("\n\n").trim(),
  };
}

export function sanitizeHtmlCssResult(
  result: HtmlCssResult,
  context: { previousHtml: string }
): HtmlCssResult {
  const normalizedCss = stripStyleWrapper(result.css);
  const { htmlWithoutStyle, extractedCss } = extractStyleBlocks(result.html.trim());
  const nextHtml = htmlWithoutStyle;
  const nextCss = [normalizedCss, extractedCss].filter(Boolean).join("\n\n").trim();

  if (!nextHtml || !nextHtml.startsWith("<")) {
    return {
      html: context.previousHtml,
      css: "",
    };
  }

  const extractDataIds = (html: string): string[] =>
    [...html.matchAll(/data-id=(["'])(.*?)\1/g)].map((match) => match[2]);
  const previousDataIds = extractDataIds(context.previousHtml);
  const nextDataIds = new Set(extractDataIds(nextHtml));
  const keepsAllDataIds = previousDataIds.every((dataId) =>
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
