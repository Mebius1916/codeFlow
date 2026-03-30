import type { SimplifiedDesign, GlobalVars } from "../../types/extractor-types.js";
import { splitLayoutAtomsInStyles } from "../../utils/style-helper.js";
import { buildClassNameMap } from "../css/builders/css-builder.js";

export interface CodegenContext {
  design: SimplifiedDesign;
  globalVars: GlobalVars;
  assets: Map<string, string>;
}

export function createCodegenContext(design: SimplifiedDesign): CodegenContext {
  const styles = { ...design.globalVars.styles };

  const globalVars: GlobalVars = {
    styles,
    imageAssets: design.globalVars.imageAssets,
  };

  splitLayoutAtomsInStyles(globalVars);
  globalVars.classNameMap = buildClassNameMap(styles);

  return {
    design,
    globalVars,
    assets: new Map(),
  };
}
