import { SmartNode } from "../extractors/analysis/index.js";
import type {
  Paint,
  GradientPaint,
} from "@figma/rest-api-spec";
import { isVisible } from "../utils/common.js";
import type { CSSRGBAColor, CSSHexColor } from "../utils/identity.js";
import { resolveVariableColorName } from "./utils/text-utils.js";
import {
  translateScaleMode,
  handleImageTransform,
  htmlColor,
  convertGradientToCss,
} from "./utils/style-utils.js";
import type { 
  SimplifiedFill, 
  SimplifiedStroke, 
  SimplifiedImageFill, 
  SimplifiedGradientFill, 
  SimplifiedPatternFill,
  SimplifiedSolidFill,
  SimplifiedVectorPath
} from "../types/simplified-types.js";

export { CSSRGBAColor, CSSHexColor };
export { 
  SimplifiedFill, 
  SimplifiedStroke, 
  SimplifiedImageFill, 
  SimplifiedGradientFill, 
  SimplifiedPatternFill,
  SimplifiedVectorPath
};
export type { ColorValue } from "./utils/style-utils.js";
export { hexToRgba, convertColor, formatRGBAColor, htmlColor } from "./utils/style-utils.js";

export function toCssBlendMode(mode?: string): string | undefined {
  if (!mode) return undefined;
  if (mode === "PASS_THROUGH" || mode === "NORMAL") return undefined;
  return mode.toLowerCase().replace(/_/g, "-");
}

/**
 * Build simplified stroke information from a Figma node
 *
 * @param node - The SmartNode to extract stroke information from
 * @param hasChildren - Whether the node has children (affects paint processing)
 * @returns Simplified stroke object with colors and properties
 */
export function buildSimplifiedStrokes(
  node: SmartNode,
  hasChildren: boolean = false,
): SimplifiedStroke {
  let strokes: SimplifiedStroke = { colors: [] };
  const visuals = node.getVisuals();
  const rawStrokes = visuals.strokes;

  if (rawStrokes && Array.isArray(rawStrokes) && rawStrokes.length) {
    strokes.colors = rawStrokes.filter(isVisible).map((stroke) => {
      // Fallback for gradient strokes to use the first color stop
      if (stroke.type.startsWith("GRADIENT")) {
        const gradientStroke = stroke as GradientPaint;
        if (gradientStroke.gradientStops && gradientStroke.gradientStops.length > 0) {
          const firstStop = gradientStroke.gradientStops[0];
          const color = htmlColor(firstStop.color, stroke.opacity);
          return { type: "SOLID", color };
        }
      }
      return parsePaint(stroke, hasChildren);
    });
  }

  if (visuals.individualStrokeWeights) {
    const { top, right, bottom, left } = visuals.individualStrokeWeights;
    strokes.strokeWeights = `${top}px ${right}px ${bottom}px ${left}px`;
  } else if (visuals.strokeWeight && visuals.strokeWeight > 0) {
    strokes.strokeWeight = `${visuals.strokeWeight}px`;
  }

  if (visuals.strokeDashes && Array.isArray(visuals.strokeDashes) && visuals.strokeDashes.length) {
    strokes.strokeDashes = visuals.strokeDashes;
  }

  if (visuals.strokeAlign) {
    strokes.strokeAlign = visuals.strokeAlign as SimplifiedStroke["strokeAlign"];
  }

  return strokes;
}

/**
 * Convert a Figma paint (solid, image, gradient) to a SimplifiedFill
 * @param raw - The Figma paint to convert
 * @param hasChildren - Whether the node has children (determines CSS properties)
 * @returns The converted SimplifiedFill
 */
