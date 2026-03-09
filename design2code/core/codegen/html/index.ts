
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
  size?: { width: number; height: number };
} {
  const ctx = context ?? createCodegenContext(design);
  
  const size = design.canvasSize;
  
  const bodyContent = design.nodes.map(node => generateNodeRecursive(node, ctx)).join("\n");
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
  return { html, css, body: bodyContent, context: ctx, size };
}

function generateNodeRecursive(
  node: SimplifiedNode,
  context: CodegenContext
): string {
  const builder = new HtmlNodeBuilder(node, context.globalVars, context);

  if (node.children && node.children.length > 0) {
    node.children.forEach(child => {
      const childHtml = generateNodeRecursive(child, context);
      if (childHtml) builder.addChild(childHtml);
    });
  }

  return builder.toString();
}
