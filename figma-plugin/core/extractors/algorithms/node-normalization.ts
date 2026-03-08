
import type { NodeFeatures } from "../analysis/types.js";

export type NormalizedNodeType = 
  | "SVG"         // Vector/Icon
  | "IMAGE"       // Bitmap Image
  | "TEXT"        // Text Block
  | "CONTAINER";  // Frame, Group, Component, etc.

export interface NormalizedNodeResult {
  type: NormalizedNodeType;
  isLeaf: boolean; // If true, we stop recursion (e.g. Icon, Image)
}

/**
 * Phase 2: Classification
 * Determines the semantic role of a node based on its analyzed features.
 */
export function normalizeNodeType(
  features: NodeFeatures
): NormalizedNodeResult {
  // 1. Check for Icon (SVG)
  if (features.looksLikeIcon) {
    return {
      type: "SVG",
      isLeaf: true,
    };
  }

  // 2. Check for Image
  if (features.looksLikeImage) {
    return {
      type: "IMAGE",
      isLeaf: true,
    };
  }

  // 3. Check for Text
  if (features.looksLikeText) {
    return {
      type: "TEXT",
      isLeaf: true,
    };
  }

  // 4. Default to Container
  return {
    type: "CONTAINER",
    isLeaf: false,
  };
}
