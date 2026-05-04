import { buildTailwindClassMap } from "./css/build-map.js";
import { cleanTailwindFragment } from "./html/clean-fragment.js";
import { rewriteHtmlFragmentClasses } from "./html/rewrite-classes.js";

export type { TailwindClassMapping } from "./css/build-map.js";

export async function convertHtmlCssToTailwind(
  htmlFragment: string,
  cssText: string,
): Promise<string> {
  // 先把 CSS 类规则映射为 Tailwind utilities，再回写到 HTML 片段。
  const mappings = await buildTailwindClassMap(cssText);
  const rewrittenFragment = rewriteHtmlFragmentClasses(htmlFragment, mappings);
  return cleanTailwindFragment(rewrittenFragment);
}
