import type { TraversalContext } from "../../../types/extractor-types.js";

export function expandStyleToLeafClasses(
  styleId: string,
  globalVars?: TraversalContext["globalVars"],
): string[] {
  const styles = globalVars?.styles;
  const classNameMap = globalVars?.classNameMap;
  if (!styles) return [classNameMap?.[styleId] ?? styleId];

  const seen = new Set<string>();
  const out: string[] = [];

  const visit = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    const styleObj: any = (styles as any)[id];
    if (styleObj?.refs && Array.isArray(styleObj.refs)) {
      styleObj.refs.forEach((ref: string) => visit(ref));
      return;
    }
    out.push(classNameMap?.[id] ?? id);
  };

  visit(styleId);
  return Array.from(new Set(out));
}

