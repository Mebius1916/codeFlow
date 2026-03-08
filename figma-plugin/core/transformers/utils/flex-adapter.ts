
import type {
  Node as FigmaDocumentNode,
  HasFramePropertiesTrait,
  HasLayoutTrait,
} from "@figma/rest-api-spec";

/**
 * Converts Figma alignment properties (MIN, MAX, CENTER, etc.) to CSS flexbox values.
 * Handles both main axis (justify-content) and cross axis (align-items).
 * 
 * @param axisAlign - The alignment value from Figma
 * @param stretch - Context for determining if 'stretch' alignment should be applied
 */
export function convertFlexAlignment(
  axisAlign?:
    | HasFramePropertiesTrait["primaryAxisAlignItems"]
    | HasFramePropertiesTrait["counterAxisAlignItems"],
  stretch?: {
    children: FigmaDocumentNode[];
    axis: "primary" | "counter";
    mode: "row" | "column" | "none";
  },
) {
  if (stretch && stretch.mode !== "none") {
    const { children, mode, axis } = stretch;

    // Compute whether to check horizontally or vertically based on axis and direction
    const direction = getDirection(axis, mode);

    const shouldStretch =
      children.length > 0 &&
      children.reduce((shouldStretch, c) => {
        if (!shouldStretch) return false;
        if ("layoutPositioning" in c && c.layoutPositioning === "ABSOLUTE") return true;
        if (direction === "horizontal") {
          return "layoutSizingHorizontal" in c && c.layoutSizingHorizontal === "FILL";
        } else if (direction === "vertical") {
          return "layoutSizingVertical" in c && c.layoutSizingVertical === "FILL";
        }
        return false;
      }, true);

    if (shouldStretch) return "stretch";
  }

  switch (axisAlign) {
    case "MIN":
      // MIN, AKA flex-start, is the default alignment
      return "flex-start";
    case "MAX":
      return "flex-end";
    case "CENTER":
      return "center";
    case "SPACE_BETWEEN":
      return "space-between";
    case "BASELINE":
      return "baseline";
    default:
      return undefined;
  }
}

/**
 * Converts Figma's counter axis align content property to CSS align-content.
 * Used when flex-wrap is enabled.
 */
export function convertFlexAlignContent(align: string) {
  switch (align) {
    case "MIN":
      return "flex-start";
    case "MAX":
      return "flex-end";
    case "CENTER":
      return "center";
    case "SPACE_BETWEEN":
      return "space-between";
    case "SPACE_AROUND":
      return "space-around";
    case "BASELINE":
      return "baseline";
    default:
      return undefined;
  }
}

/**
 * Converts item's self alignment (layoutAlign) to CSS align-self.
 * Handles the interaction between sizing mode (HUG/FIXED/FILL) and alignment.
 */
export function convertFlexAlignSelf(
  align: HasLayoutTrait["layoutAlign"] | undefined,
  sizing: HasLayoutTrait["layoutSizingHorizontal"] | HasLayoutTrait["layoutSizingVertical"],
) {
  if (sizing === "HUG" && align === "STRETCH") {
    return undefined; 
  }

  switch (align) {
    case "MIN":
      // MIN, AKA flex-start, is the default alignment
      return "flex-start";
    case "MAX":
      return "flex-end";
    case "CENTER":
      return "center";
    case "STRETCH":
      return "stretch";
    default:
      return undefined;
  }
}

/**
 * Converts Figma sizing constants (FIXED, FILL, HUG) to simplified internal values.
 */
export function convertFigmaSizing(
  s?: HasLayoutTrait["layoutSizingHorizontal"] | HasLayoutTrait["layoutSizingVertical"],
) {
  if (s === "FIXED") return "fixed";
  if (s === "FILL") return "fill";
  if (s === "HUG") return "hug";
  return undefined;
}

function getDirection(
  axis: "primary" | "counter",
  mode: "row" | "column",
): "horizontal" | "vertical" {
  switch (axis) {
    case "primary":
      switch (mode) {
        case "row":
          return "horizontal";
        case "column":
          return "vertical";
      }
    case "counter":
      switch (mode) {
        case "row":
          return "horizontal";
        case "column":
          return "vertical";
      }
  }
}
