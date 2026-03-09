import type { SimplifiedDesign } from "../types/extractor-types.js";
import { createCodegenContext } from "./context/index.js";
import { generateHTMLParts } from "./html/index.js";

interface CodegenResult {
  html: string;
  css: string;
  assets: Map<string, string>;
  size?: { width: number; height: number };
}

export default function codegen(design: SimplifiedDesign): CodegenResult {
  // 拷贝副本，避免污染原始对象
  const context = createCodegenContext(design);
  const parts = generateHTMLParts(design, context);
  return {
    html: parts.html,
    css: parts.css,
    assets: parts.context.assets,
    size: parts.size
  };
}
