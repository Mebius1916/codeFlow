import type { SimplifiedDesign, SimplifiedNode } from "../../types/extractor-types.js";
import { hasVisibleStyles } from "../../utils/node-check.js";

/**
 * Flattens redundant nested groups/frames that don't contribute to layout or style.
 */
export function flattenRedundantNodes(
  nodes: SimplifiedNode[],
  globalVars: SimplifiedDesign['globalVars']
): SimplifiedNode[] {
  // 逐节点递归处理，dirty 节点才会进入递归与扁平化判断
  return nodes.map(node => flattenNode(node, globalVars));
}

function flattenNode(
  node: SimplifiedNode,
  globalVars: SimplifiedDesign['globalVars']
): SimplifiedNode {
  // 1. dirty 仅影响是否递归处理子节点
  if (node.dirty && node.children && node.children.length > 0) {
    node.children = flattenRedundantNodes(node.children, globalVars);
  }

  // 2. 扁平化判断与 dirty 无关
  if (isRedundant(node, globalVars)) {
    return node.children![0]; 
  }

  return node;
}

function isRedundant(
  node: SimplifiedNode,
  globalVars: SimplifiedDesign['globalVars']
): boolean {
  // Must have exactly one child
  if (!node.children || node.children.length !== 1) return false;

  // 必须是容器节点，避免误删文本/图片/图标
  if (node.type !== 'CONTAINER') return false;
  
  
  // 不能有可见样式，否则扁平化会丢失视觉信息
  if (hasVisibleStyles(node)) return false;

  // 有语义标签的节点保留，避免语义信息丢失
  if (node.semanticTag) return false;

  // 必须对布局没有影响（padding/gap/定位/尺寸等）
  if (hasLayoutImpact(node, globalVars)) return false;

  return true;
}

function hasLayoutImpact(
  node: SimplifiedNode,
  globalVars: SimplifiedDesign['globalVars']
): boolean {
  if (!node.layout) return false;

  const resolvedLayout = typeof node.layout === 'string'
    ? globalVars.styles[node.layout]
    : node.layout;
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
  return false;
}

function nearlyEqual(a: number, b: number, epsilon = 1): boolean {
  return Math.abs(a - b) <= epsilon;
}
