import type { SimplifiedLayout } from "../../types/simplified-types.js";
import type { SimplifiedNode } from "../../types/extractor-types.js";
import { hasVisibleStyles } from "../../utils/node-check.js";

/**
 * Flattens redundant nested groups/frames that don't contribute to layout or style.
 */
export function flattenRedundantNodes(
  nodes: SimplifiedNode[],
): SimplifiedNode[] {
  return nodes.map((node) => {
    if (node.children && node.children.length > 0) {
      node.children = flattenRedundantNodes(node.children);
    }
    
    // 尝试合并包装容器 (包括绝对定位容器和普通 Group 包装)
    if (shouldFlattenWrapper(node)) {
      const child = node.children![0];
      const layout = node.layout as SimplifiedLayout;
      const childLayout = child.layout as SimplifiedLayout;
      const parentLoc = layout.locationRelativeToParent || { x: 0, y: 0 };
      const childLoc = childLayout.locationRelativeToParent || { x: 0, y: 0 };

      // 坐标累加：新子节点坐标 = 父节点坐标 + 子节点坐标
      if (!child.layout) {
        child.layout = { mode: "none" }; // 确保有默认 layout 对象
      } else if (typeof child.layout === "string") {
        // 如果是 string 引用，这种情况下我们无法直接修改，跳过合并
        return node;
      }
      
      const mutableChildLayout = child.layout as SimplifiedLayout;
      mutableChildLayout.locationRelativeToParent = {
        x: parentLoc.x + childLoc.x,
        y: parentLoc.y + childLoc.y,
      };
      
      // 如果父节点是 absolute，子节点继承该属性
      if (layout.position === "absolute") {
        mutableChildLayout.position = "absolute";
      }

      return child;
    }

    // 是否可以拍平
    if (isRedundant(node)) {
      return node.children![0];
    }
    return node;
  });
}

/**
 * 判断节点是否为可合并的包装容器
 * 覆盖场景：
 * 1. 纯绝对定位容器嵌套 (Absolute -> Absolute)
 * 2. 普通 Group 包裹单一子节点 (Group -> Child)
 */
function shouldFlattenWrapper(node: SimplifiedNode): boolean {
  // 必须只有一个子节点
  if (!node.children || node.children.length !== 1) return false;
  
  const child = node.children[0];
  
  // 必须是 layout 对象，不能是引用字符串
  if (typeof node.layout === "string" || typeof child.layout === "string") return false;

  const layout = node.layout || { mode: "none" };

  // 1. 父级必须是容器且非 Flex 布局
  if (layout.mode !== "none") return false; 
  
  // 2. 节点必须没有视觉样式 (背景/边框/裁剪)
  if (hasVisibleStyles(node)) return false;
  
  if (layout.clipsContent) return false;

  return true;
}

function isRedundant(
  node: SimplifiedNode,
): boolean {
  // Must have exactly one child
  if (!node.children || node.children.length !== 1) return false;

  // 必须是容器节点，避免误删文本/图片/图标
  if (node.type !== 'CONTAINER') return false;
  
  
  // 不能有可见样式，否则扁平化会丢失视觉信息
  if (hasVisibleStyles(node)) return false;

  if (node.semanticTag) {
    const child = node.children[0];
    if (child.semanticTag !== node.semanticTag) return false;
  }

  // 必须对布局没有影响（padding/gap/定位/尺寸等）
  if (hasLayoutImpact(node)) return false;

  return true;
}

function hasLayoutImpact(
  node: SimplifiedNode,
): boolean {
  if (!node.layout) return false;

  const resolvedLayout = node.layout;
  if (!resolvedLayout) return false;
  const layout = resolvedLayout as any;
  const child = node.children?.[0];
  const sizing = layout.sizing;
  const hasSizing = sizing && (sizing.horizontal || sizing.vertical);
  const dimensionOnlyKeys = ["mode", "sizing", "dimensions"];
  // 仅有尺寸相关字段且父子边界一致时，不认为有布局影响
  const hasOnlyDimensions = Object.keys(layout).every(key => dimensionOnlyKeys.includes(key)) && !hasSizing;
  if (hasOnlyDimensions && node.absRect && child?.absRect) {
    const sameBounds = nearlyEqual(node.absRect.x, child.absRect.x)
      && nearlyEqual(node.absRect.y, child.absRect.y)
      && nearlyEqual(node.absRect.width, child.absRect.width)
      && nearlyEqual(node.absRect.height, child.absRect.height);
    if (sameBounds) return false;
  }
  // 其余 layout 属性一旦存在，视为有布局影响
  if (layout.padding && layout.padding !== '0px' && layout.padding !== '0') return true;
  if (layout.gap && layout.gap !== '0px' && layout.gap !== '0') return true;
  if (layout.wrap) return true;
  if (layout.justifyContent || layout.alignItems || layout.alignSelf) return true;
  if (layout.position === 'absolute') return true;
  if (layout.locationRelativeToParent) return true;
  if (layout.dimensions && (layout.dimensions.width || layout.dimensions.height || layout.dimensions.aspectRatio)) return true;
  if (layout.sizing && (layout.sizing.horizontal || layout.sizing.vertical)) return true;
  if (layout.overflowScroll && layout.overflowScroll.length > 0) return true;
  if (layout.clipsContent) return true;
  return false;
}

function nearlyEqual(a: number, b: number, epsilon = 1): boolean {
  return Math.abs(a - b) <= epsilon;
}
