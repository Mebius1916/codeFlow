import type { TraversalContext } from "../../../types/extractor-types.js";
import type { SimplifiedFill, SimplifiedImageFill } from "../../../types/simplified-types.js";
import type { SimplifiedNode } from "../../../types/extractor-types.js";

export function resolveImageFill(
  node: SimplifiedNode,
  globalVars?: TraversalContext["globalVars"],
): SimplifiedImageFill | undefined {
  const styleId = node.fills;
  const styles = globalVars?.styles;
  if (!styleId || !styles) return undefined;
  const style = styles[styleId];
  const fills = resolveFillArray(style, styles);
  if (!fills) return undefined;
  return fills.find(
    (fill) =>
      typeof fill === "object" &&
      "type" in fill &&
      (fill as SimplifiedImageFill).type === "IMAGE",
  ) as SimplifiedImageFill | undefined;
}

function resolveFillArray(
  style: any,
  styles: Record<string, any>,
  visited: Set<string> = new Set(),
): SimplifiedFill[] | undefined {
  if (Array.isArray(style)) return style as SimplifiedFill[];
  if (!style || !("refs" in style) || !Array.isArray(style.refs)) return undefined;
  const fills: SimplifiedFill[] = [];
  style.refs.forEach((ref: string) => {
    if (visited.has(ref)) return;
    visited.add(ref);
    const child = styles[ref];
    const resolved = resolveFillArray(child, styles, visited);
    if (resolved) fills.push(...resolved);
  });
  return fills.length > 0 ? fills : undefined;
}
