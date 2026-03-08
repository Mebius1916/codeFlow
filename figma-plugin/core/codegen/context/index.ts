import type { SimplifiedDesign, GlobalVars } from "../../types/extractor-types.js";
import { buildClassNameMap } from "../css/builders/css-builder.js";

export interface CodegenContext {
  design: SimplifiedDesign;
  globalVars: GlobalVars;
  assets: Map<string, string>;
}

export function createCodegenContext(design: SimplifiedDesign): CodegenContext {
  const styles = { ...design.globalVars.styles };
  return {
    design,
    globalVars: {
      styles,
      imageAssets: design.globalVars.imageAssets,
      styleCache: design.globalVars.styleCache,
      classNameMap: buildClassNameMap(styles),
    },
    assets: new Map(),
  };
}
