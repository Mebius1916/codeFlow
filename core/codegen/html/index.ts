
import type { SimplifiedDesign, SimplifiedNode } from "../../types/extractor-types.js";
import type { CodegenContext } from "../context/index.js";
import { createCodegenContext } from "../context/index.js";
import { generateCSS } from "../css/index.js";
import { HtmlNodeBuilder } from "./builders/html-builder.js";

/**
 * Enhanced HTML Generator
 * Orchestrates the generation of HTML using HtmlNodeBuilder and modular CSS generation.
 */

export function generateHTMLParts(design: SimplifiedDesign, context?: CodegenContext): {
  html: string;
  css: string;
  body: string;
  context: CodegenContext;
} {
  const ctx = context ?? createCodegenContext(design);
  const bodyContent = design.nodes.map(node => generateNodeRecursive(node, ctx.globalVars)).join("\n");
  const css = generateCSS(ctx);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <link rel="stylesheet" href="./output.css">
     <link rel="stylesheet" href="./reset.css">
    <title>${design.name}</title>
    <style>
    </style>
</head>
<body>
    ${bodyContent}
</body>
</html>`;
  return { html, css, body: bodyContent, context: ctx };
}

function generateNodeRecursive(
  node: SimplifiedNode,
  globalVars: { styles: Record<string, any>; styleCache?: Map<string, string> }
): string {
  const builder = new HtmlNodeBuilder(node, globalVars);

  if (node.children && node.children.length > 0) {
    node.children.forEach(child => {
      const childHtml = generateNodeRecursive(child, globalVars);
      if (childHtml) builder.addChild(childHtml);
    });
  }

  return builder.toString();
}
