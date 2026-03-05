import { v4 as uuidv4 } from "uuid";
import type { SimplifiedNode } from "../../../types/extractor-types.js";
import type { BoundingBox } from "../../../types/simplified-types.js";
import { getUnionRect, calculateRelativePosition } from "../../../utils/geometry.js";
import type { SimplifiedLayout } from "../../../types/simplified-types.js";;
import { computeAutoLayoutGap, inferAutoLayoutAlignment } from "./auto-layout.js";

type BaseVirtualOptions = Pick<
  CreateVirtualFrameOptions,
  "children" | "semanticTag" | "visualSignature" | "idPrefix"
> & {
  name: string;
};
export interface CreateVirtualFrameOptions {
  idPrefix?: string;
  name?: string;
  type?: "CONTAINER";
  layout?: SimplifiedLayout;
  children: SimplifiedNode[];
  // Additional props
  semanticTag?: 
    "list" | "icon" | "group" | "button" | "input" |
    "section" | "header" | "footer" | "nav" | "article" |
    "aside" | "main" | "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  visualSignature?: string;
}

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

// 创建基础容器
export function createVirtualFrame(options: CreateVirtualFrameOptions): SimplifiedNode {
  const { 
    idPrefix = "virtual",
    name = "Virtual Container", 
    type = "CONTAINER",
    layout,
    children,
    semanticTag,
    visualSignature
  } = options;

  if (layout && typeof layout === "object") {
    const nextParentMode =
      layout.mode === "row" || layout.mode === "column" ? layout.mode : "none";
    for (const child of children) {
      if (typeof child.layout === "object" && child.layout) {
        // Fix: Absolute children should not inherit parent layout mode (they are out of flow)
        const isAbsolute = child.layout.position === "absolute";
        child.layout = {
          ...child.layout,
          parentMode: isAbsolute ? "none" : nextParentMode,
        };
      }
    }
  }

  const rects = children.map(c => c.absRect).filter((r): r is BoundingBox => !!r);
  const unionRect = getUnionRect(rects); // 获取总包围盒

  const node: SimplifiedNode = {
    id: `${idPrefix}-${uuidv4()}`,
    name,
    type,
    absRect: unionRect, // 默认自带总包围盒
    children,
    semanticTag,
    visualSignature
  };

  if (layout) {
    node.layout = layout;
  }

  return node;
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
    layout: { mode: "none", position: "relative" },
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
          : { mode: "none" as const };
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
