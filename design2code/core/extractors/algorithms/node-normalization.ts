
import { SmartNode } from "../analysis/index.js";

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
  node: SmartNode
): NormalizedNodeResult {
  // 1. Check for Icon (SVG)
  if (node.isIcon()) {
    return {
      type: "SVG",
      isLeaf: true,
    };
  }

  // 2. Check for Image
  if (node.isImage()) {
    return {
      type: "IMAGE",
      isLeaf: true,
    };
  }

  // 3. Check for Text
  if (node.isText()) {
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
