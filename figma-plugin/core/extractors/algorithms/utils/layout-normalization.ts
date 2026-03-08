import type { LayoutMeta, SimplifiedNode, TraversalContext } from "../../../types/extractor-types.js";
import type { SimplifiedLayout } from "../../../types/simplified-types.js";
import { convertFlexAlignSelf } from "../../../transformers/utils/flex-adapter.js";
import { findOrCreateVar } from "../../../utils/style-helper.js";

export function normalizeDerivedLayout(
  node: SimplifiedNode,
  globalVars: TraversalContext["globalVars"],
  parentMode: SimplifiedLayout["mode"],
) {
  if (!node.layout || typeof node.layout === "string") return;

  const layout = node.layout as SimplifiedLayout;
  layout.parentMode = parentMode;

  const metaById = globalVars.layoutMetaById ?? (globalVars.layoutMetaById = {});
  const meta: LayoutMeta = metaById[node.id] ?? (metaById[node.id] = {});

  const sizing = meta.layoutSizing;
  let crossAxisSizing: unknown;
  if (parentMode === "row") crossAxisSizing = sizing?.vertical;
  else if (parentMode === "column") crossAxisSizing = sizing?.horizontal;

  layout.alignSelf = convertFlexAlignSelf(meta.layoutAlignSelf, crossAxisSizing as any);
}


export function buildLayoutRefs(
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


function extractLayoutAtoms(layout: SimplifiedLayout): {
  atom?: Partial<SimplifiedLayout>;
  rest: SimplifiedLayout;
} {
  const atom: Partial<SimplifiedLayout> = {};
  if (layout.wrap) atom.wrap = layout.wrap;
  if (layout.justifyContent) atom.justifyContent = layout.justifyContent;
  if (layout.alignItems) atom.alignItems = layout.alignItems;
  if (layout.alignContent) atom.alignContent = layout.alignContent;
  if (layout.gap) atom.gap = layout.gap;
  if (layout.alignSelf) atom.alignSelf = layout.alignSelf;

  const rest: SimplifiedLayout = { ...layout };
  if (atom.wrap) delete rest.wrap;
  if (atom.justifyContent) delete rest.justifyContent;
  if (atom.alignItems) delete rest.alignItems;
  if (atom.alignContent) delete rest.alignContent;
  if (atom.gap) delete rest.gap;
  if (atom.alignSelf) delete rest.alignSelf;

  return { atom: Object.keys(atom).length > 0 ? atom : undefined, rest };
}