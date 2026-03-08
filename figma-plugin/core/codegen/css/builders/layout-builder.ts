
import type { SimplifiedLayout } from "../../../types/simplified-types.js";
import { px } from "../utils/css-color.js";
import { applyAxisSizing } from '../utils/axis-size.js'

// 布局构造器
export const layoutBuilder = (layout: SimplifiedLayout): Record<string, string> => {
  const styles: Record<string, string> = {};

  if (layout.clipsContent) {
    styles["overflow"] = "hidden";
  }

  const isAutoLayout = layout.mode !== "none";
  if (isAutoLayout) {
    styles["display"] = "flex";
    styles["flex-direction"] = layout.mode;
    if (layout.wrap) {
      styles["flex-wrap"] = "wrap";
      if (layout.alignContent) {
        styles["align-content"] = layout.alignContent;
      }
    }
    if (layout.justifyContent) {
      styles["justify-content"] = layout.justifyContent;
    }
    if (layout.alignItems) {
      styles["align-items"] = layout.alignItems;
    }
    if (layout.gap && layout.justifyContent !== "space-between") {
      styles["gap"] = layout.gap;
    }
  }
  
  if (layout.padding) styles["padding"] = layout.padding;
  if (layout.alignSelf) styles["align-self"] = layout.alignSelf;

  if (layout.position === "relative") styles["position"] = "relative";

  if (layout.minWidth !== undefined) styles["min-width"] = px(layout.minWidth);
  if (layout.maxWidth !== undefined) styles["max-width"] = px(layout.maxWidth);
  if (layout.minHeight !== undefined) styles["min-height"] = px(layout.minHeight);
  if (layout.maxHeight !== undefined) styles["max-height"] = px(layout.maxHeight);

  // Sizing
  const sizing = layout.sizing;
  const textAutoResize = layout.textAutoResize;
  const allowWidth = textAutoResize !== "WIDTH_AND_HEIGHT";
  const allowHeight = textAutoResize === undefined 
    || textAutoResize === "NONE" || textAutoResize === "TRUNCATE";
  if (!isAutoLayout) {
    if (layout.dimensions?.width && allowWidth) styles["width"] = px(layout.dimensions.width);
    if (layout.dimensions?.height && allowHeight) styles["height"] = px(layout.dimensions.height);
  }
  applyAxisSizing(styles, layout, "horizontal", allowWidth, sizing.horizontal);
  applyAxisSizing(styles, layout, "vertical", allowHeight, sizing.vertical);

  // Positioning
  if (layout.position === "absolute") {
    styles["position"] = "absolute";
    if (layout.locationRelativeToParent) {
      const { x, y } = layout.locationRelativeToParent;
      styles["left"] = px(x);
      styles["top"] = px(y);
    }
  } 

  if (layout.overflowScroll && layout.overflowScroll.length > 0) {
    const hasX = layout.overflowScroll.includes("x");
    const hasY = layout.overflowScroll.includes("y");
    if (hasX && hasY) {
      styles["overflow"] = "auto";
    } else {
      if (hasX) styles["overflow-x"] = "auto";
      if (hasY) styles["overflow-y"] = "auto";
    }
  }

  if (layout.textTruncation && layout.maxLines && layout.maxLines > 0) {
    styles["overflow"] = "hidden";
    styles["display"] = "-webkit-box";
    styles["-webkit-box-orient"] = "vertical";
    styles["-webkit-line-clamp"] = String(layout.maxLines);
    styles["text-overflow"] = "ellipsis";
  }

  return styles;
};