export function parsePaint(raw: Paint, hasChildren: boolean = false): SimplifiedFill {
  if (!isVisible(raw)) return "transparent";

  const blendMode = toCssBlendMode((raw as any).blendMode);
  if (raw.type === "IMAGE") {
    const baseImageFill: SimplifiedImageFill = {
      type: "IMAGE",
      imageRef: raw.imageRef,
      scaleMode: raw.scaleMode as "FILL" | "FIT" | "TILE" | "STRETCH",
      scalingFactor: raw.scalingFactor,
      blendMode,
    };

    // Get CSS properties and processing metadata from scale mode
    // TILE mode always needs to be treated as background image (can't tile an <img> tag)
    const isBackground = hasChildren || baseImageFill.scaleMode === "TILE";
    const { css, processing } = translateScaleMode(
      baseImageFill.scaleMode,
      isBackground,
      raw.scalingFactor,
    );

    // Combine scale mode processing with transform processing if needed
    // Transform processing (cropping) takes precedence over scale mode processing
    let finalProcessing = processing;
    if (raw.imageTransform) {
      const transformProcessing = handleImageTransform(raw.imageTransform);
      finalProcessing = {
        ...processing,
        ...transformProcessing,
        // Keep requiresImageDimensions from scale mode (needed for TILE)
        requiresImageDimensions:
          processing.requiresImageDimensions || transformProcessing.requiresImageDimensions,
      };
    }

    return {
      ...baseImageFill,
      ...css,
      imageDownloadArguments: finalProcessing,
    };
  } else if (raw.type === "SOLID") {
    const variableName = resolveVariableColorName(raw);
    const opacity = raw.opacity ?? 1;
    const fallbackColor = htmlColor(raw.color!, opacity);
    const variableColor = variableName ? `var(--${variableName}, ${fallbackColor})` : undefined;
    if (blendMode) {
      const color = variableColor ?? fallbackColor;
      const solidFill: SimplifiedSolidFill = {
        type: "SOLID",
        color,
        blendMode,
      };
      return solidFill;
    }
    if (variableColor) {
      return variableColor;
    }
    return fallbackColor;
  } else if (raw.type === "PATTERN") {
    return parsePatternPaint(raw, blendMode);
  } else if (
    ["GRADIENT_LINEAR", "GRADIENT_RADIAL", "GRADIENT_ANGULAR", "GRADIENT_DIAMOND"].includes(
      raw.type,
    )
  ) {
    return {
      type: raw.type as
        | "GRADIENT_LINEAR"
        | "GRADIENT_RADIAL"
        | "GRADIENT_ANGULAR"
        | "GRADIENT_DIAMOND",
      gradient: convertGradientToCss(raw),
      blendMode,
    };
  } else {
    throw new Error(`Unknown paint type: ${raw.type}`);
  }
}

/**
 * Convert a Figma PatternPaint to a CSS-like pattern fill.
 *
 * Ignores `tileType` and `spacing` from the Figma API currently as there's
 * no great way to translate them to CSS.
 *
 * @param raw - The Figma PatternPaint to convert
 * @returns The converted pattern SimplifiedFill
 */
function parsePatternPaint(
  raw: Extract<Paint, { type: "PATTERN" }>,
  blendMode?: string,
): Extract<SimplifiedFill, { type: "PATTERN" }> {
  /**
   * The only CSS-like repeat value supported by Figma is repeat.
   *
   * They also have hexagonal horizontal and vertical repeats, but
   * those aren't easy to pull off in CSS, so we just use repeat.
   */
  let backgroundRepeat = "repeat";

  let horizontal = "left";
  switch (raw.horizontalAlignment) {
    case "START":
      horizontal = "left";
      break;
    case "CENTER":
      horizontal = "center";
      break;
    case "END":
      horizontal = "right";
      break;
  }

  let vertical = "top";
  switch (raw.verticalAlignment) {
    case "START":
      vertical = "top";
      break;
    case "CENTER":
      vertical = "center";
      break;
    case "END":
      vertical = "bottom";
      break;
  }

  return {
    type: raw.type,
    patternSource: {
      type: "IMAGE-PNG",
      nodeId: raw.sourceNodeId,
    },
    backgroundRepeat,
    backgroundSize: `${Math.round(raw.scalingFactor * 100)}%`,
    backgroundPosition: `${horizontal} ${vertical}`,
    blendMode,
  };
}
