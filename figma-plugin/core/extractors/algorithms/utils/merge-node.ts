
import type { SimplifiedLayout } from "../../../types/simplified-types.js";
import type { SimplifiedNode } from "../../../types/extractor-types.js";
import { hasVisibleStyles } from "../../../utils/node-check.js";
import { isZeroPadding, mergePadding } from "./dynamic.js";
type MergeableParentChild = {
  parent: SimplifiedNode;
  child: SimplifiedNode;
  parentLayout: SimplifiedLayout;
  childLayout: SimplifiedLayout;
};


export function mergeNodeIntoOnlyChildRecursively(node: SimplifiedNode): SimplifiedNode {
  let current = node;
  while (true) {
    const mergeable = getMergeableParentChild(current);
    if (!mergeable) return current;
    current = mergeParentIntoOnlyChild(mergeable);
  }
}

function getMergeableParentChild(
  node: SimplifiedNode,
): MergeableParentChild | null {
  // 只有容器节点才需要合并
  if (node.type !== "CONTAINER") return null;
  // 只有只有一个子节点才需要合并
  if (!node.children || node.children.length !== 1) return null;

  // 只有子节点是容器节点才需要合并
  const child = node.children[0];
  if (child.type !== "CONTAINER") return null;

  // 只有父节点没有可见样式才需要合并
  if (hasVisibleStyles(node)) return null;

  const rawParentLayout = node.layout;
  const parentLayout: SimplifiedLayout =
     typeof rawParentLayout === "object" && rawParentLayout
      ? (rawParentLayout as SimplifiedLayout)
      : { mode: "none", sizing: {} };

  if (parentLayout.clipsContent) return null;
  if (parentLayout.overflowScroll
       && parentLayout.overflowScroll.length > 0) return null;

  if (node.semanticTag && child.semanticTag && 
      child.semanticTag !== node.semanticTag) return null;

  if (!child.layout) {
    child.layout = { mode: "none", sizing: {} };
  } else if (typeof child.layout === "string") {
    return null;
  }

  return { parent: node, child, parentLayout, childLayout: child.layout as SimplifiedLayout };
}

function mergeParentIntoOnlyChild(mergeable: MergeableParentChild): SimplifiedNode {
  const { parent, child, parentLayout, childLayout } = mergeable;

  // 合并父布局的属性到子布局
  if (parentLayout.parentMode && !childLayout.parentMode) {
    childLayout.parentMode = parentLayout.parentMode;
  }
  // 合并父布局的属性到子布局
  if (parentLayout.alignSelf && !childLayout.alignSelf) {
    childLayout.alignSelf = parentLayout.alignSelf;
  }

  // 合并Figma 的 Hug/Fill/Fixed 语义 到子布局
  if (parentLayout.sizing.horizontal) {
    if (parentLayout.sizing.horizontal === "fill" || !childLayout.sizing.horizontal) {
      childLayout.sizing.horizontal = parentLayout.sizing.horizontal;
    }
  }
  if (parentLayout.sizing.vertical) {
    if (parentLayout.sizing.vertical === "fill" || !childLayout.sizing.vertical) {
      childLayout.sizing.vertical = parentLayout.sizing.vertical;
    }
  }

  // 合并父布局的 minWidth/maxWidth 到子布局
  if (parentLayout.minWidth !== undefined && childLayout.minWidth === undefined) {
    childLayout.minWidth = parentLayout.minWidth;
  }
  if (parentLayout.maxWidth !== undefined && childLayout.maxWidth === undefined) {
    childLayout.maxWidth = parentLayout.maxWidth;
  }
  if (parentLayout.minHeight !== undefined && childLayout.minHeight === undefined) {
    childLayout.minHeight = parentLayout.minHeight;
  }
  if (parentLayout.maxHeight !== undefined && childLayout.maxHeight === undefined) {
    childLayout.maxHeight = parentLayout.maxHeight;
  }

  // 合并父布局的 固定尺寸信息 到子布局
  if (parentLayout.dimensions) {
    if (!childLayout.dimensions) childLayout.dimensions = {};
    if (parentLayout.dimensions.width !== undefined && 
        childLayout.dimensions.width === undefined) {
      childLayout.dimensions.width = parentLayout.dimensions.width;
    }
    if (parentLayout.dimensions.height !== undefined &&
       childLayout.dimensions.height === undefined) {
      childLayout.dimensions.height = parentLayout.dimensions.height;
    }
    if (parentLayout.dimensions.aspectRatio !== undefined && 
        childLayout.dimensions.aspectRatio === undefined) {
      childLayout.dimensions.aspectRatio = parentLayout.dimensions.aspectRatio;
    }
  }

  // 合并父布局的 position 到子布局
  if (parentLayout.position === "relative" && !childLayout.position) {
    childLayout.position = "relative";
  }

  // 合并父布局的 padding 到子布局
  if (parentLayout.padding && !isZeroPadding(parentLayout.padding)) {
    if (!hasVisibleStyles(child) && !childLayout.clipsContent) {
      childLayout.padding = mergePadding(parentLayout.padding, childLayout.padding);
    }
  }

  // 合并父布局的 locationRelativeToParent 到子布局
  const parentLoc = parentLayout.locationRelativeToParent;
  const childLoc = childLayout.locationRelativeToParent;
  if (parentLoc || childLoc) {
    const mergedLoc = {
      x: (parentLoc?.x ?? 0) + (childLoc?.x ?? 0),
      y: (parentLoc?.y ?? 0) + (childLoc?.y ?? 0),
    };

    if (parentLayout.position === "absolute") {
      childLayout.position = "absolute";
      childLayout.locationRelativeToParent = mergedLoc;
    } else if (childLayout.position === "absolute" && parentLoc) {
      childLayout.locationRelativeToParent = mergedLoc;
    }
  }

  // 合并父布局的 semanticTag 到子布局
  if (parent.semanticTag && !child.semanticTag) {
    child.semanticTag = parent.semanticTag;
  }

  // 合并父布局的 absRect 到子布局
  if (parent.absRect) {
    child.absRect = parent.absRect;
  }

  return child;
}
