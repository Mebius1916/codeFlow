
import type { Node as FigmaNode } from "@figma/rest-api-spec";
import type { NodeFeatures } from "./types.js";
import { isIcon } from "../../transformers/icon.js";
import { isImageNode } from "../../transformers/image.js";
import { isFrame } from "../../utils/identity.js";
import { isVisible, pixelRound } from "../../utils/common.js";
import { isRectContained } from "../../utils/geometry.js";
import { extractTextStyle, hasTextStyle } from "../../transformers/text.js";
import type { SimplifiedTextStyle } from "../../types/simplified-types.js";

export function analyzeNode(node: FigmaNode, parent?: FigmaNode): NodeFeatures {
  const rawType = node.type;
  const visible = isVisible(node);
  const hasChildren = "children" in node && Array.isArray(node.children) && node.children.length > 0;

  // --- Layout Analysis ---
  // Enhanced isFrame logic (already implemented in identity.ts, but we reinforce it here)
  const isContainer = isFrame(node);
  
  // Robust layout mode inference
  let layoutMode: "row" | "column" | "none" = "none";
  let rawLayoutMode: "NONE" | "HORIZONTAL" | "VERTICAL" | undefined;
  let hasLayoutProps = false;
  let primaryAlign: string | undefined;
  let counterAlign: string | undefined;

  if (isContainer) {
    const rawMode = (node as any).layoutMode;
    rawLayoutMode = rawMode;
    
    if (rawMode === "HORIZONTAL") layoutMode = "row";
    else if (rawMode === "VERTICAL") layoutMode = "column";
    
    // Check for padding/gap
    const paddingLeft = (node as any).paddingLeft ?? 0;
    const paddingRight = (node as any).paddingRight ?? 0;
    const paddingTop = (node as any).paddingTop ?? 0;
    const paddingBottom = (node as any).paddingBottom ?? 0;
    const itemSpacing = (node as any).itemSpacing ?? 0;

    hasLayoutProps = 
      paddingLeft > 0 || paddingRight > 0 || paddingTop > 0 || paddingBottom > 0 || itemSpacing > 0;

    primaryAlign = (node as any).primaryAxisAlignItems;
    counterAlign = (node as any).counterAxisAlignItems;

    // Fallback inference if mode is NONE
    if (layoutMode === "none" && hasChildren) {
      // Strategy: Infer layout from constraints and geometry
      const children = (node as any).children;
      
      // 1. Check constraints for explicit center intent
      const hasCenterConstraint = children.some((c: any) => 
        c.constraints && (c.constraints.horizontal === "CENTER" || c.constraints.vertical === "CENTER")
      );

      // 2. Check constraints for scale intent (often implies responsive center for icons)
      const hasScaleConstraint = children.some((c: any) => 
        c.constraints && (c.constraints.horizontal === "SCALE" || c.constraints.vertical === "SCALE")
      );

      // 3. Verify with geometry if needed
      if (hasCenterConstraint || hasScaleConstraint) {
        layoutMode = "row";
      } 
    }
  }

  let isAbsolute = false;
  const layoutPositioning = (node as any).layoutPositioning;
  if (layoutPositioning === "ABSOLUTE") {
    isAbsolute = true;
  } else if (parent) {
    const parentLayoutMode = (parent as any).layoutMode;
    const parentIsAutoLayout = parentLayoutMode === "HORIZONTAL" || parentLayoutMode === "VERTICAL";
    if (!parentIsAutoLayout) {
      isAbsolute = true;
    } else {
      const childBox = (node as any).absoluteBoundingBox;
      const parentBox = (parent as any).absoluteBoundingBox;
      if (childBox && parentBox && !isRectContained(parentBox, childBox)) {
        isAbsolute = true;
      }
    }
  }

  // Extract layout sizing
  const layoutSizing = {
    horizontal: (node as any).layoutSizingHorizontal ?? "FIXED",
    vertical: (node as any).layoutSizingVertical ?? "FIXED",
  };

  // --- Visual Analysis ---
  const hasFills = "fills" in node && Array.isArray(node.fills) && node.fills.length > 0 && node.fills.some((f: any) => f.visible !== false);
  const hasStrokes = "strokes" in node && Array.isArray(node.strokes) && node.strokes.length > 0 && node.strokes.some((s: any) => s.visible !== false);
  const effects = "effects" in node && Array.isArray(node.effects) ? node.effects.filter((e: any) => e.visible !== false) : [];
  const hasEffects = effects.length > 0;
  const hasExportSettings = "exportSettings" in node && Array.isArray(node.exportSettings) && node.exportSettings.length > 0;

  let cornerRadius: number | number[] | undefined;
  if ((node as any).rectangleCornerRadii) {
    cornerRadius = (node as any).rectangleCornerRadii;
  } else if ((node as any).cornerRadius !== undefined) {
    cornerRadius = (node as any).cornerRadius;
  }

  let individualStrokeWeights = (node as any).individualStrokeWeights;
  if (!individualStrokeWeights && (node as any).strokeTopWeight !== undefined) {
    individualStrokeWeights = {
      top: (node as any).strokeTopWeight,
      right: (node as any).strokeRightWeight,
      bottom: (node as any).strokeBottomWeight,
      left: (node as any).strokeLeftWeight,
    };
  }

  const visuals = {
    fills: (node as any).fills,
    strokes: (node as any).strokes,
    strokeWeight: (node as any).strokeWeight,
    individualStrokeWeights,
    strokeAlign: (node as any).strokeAlign,
    strokeDashes: (node as any).strokeDashes,
    opacity: (node as any).opacity,
    blendMode: (node as any).blendMode,
    cornerRadius,
  };

  // --- Type Specific Analysis ---
  const looksLikeIcon = isIcon(node);
  const looksLikeImage = isImageNode(node);
  const looksLikeText = rawType === "TEXT";

  let textStyle: SimplifiedTextStyle | undefined;
  if (looksLikeText && hasTextStyle(node)) {
    textStyle = extractTextStyle(node);
  }

  const minMax = {
    minWidth: (node as any).minWidth !== undefined ? pixelRound((node as any).minWidth) : undefined,
    maxWidth: (node as any).maxWidth !== undefined ? pixelRound((node as any).maxWidth) : undefined,
    minHeight: (node as any).minHeight !== undefined ? pixelRound((node as any).minHeight) : undefined,
    maxHeight: (node as any).maxHeight !== undefined ? pixelRound((node as any).maxHeight) : undefined,
  };

  let textLayout;
  if (looksLikeText) {
    textLayout = {
      autoResize: (node as any).textAutoResize || (node as any).style?.textAutoResize,
      truncation: (node as any).textTruncation,
      maxLines: (node as any).maxLines,
    };
  }

  return {
    rawType,
    hasChildren,
    isVisible: visible,
    isContainer,
    layoutMode,
    rawLayoutMode,
    hasLayoutProps,
    layoutAlign: (primaryAlign || counterAlign) ? {
      primary: primaryAlign ?? "MIN",
      counter: counterAlign ?? "MIN"
    } : undefined,
    layoutSizing,
    padding: {
      top: (node as any).paddingTop ?? 0,
      right: (node as any).paddingRight ?? 0,
      bottom: (node as any).paddingBottom ?? 0,
      left: (node as any).paddingLeft ?? 0,
    },
    gap: (node as any).itemSpacing ?? 0,
    absoluteBoundingBox: (node as any).absoluteBoundingBox,
    minMax,
    textLayout,
    textStyle,
    layoutAlignSelf: (node as any).layoutAlign,
    layoutGrow: (node as any).layoutGrow ?? 0,
    isAbsolute: !!isAbsolute,
    effects,
    visuals,
    styles: (node as any).styles,
    componentId: (node as any).componentId,
    componentProperties: (node as any).componentProperties,
    hasFills,
    hasStrokes,
    hasEffects,
    hasExportSettings,
    looksLikeIcon,
    looksLikeImage,
    looksLikeText
  };
}
