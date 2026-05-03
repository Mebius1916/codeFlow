import { cleanTailwindFragment } from "./src/clean-tailwind-fragment.js";
import { buildTailwindClassMap } from "./src/map-css-to-tailwind.js";
import { rewriteHtmlFragmentClasses } from "./src/rewrite-html-fragment.js";

export type { TailwindClassMapping } from "./src/map-css-to-tailwind.js";

export async function convertHtmlCssToTailwind(htmlFragment: string, cssText: string): Promise<string> {
  const mappings = await buildTailwindClassMap(cssText);
  const tailwindFragment = rewriteHtmlFragmentClasses(htmlFragment, mappings);
  return cleanTailwindFragment(tailwindFragment);
}
