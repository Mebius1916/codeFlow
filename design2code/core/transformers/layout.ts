import type {
  HasLayoutTrait,
} from "@figma/rest-api-spec";
import { generateCSSShorthand, pixelRound } from "../utils/common.js";
import { calculateRelativePosition } from "../utils/geometry.js";
import type { SimplifiedLayout } from "../types/simplified-types.js";
import { SmartNode } from "../extractors/analysis/index.js";
import { 
  convertFlexAlignment, 
  convertFlexAlignContent, 
  convertFigmaSizing, 
  convertFlexAlignSelf 
} from "./utils/flex-adapter.js";

export { SimplifiedLayout };

// Convert Figma's layout config into a more typical flex-like schema
export function buildSimplifiedLayout(
  node: SmartNode
): SimplifiedLayout {
  const frameValues = buildSimplifiedFrameValues(node);
  const layoutValues = buildSimplifiedLayoutValues(node, frameValues.mode) || {};
  return { ...frameValues, ...layoutValues };
}

function buildSimplifiedFrameValues(node: SmartNode): SimplifiedLayout {
  if (!node.isContainer()) {
    return { mode: "none", sizing: {} };
  }

  const mode = node.getLayoutMode();
  const frameValues: SimplifiedLayout = { mode, sizing: {} };
  
  // Use raw node for children access (SmartNode wrapper for children could be added later)
  const rawNode = node.raw as any;

  const overflowScroll: SimplifiedLayout["overflowScroll"] = [];
  if (rawNode.overflowDirection?.includes("HORIZONTAL")) overflowScroll.push("x");
  if (rawNode.overflowDirection?.includes("VERTICAL")) overflowScroll.push("y");
  if (overflowScroll.length > 0) frameValues.overflowScroll = overflowScroll;

  if ("clipsContent" in rawNode && rawNode.clipsContent) {
    frameValues.clipsContent = true;
  }

  if (frameValues.mode === "none") {
    return frameValues;
  }

  const { primary, counter } = node.getLayoutAlign();

  frameValues.justifyContent = convertFlexAlignment(primary as any, {
    children: rawNode.children,
    axis: "primary",
    mode: frameValues.mode,
  });
  frameValues.alignItems = convertFlexAlignment(counter as any, {
    children: rawNode.children,
    axis: "counter",
    mode: frameValues.mode,
  });

  frameValues.wrap = rawNode.layoutWrap === "WRAP" ? true : undefined;
  if (frameValues.wrap && rawNode.counterAxisAlignContent) {
    frameValues.alignContent = convertFlexAlignContent(rawNode.counterAxisAlignContent);
  }
  
  const gap = node.gap;
  frameValues.gap = gap ? `${gap}px` : undefined;

  const padding = node.padding;
  const paddingStr = generateCSSShorthand(
    pixelRound(padding.top),
    pixelRound(padding.right),
    pixelRound(padding.bottom),
    pixelRound(padding.left),
  );
  
  if (paddingStr) {
    frameValues.padding = paddingStr;
  }

  return frameValues;
}

function buildSimplifiedLayoutValues(
  node: SmartNode,
  mode: "row" | "column" | "none"
): SimplifiedLayout | undefined {
  const layoutValues: SimplifiedLayout = { mode, sizing: {} };

  if (node.parent?.isContainer() && !node.isAbsolute()) {
    layoutValues.parentMode = node.parent.getLayoutMode();
  } else {
    layoutValues.parentMode = "none";
  }

  // Calculate sizing
  const layoutSizing = node.getLayoutSizing();
  const sizing: SimplifiedLayout["sizing"] = {
    horizontal: convertFigmaSizing(layoutSizing.horizontal),
    vertical: convertFigmaSizing(layoutSizing.vertical),
  };
  layoutValues.sizing = sizing;

  // Calculate alignSelf based on parent mode and sizing
  let crossAxisSizing: HasLayoutTrait["layoutSizingHorizontal"] | HasLayoutTrait["layoutSizingVertical"] | undefined;

  if (layoutValues.parentMode === "row") {
    crossAxisSizing = layoutSizing.vertical;
  } else if (layoutValues.parentMode === "column") {
    crossAxisSizing = layoutSizing.horizontal;
  }

  layoutValues.alignSelf = convertFlexAlignSelf(node.getLayoutAlignSelf(), crossAxisSizing);

  const minMax = node.getMinMax();
  if (minMax.minWidth !== undefined) layoutValues.minWidth = minMax.minWidth;
  if (minMax.maxWidth !== undefined) layoutValues.maxWidth = minMax.maxWidth;
  if (minMax.minHeight !== undefined) layoutValues.minHeight = minMax.minHeight;
  if (minMax.maxHeight !== undefined) layoutValues.maxHeight = minMax.maxHeight;

  if (node.isText()) {
    const textLayout = node.getTextLayout();
    if (textLayout.autoResize) layoutValues.textAutoResize = textLayout.autoResize as any;
    if (textLayout.truncation) layoutValues.textTruncation = textLayout.truncation as any;
    if (textLayout.maxLines) layoutValues.maxLines = textLayout.maxLines;
  }

  // Only include positioning-related properties if parent layout isn't flex or if the node is absolute
  if (
    node.parent?.isContainer() &&
    node.isAbsolute()
  ) {
    layoutValues.position = "absolute";
    const selfRect = node.getBoundingBox();
    const parentRect = node.parent.getBoundingBox();

    if (selfRect && parentRect) {
      layoutValues.locationRelativeToParent = 
        calculateRelativePosition(selfRect, parentRect);
    }
  }

  // Handle dimensions based on layout growth and alignment
  const bbox = node.getBoundingBox();
  if (bbox) {
    const dimensions: { width?: number; height?: number; aspectRatio?: number } = {};
    const grow = node.getLayoutGrow();
    const alignSelf = node.getLayoutAlignSelf();
    const parentMode = layoutValues.parentMode;
    const hasChildren = node.features.hasChildren;

    // Only include dimensions that aren't meant to stretch
    if (parentMode === "row") {
      if (!grow && layoutSizing.horizontal === "FIXED")
        dimensions.width = bbox.width;
      if (alignSelf !== "STRETCH" && layoutSizing.vertical === "FIXED")
        dimensions.height = bbox.height;
    } else if (parentMode === "column") {
      if (alignSelf !== "STRETCH" && layoutSizing.horizontal === "FIXED")
        dimensions.width = bbox.width;
      if (!grow && layoutSizing.vertical === "FIXED")
        dimensions.height = bbox.height;
    } else {
      // Not in AutoLayout
      if (layoutSizing.horizontal === "FIXED") dimensions.width = bbox.width;
      if (layoutSizing.vertical === "FIXED") dimensions.height = bbox.height;
    }

    if (layoutValues.mode === "none") {
      if (layoutSizing.horizontal === "HUG" && dimensions.width === undefined) {
        dimensions.width = bbox.width;
      }
      if (layoutSizing.vertical === "HUG" && dimensions.height === undefined) {
        dimensions.height = bbox.height;
      }
    }

    if (Object.keys(dimensions).length > 0) {
      if (dimensions.width) dimensions.width = pixelRound(dimensions.width);
      if (dimensions.height) dimensions.height = pixelRound(dimensions.height);
      layoutValues.dimensions = dimensions;
    }
  }

  // Add position relative if the node is a frame (and not absolute)
  // TODO: Implement hasAbsoluteChildren check in Analysis phase
  if (node.isContainer() && layoutValues.position !== "absolute") {
      layoutValues.position = "relative";
  }

  return layoutValues;
}
