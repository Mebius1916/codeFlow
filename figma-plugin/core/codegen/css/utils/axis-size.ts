import type { SimplifiedLayout } from "../../../types/simplified-types.js";
import { px } from "../utils/css-color.js";

type Axis = "horizontal" | "vertical";

export function applyAxisSizing(
  styles: Record<string, string>,
  layout: SimplifiedLayout,
  axis: Axis,
  allow: boolean,
  sizing: SimplifiedLayout["sizing"][Axis],
) {
  if (!sizing) return;

  const sizeProp = axis === "horizontal" ? "width" : "height";
  const dim = axis === "horizontal" ? layout.dimensions?.width : layout.dimensions?.height;
  const max = axis === "horizontal" ? layout.maxWidth : layout.maxHeight;
  const growParentMode = axis === "horizontal" ? "row" : "column";

  if (sizing === "fill") {
    if (layout.parentMode === growParentMode) {
      styles["flex"] = "1 1 0";
      return;
    }
    if (!allow) return;
    if (max !== undefined || layout.position === "absolute") {
      styles[sizeProp] = "100%";
    } else {
      styles["align-self"] = "stretch";
    }
    return;
  }

  if (sizing === "hug") {
    if (axis === "horizontal" && !allow) {
      styles["white-space"] = "nowrap";
      return;
    }
    if (dim && allow) styles[sizeProp] = px(dim);
    return;
  }

  if (sizing === "fixed") {
    if (dim && allow) styles[sizeProp] = px(dim);
  }
}