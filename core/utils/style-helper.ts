import type { GlobalVars, StyleTypes, TraversalContext, SimplifiedNode } from "../types/extractor-types.js";
import { generateVarId } from "./common.js";
import { SmartNode } from "../extractors/analysis/index.js";

// 将一个样式对象存到全局样式表里，并返回它的 id
export function findOrCreateVar(globalVars: GlobalVars, value: StyleTypes, prefix: string): string {
  // Initialize cache if it doesn't exist
  if (!globalVars.styleCache) {
    globalVars.styleCache = new Map();
    // Populate cache with existing styles (migration path)
    Object.entries(globalVars.styles).forEach(([id, val]) => {
      globalVars.styleCache!.set(JSON.stringify(val), id);
    });
  }

  const stringifiedValue = JSON.stringify(value);

  // O(1) Lookup
  const existingVarId = globalVars.styleCache.get(stringifiedValue);
  if (existingVarId) {
    return existingVarId;
  }

  // Create a new variable if it doesn't exist
  const varId = generateVarId(prefix);
  globalVars.styles[varId] = value;
  globalVars.styleCache.set(stringifiedValue, varId);
  
  return varId;
}

export function createNodeStyleId(
  globalVars: GlobalVars,
  node: SimplifiedNode,
  refs: string[],
): string {
  const baseName = normalizeNodeBaseName(node);
  const sortedRefs = refs.slice().sort();
  const styleValue = { refs: sortedRefs };
  let id = `s_${baseName}`;
  const existing = globalVars.styles[id];
  if (existing && JSON.stringify(existing) === JSON.stringify(styleValue)) {
    return id;
  }
  if (existing) {
    let index = 2;
    while (globalVars.styles[`${id}_${index}`]) {
      const existingStyle = globalVars.styles[`${id}_${index}`];
      if (JSON.stringify(existingStyle) === JSON.stringify(styleValue)) {
        return `${id}_${index}`;
      }
      index += 1;
    }
    id = `${id}_${index}`;
  }
  globalVars.styles[id] = styleValue;
  return id;
}

// Helper to fetch a Figma style name for specific style keys on a node
export function getStyleName(
  node: SmartNode,
  context: TraversalContext,
  keys: string[],
): string | undefined {
  const styleMap = node.getStyles();
  if (!styleMap) return undefined;
  for (const key of keys) {
    const styleId = styleMap[key];
    if (styleId) {
      const meta = context.globalVars.extraStyles?.[styleId];
      if (meta?.name) return meta.name;
    }
  }
  return undefined;
}

export function addStyleRef(refs: Set<string>, value?: string) {
  if (value) refs.add(value);
}

export function buildNodeStyle(node: SimplifiedNode): Record<string, string | number> {
  return {
    ...(typeof node.opacity === "number" ? { opacity: node.opacity } : {}),
    ...(node.borderRadius ? { borderRadius: node.borderRadius } : {}),
    ...(node.transform ? { transform: node.transform } : {}),
    ...(node.blendMode ? { blendMode: node.blendMode } : {}),
    ...(node.visible === false ? { visibility: "hidden" } : {}),
  };
}

function normalizeNodeBaseName(node: SimplifiedNode): string {
  const rawName = typeof node.name === "string" ? node.name : "";
  const normalized = rawName
    .replace(/['"]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  let base =
    normalized ||
    node.semanticTag ||
    (node.type === "TEXT" ? "text" : "") ||
    (node.type === "SVG" ? "icon" : "") ||
    (node.type === "IMAGE" ? "image" : "") ||
    "box";
  if (base.length > 24) {
    base = base.slice(0, 24).replace(/-+$/g, "");
  }
  return base || "box";
}
