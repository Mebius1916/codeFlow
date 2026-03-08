import type { SimplifiedNode } from "../types/extractor-types.js";

/**
 * Checks if a node should be pruned from the tree.
 * A node should be pruned if:
 * 1. It has no children
 * 2. It is visually empty (no styles, no semantic meaning)
 * 3. It is not a content node (Text, Image, SVG)
 */
export function shouldPruneNode(node: SimplifiedNode): boolean {
  // 1. Check children
  const hasChildren = node.children && node.children.length > 0;
  if (hasChildren) {
    return false;
  }
  if (node.visible === false) {
    return false;
  }
  // 2. Never prune content nodes
  if (node.type === "TEXT" || node.type === "IMAGE" || node.type === "SVG") {
    return false;
  }
  // 3. Check for visual styles
  if (hasVisibleStyles(node)) {
    return false;
  }

  return true;
}

/**
 * Checks if a node has any visible visual styles (fills, strokes, effects).
 * This function unifies style checking logic used across multiple modules.
 */
export function hasVisibleStyles(node: SimplifiedNode | any): boolean {
  if (node.opacity === 0) return false;
  if (hasVisiblePaintsOrEffects(node)) {
    return true;
  }
  if (node.borderRadius && node.borderRadius !== "0px" && node.borderRadius !== "0") {
    return true;
  }
  return false;
}

/**
 * Checks if a node has visible fills, strokes or effects (excluding borderRadius).
 */
export function hasVisiblePaintsOrEffects(node: SimplifiedNode | any): boolean {
  if (node.opacity === 0) return false;
  // 1. Fills
  if (node.fills && node.fills !== "transparent") {
    if (Array.isArray(node.fills)) {
      const hasVisibleFill = node.fills.some(
        (paint: any) => paint.visible !== false && paint.opacity !== 0
      );
      if (hasVisibleFill) return true;
    } else if (typeof node.fills === "object") {
      if (node.fills.visible === false) return false;
      if (node.fills.opacity === 0) return false;
      return true;
    } else {
      return true;
    }
  }
  // 2. Strokes
  if (node.strokes && node.strokes !== "transparent") {
    if (Array.isArray(node.strokes)) {
      const hasVisibleStroke = node.strokes.some(
        (paint: any) => paint.visible !== false && paint.opacity !== 0
      );
      if (hasVisibleStroke) return true;
    } else if (typeof node.strokes === "object") {
      if (node.strokes.visible === false) return false;
      if (node.strokes.opacity === 0) return false;
      return true;
    } else {
      return true;
    }
  }
  // 3. Effects
  if (node.effects && node.effects !== "transparent") {
    if (Array.isArray(node.effects)) {
      const hasVisibleEffect = node.effects.some(
        (effect: any) => effect.visible !== false && effect.opacity !== 0
      );
      if (hasVisibleEffect) return true;
    } else if (typeof node.effects === "object") {
      if (node.effects.visible === false) return false;
      if (node.effects.opacity === 0) return false;
      return true;
    } else {
      return true;
    }
  }
  
  return false;
}
