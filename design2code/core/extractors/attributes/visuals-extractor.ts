import type { ExtractorFn, SimplifiedNode } from "../../types/extractor-types.js";
import { buildSimplifiedStrokes, parsePaint, toCssBlendMode } from "../../transformers/style.js";
import { buildSimplifiedEffects } from "../../transformers/effects.js";
import { hasValue } from "../../utils/identity.js";
import { findOrCreateVar, getStyleName } from "../../utils/style-helper.js";
import { hasVisiblePaintsOrEffects } from "../../utils/node-check.js";

/**
 * Extracts visual appearance properties (fills, strokes, effects, opacity, border radius).
 */
export const visualsExtractor: ExtractorFn = (node, context) => {
  const result: Partial<SimplifiedNode> = {};

  // Check if node has children to determine CSS properties
  const hasChildren = context.smartNode 
    ? context.smartNode.hasChildren 
    : (hasValue("children", node) && Array.isArray(node.children) && node.children.length > 0);

  // fills
  const visuals = context.smartNode?.getVisuals();
  const rawFills = visuals?.fills;

  if (rawFills && Array.isArray(rawFills) && rawFills.length) {
    const fills = rawFills.map((fill) => parsePaint(fill, hasChildren)).reverse();
    const styleName = context.smartNode ? getStyleName(context.smartNode, context, ["fill", "fills"]) : undefined;
    if (styleName) {
      context.globalVars.styles[styleName] = fills;
      result.fills = styleName;
    } else {
      result.fills = findOrCreateVar(context.globalVars, fills, "fill");
    }
  }

  // strokes
  const strokes = context.smartNode ? buildSimplifiedStrokes(context.smartNode, hasChildren) : { colors: [] };
  if (strokes.colors.length) {
    const styleName = context.smartNode ? getStyleName(context.smartNode, context, ["stroke", "strokes"]) : undefined;
    if (styleName) {
      const hasExtraStrokeProps =
        !!strokes.strokeWeight ||
        !!strokes.strokeWeights ||
        !!strokes.strokeDashes ||
        !!strokes.strokeAlign;
      if (hasExtraStrokeProps) {
        result.strokes = findOrCreateVar(context.globalVars, strokes, "stroke");
      } else {
        context.globalVars.styles[styleName] = strokes.colors;
        result.strokes = styleName;
      }
    } else {
      result.strokes = findOrCreateVar(context.globalVars, strokes, "stroke");
    }
  }

  // effects
  const effects = context.smartNode ? buildSimplifiedEffects(context.smartNode) : {};
  if (Object.keys(effects).length) {
    const styleName = context.smartNode ? getStyleName(context.smartNode, context, ["effect", "effects"]) : undefined;
    if (styleName) {
      // Effects styles store only the effect values
      context.globalVars.styles[styleName] = effects;
      result.effects = styleName;
    } else {
      result.effects = findOrCreateVar(context.globalVars, effects, "effect");
    }
  }

  // opacity
  if (hasValue("opacity", node) && typeof node.opacity === "number" && node.opacity !== 1) {
    result.opacity = node.opacity;
  }

  // Use smartNode for visibility check
  const isVisible = context.smartNode?.isVisible() ?? (hasValue("visible", node) ? node.visible !== false : true);
  if (!isVisible) {
    result.visible = false;
  }

  if (hasValue("blendMode", node) && typeof node.blendMode === "string") {
    const blendMode = toCssBlendMode(node.blendMode);
    if (blendMode) result.blendMode = blendMode;
  }

  // border radius
  // Only apply border radius if there are visible styles (fills/strokes/effects) OR if the node clips content
  const hasVisuals = hasVisiblePaintsOrEffects(node);
  const hasClipsContent = hasValue("clipsContent", node) && node.clipsContent === true;

  if (hasVisuals||hasClipsContent) {
    if (node.type === "ELLIPSE") {
      result.borderRadius = "50%";
    } else {
      const r = context.smartNode?.getVisuals()?.cornerRadius;
      const hasRadius = Array.isArray(r) ? r.some((value) => value !== 0) : r !== 0;
      if (r !== undefined && hasRadius) {
        result.borderRadius = Array.isArray(r)
          ? `${r[0]}px ${r[1]}px ${r[2]}px ${r[3]}px`
          : `${r}px`;
      }
    }
  }

  return result;
};
