import { TailwindConverter } from "css-to-tailwindcss";
import type { Rule } from "postcss";

export interface TailwindClassMapping {
  sourceClassName: string;
  tailwindClasses: string[];
}

const tailwindConverter = new TailwindConverter({
  remInPx: 16,
  arbitraryPropertiesIsEnabled: true,
  tailwindConfig: { content: [] },
});

export async function buildTailwindClassMap(cssText: string): Promise<TailwindClassMapping[]> {
  const { convertedRoot } = await tailwindConverter.convertCSS(cssText);
  const mappings: TailwindClassMapping[] = [];

  convertedRoot.walkRules((rule: Rule) => {
    const tailwindClasses = collectTailwindClasses(rule);
    if (tailwindClasses.length === 0) {
      return;
    }

    const classNames = Array.from(
      new Set((rule.selector.match(/\.([_a-zA-Z]+[\w-]*)/g) ?? []).map((item) => item.slice(1))),
    );

    classNames.forEach((sourceClassName) => {
      mappings.push({ sourceClassName, tailwindClasses });
    });
  });

  return mappings;
}

function collectTailwindClasses(rule: Rule): string[] {
  const output: string[] = [];

  rule.nodes?.forEach((node) => {
    if (node.type !== "atrule" || node.name !== "apply") {
      return;
    }

    node.params.split(/\s+/).filter(Boolean).forEach((tailwindClass) => {
      if (!output.includes(tailwindClass)) {
        output.push(tailwindClass);
      }
    });
  });

  return output;
}
