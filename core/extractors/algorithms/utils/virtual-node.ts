import { v4 as uuidv4 } from "uuid";
import type { SimplifiedNode } from "../../../types/extractor-types.js";
import type { BoundingBox } from "../../../types/simplified-types.js";
import { getUnionRect } from "../../../utils/geometry.js";
import type { SimplifiedLayout } from "../../../types/simplified-types.js";;
import { pixelRound } from "../../../utils/common.js";
import { computeAutoLayoutGap } from "./auto-layout.js";

type BaseVirtualOptions = Pick<
  CreateVirtualFrameOptions,
  "children" | "semanticTag" | "visualSignature" | "dirty"
> & {
  name: string;
};
export interface CreateVirtualFrameOptions {
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
  dirty?: boolean;
}

/**
 * Creates a standardized virtual container (Frame/Group) wrapping the provided children.
 * Automatically calculates the union bounding box.
 */
export function createVirtualFrame(options: CreateVirtualFrameOptions): SimplifiedNode {
  const { 
    name = "Virtual Container", 
    type = "CONTAINER",
    layout,
    children,
    semanticTag,
    visualSignature,
    dirty
  } = options;

  if (layout && typeof layout === "object") {
    const nextParentMode =
      layout.mode === "row" || layout.mode === "column" ? layout.mode : "none";
    for (const child of children) {
      if (typeof child.layout === "object" && child.layout) {
        child.layout = {
          ...child.layout,
          parentMode: nextParentMode,
        };
      }
    }
  }

  const rects = children.map(c => c.absRect).filter((r): r is BoundingBox => !!r);
  const unionRect = getUnionRect(rects); // 获取总包围盒

  const node: SimplifiedNode = {
    id: `virtual-${uuidv4()}`,
    name,
    type,
    absRect: unionRect, // 默认自带总包围盒
    children,
    semanticTag,
    visualSignature,
    dirty
  };

  if (layout) {
    node.layout = layout;
  }

  return node;
}

// 通过 gap 来计算是相绝布局还是 autoLayout
export function buildContainerByGap(
  options: BaseVirtualOptions & {
    direction: "row" | "column";
    allowSingle?: boolean;
  }
): SimplifiedNode {
  const {
    name,
    children,
    direction,
    semanticTag,
    dirty,
    allowSingle,
  } = options;
  if (allowSingle && children.length === 1) return children[0];
  const { gap, uniform } = computeAutoLayoutGap(children, direction);
  // 如果 gap 不同，就用相绝布局
  if (!uniform) return createPositionContainer({ name, children, semanticTag, dirty });
  // 如果 gap 相同，就用 autoLayout
  return createAutoLayoutContainer({
    name,
    children,
    direction,
    gap,
    semanticTag,
    dirty
  });
}

function createAutoLayoutContainer(options: BaseVirtualOptions & { direction: "row" | "column"; gap: number }) {
  const {
    name,
    children,
    direction,
    gap,
    semanticTag,
    visualSignature,
    dirty
  } = options;
  return createVirtualFrame({
    name,
    type: "CONTAINER",
    layout: {
      mode: direction,
      gap: `${gap}px`,
    },
    children,
    semanticTag,
    visualSignature,
    dirty
  });
}

function createPositionContainer(options: BaseVirtualOptions) {
  const {
    name,
    children,
    semanticTag,
    visualSignature,
    dirty
  } = options;
  const container = createVirtualFrame({
    name,
    type: "CONTAINER",
    layout: { mode: "none", position: "relative" },
    children,
    semanticTag,
    visualSignature,
    dirty
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
        locationRelativeToParent: {
          x: pixelRound(childRect.x - parentRect.x),
          y: pixelRound(childRect.y - parentRect.y),
        },
      };
    });
  }
  return container;
}