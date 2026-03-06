import type { SimplifiedNode } from "../../../types/extractor-types.js";
import type { SimplifiedLayout } from "../../../types/simplified-types.js";
import { calculateRelativePosition } from "../../../utils/geometry.js";
import { computeAutoLayoutGap, inferAutoLayoutAlignment } from "./auto-layout.js";
import { createVirtualFrame, type CreateVirtualFrameOptions } from "./virtual-node.js";

type BaseVirtualOptions = Pick<
  CreateVirtualFrameOptions,
  "children" | "semanticTag" | "visualSignature" | "idPrefix"
> & {
  name: string;
};

// 通过 gap 来计算是相绝布局还是 autoLayout
export function buildContainerByGap(
  options: BaseVirtualOptions & {
    direction: "row" | "column";
    allowSingle?: boolean;
    parent?: SimplifiedNode;
  }
): SimplifiedNode {
  const {
    name,
    children,
    direction,
    semanticTag,
    idPrefix,
    allowSingle,
    parent,
  } = options;
  if (allowSingle && children.length === 1) return children[0];
  const { gap, uniform } = computeAutoLayoutGap(children, direction);
  // 如果 gap 不同，就用相绝布局
  if (!uniform) return createPositionContainer({ name, children, semanticTag, idPrefix });
  // 如果 gap 相同，就用 autoLayout
  return createAutoLayoutContainer({
    name,
    children,
    direction,
    gap,
    semanticTag,
    idPrefix,
    parent,
  });
}

function createAutoLayoutContainer(options: BaseVirtualOptions & { direction: "row" | "column"; gap: number; parent?: SimplifiedNode }) {
  const {
    name,
    children,
    direction,
    gap,
    semanticTag,
    idPrefix,
    visualSignature,
    parent,
  } = options;

  // 推断对齐方式
  const { alignItems, justifyContent } = inferAutoLayoutAlignment(children, direction, parent);

  // 如果推断出 space-between，通常意味着这个容器应该撑满父容器 (Fill Container)
  const layoutStyle: SimplifiedLayout = {
    mode: direction,
    sizing: {},
    gap: `${gap}px`,
    alignItems: alignItems as SimplifiedLayout["alignItems"],
    justifyContent: justifyContent as SimplifiedLayout["justifyContent"],
  };

  if (parent && typeof parent.layout === "object" && parent.layout) {
    const parentMode = parent.layout.mode;
    layoutStyle.parentMode = parentMode === "row" || parentMode === "column" ? parentMode : "none";
  } else {
    layoutStyle.parentMode = "none";
  }

  if (justifyContent === "space-between") {
    // 强制撑满父容器 (对应 CSS: align-self: stretch; width: 100%)
    layoutStyle.sizing = {
      horizontal: "fill",
    };
    layoutStyle.alignSelf = "stretch";
  }

  // Check if any child needs horizontal/vertical space (explicit fill)
  const childHorizontalFill = children.some(c => {
    if (typeof c.layout !== "object" || !c.layout) return false;
    return c.layout.sizing?.horizontal === "fill";
  });
  
  const childVerticalFill = children.some(c => {
    if (typeof c.layout !== "object" || !c.layout) return false;
    return c.layout.sizing?.vertical === "fill";
  });

  if (childHorizontalFill) {
    layoutStyle.sizing = { ...layoutStyle.sizing, horizontal: "fill" };
    if (layoutStyle.parentMode === "column") {
      layoutStyle.alignSelf = "stretch";
    }
  }

  if (childVerticalFill) {
    layoutStyle.sizing = { ...layoutStyle.sizing, vertical: "fill" };
    if (layoutStyle.parentMode === "row") {
      layoutStyle.alignSelf = "stretch";
    }
  }

  return createVirtualFrame({
    idPrefix,
    name,
    type: "CONTAINER",
    layout: layoutStyle,
    children,
    semanticTag,
    visualSignature
  });
}

function createPositionContainer(options: BaseVirtualOptions) {
  const {
    name,
    children,
    semanticTag,
    idPrefix,
    visualSignature
  } = options;
  const container = createVirtualFrame({
    idPrefix,
    name,
    type: "CONTAINER",
    layout: { mode: "none", sizing: {}, position: "relative" },
    children,
    semanticTag,
    visualSignature
  });
  const parentRect = container.absRect;
  if (parentRect) {
    children.forEach((child) => {
      const childRect = child.absRect;
      if (!childRect) return;
      const resolvedLayout =
        typeof child.layout === "object" && child.layout
          ? child.layout
          : { mode: "none" as const, sizing: {} };
      child.layout = {
        ...resolvedLayout,
        position: "absolute",
        parentMode: "none",
        locationRelativeToParent: 
          calculateRelativePosition(childRect, parentRect),
      };
    });
  }
  return container;
}
