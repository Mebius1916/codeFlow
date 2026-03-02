import type { ExtractorFn, SimplifiedNode } from "../../types/extractor-types.js";
import { findOrCreateVar, getStyleName } from "../../utils/style-helper.js";
import { 
  extractRichTextSegments, 
} from "../../transformers/text.js";
import { buildSimplifiedEffects } from "../../transformers/effects.js";

/**
 * Extracts text content and text styling from a node.
 */
export const textExtractor: ExtractorFn = (node, context) => {
  const result: Partial<SimplifiedNode> = {};
  const isText = context.features?.looksLikeText;

  // Extract text content
  if (isText) {
    const sharedEffects = context.smartNode ? buildSimplifiedEffects(context.smartNode) : {};
    const textStyle = context.smartNode?.getTextStyle();
    const baseStyle = (textStyle || {}) as any;
    let richText = textStyle ? extractRichTextSegments(node, baseStyle, sharedEffects) : undefined;
    if (!richText) {
      const text = (node as any).characters as string | undefined;
      const effects = Object.keys(sharedEffects).length ? sharedEffects : undefined;
      richText = text ? [{ text, style: baseStyle, effects }] : undefined;
    }
    if (richText) {
      result.richText = richText;
    }

    if (textStyle) {
      const styleName = context.smartNode ? getStyleName(context.smartNode, context, ["text", "typography"]) : undefined;
      if (styleName) {
        context.globalVars.styles[styleName] = textStyle;
        result.textStyle = styleName;
      } else {
        result.textStyle = findOrCreateVar(context.globalVars, textStyle, "style");
      }
    }
  }

  return result;
};
