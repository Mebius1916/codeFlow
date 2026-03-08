import type { LayoutMeta, SimplifiedNode, TraversalContext } from "../../types/extractor-types.js";
import type { SimplifiedLayout } from "../../types/simplified-types.js";
import { findOrCreateVar, addStyleRef, buildNodeStyle, createNodeStyleId } from "../../utils/style-helper.js";
import { convertFlexAlignSelf } from "../../transformers/utils/flex-adapter.js";

// 递归处理整棵节点树并合并为单一 styles
export function normalizeNodeStyles(
  nodes: SimplifiedNode[],
  globalVars: TraversalContext["globalVars"]
): SimplifiedNode[] {
  const normalize = (
    node: SimplifiedNode,
    parentMode: SimplifiedLayout["mode"],
  ): SimplifiedNode => {
    normalizeDerivedLayout(node, globalVars, parentMode);

    const selfMode =
      node.layout && typeof node.layout !== "string" ? (node.layout as SimplifiedLayout).mode : "none";

    if (node.children && node.children.length > 0) {
      node.children = node.children.map((child) => normalize(child, selfMode));
    }

    const layoutRefs = buildLayoutRefs(node, globalVars);
    const refs = collectStyleRefs(node, globalVars, layoutRefs);
    if (refs.length > 0) {
      node.styles = createNodeStyleId(globalVars, node, refs);
    }
    clearStyleFields(node);
    return node;
  };

  return nodes.map((node) => normalize(node, "none"));
}

// 将 layout 对象转为两个 styleId
function buildLayoutRefs(
  node: SimplifiedNode,
  globalVars: TraversalContext["globalVars"],
) {
  if (!node.layout || typeof node.layout === "string") return {};

  const layout = node.layout as SimplifiedLayout;
  const { atom, rest } = extractLayoutAtoms(layout);
  let atomId: string | undefined;

  if (atom) {
    atomId = findOrCreateVar(globalVars, atom as any, "layout-atom");
  }

  const layoutId = findOrCreateVar(globalVars, rest as any, "layout");
  node.layout = layoutId;
  return { atomId, layoutId };
}

// 将 layout 分为 atom（可复用） 和 rest（不可复用） 两个部分
function extractLayoutAtoms(layout: SimplifiedLayout) {
  if (layout.mode === "none") {
    return { atom: undefined, rest: layout };
  }

  const hasAlign =
    layout.justifyContent !== undefined || layout.alignItems !== undefined;

  if (!hasAlign) {
    return { atom: undefined, rest: layout };
  }

  const atom: Partial<SimplifiedLayout> = {
    mode: layout.mode,
    justifyContent: layout.justifyContent,
    alignItems: layout.alignItems,
    sizing: {},
  };

  const rest: SimplifiedLayout = {
    ...layout,
    justifyContent: undefined,
    alignItems: undefined,
  };

  return { atom, rest };
}

// 重新计算 alignSelf
function normalizeDerivedLayout(
  node: SimplifiedNode,
  globalVars: TraversalContext["globalVars"],
  parentMode: SimplifiedLayout["mode"],
) {
  if (!node.layout || typeof node.layout === "string") return;

  const layout = node.layout as SimplifiedLayout;
  layout.parentMode = parentMode;

  const metaById = globalVars.layoutMetaById;
  if (!metaById) return;
  const meta: LayoutMeta | undefined = metaById[node.id];
  if (!meta) return;
  if (!meta.layoutAlignSelf) return;

  const sizing = meta.layoutSizing;
  let crossAxisSizing: unknown;
  if (parentMode === "row") crossAxisSizing = sizing?.vertical;
  else if (parentMode === "column") crossAxisSizing = sizing?.horizontal;

  layout.alignSelf = convertFlexAlignSelf(meta.layoutAlignSelf, crossAxisSizing as any);
}

// 汇总节点上的所有 styleId
function collectStyleRefs(
  node: SimplifiedNode,
  globalVars: TraversalContext["globalVars"],
  layoutRefs: { atomId?: string; layoutId?: string },
): string[] {
  const refs = new Set<string>();
  addStyleRef(refs, node.styles);
  addStyleRef(refs, layoutRefs.atomId);
  addStyleRef(refs, layoutRefs.layoutId ?? (typeof node.layout === "string" ? node.layout : undefined));
  if (node.type !== "TEXT" && node.type !== "SVG") {
    addStyleRef(refs, node.fills);
  }
  addStyleRef(refs, node.textStyle);
  addStyleRef(refs, node.strokes);
  addStyleRef(refs, node.effects);
  const nodeStyle = buildNodeStyle(node);
  if (Object.keys(nodeStyle).length > 0) {
    addStyleRef(refs, findOrCreateVar(globalVars, nodeStyle, "node"));
  }
  return Array.from(refs);
}

// 清理节点上拆分的样式字段，仅保留 styles
function clearStyleFields(node: SimplifiedNode) {
  node.layout = undefined;
  node.fills = undefined;
  node.textStyle = undefined;
  node.strokes = undefined;
  node.effects = undefined;
  node.opacity = undefined;
  node.borderRadius = undefined;
  node.transform = undefined;
  node.blendMode = undefined;
  node.visible = undefined;
}
