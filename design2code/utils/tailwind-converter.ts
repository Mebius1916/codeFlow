import { TailwindConverter } from "css-to-tailwindcss";
import { parse } from "node-html-parser";
import type { Rule } from "postcss";

export interface TailwindSelectorMapping {
  className: string;
  tailwindClasses: string[];
}

export interface TailwindConversionResult {
  fragment: string;
  mappings: TailwindSelectorMapping[];
}

const tailwindConverter = new TailwindConverter({
  remInPx: 16,
  arbitraryPropertiesIsEnabled: true,
  tailwindConfig: {
    content: [],
  },
});

export async function convertHtmlCssToTailwind(
  html: string,
  css: string,
): Promise<TailwindConversionResult> {
  const mappings = await buildClassMappings(css);
  const classMap = new Map(
    mappings.map((mapping) => [mapping.className, mapping.tailwindClasses]),
  );
  const document = parse(html, {
    comment: true,
  });

  for (const element of document.querySelectorAll("*")) {
    const originalClasses = (element.getAttribute("class") ?? "")
      .split(/\s+/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (originalClasses.length === 0) {
      continue;
    }

    const nextClasses: string[] = [];
    for (const className of originalClasses) {
      const tailwindClasses = classMap.get(className);
      if (tailwindClasses) {
        for (const tailwindClass of tailwindClasses) {
          if (!tailwindClass || nextClasses.includes(tailwindClass)) {
            continue;
          }
          nextClasses.push(tailwindClass);
        }
      } else {
        if (!nextClasses.includes(className)) {
          nextClasses.push(className);
        }
      }
    }

    if (nextClasses.length > 0) {
      element.setAttribute("class", nextClasses.join(" "));
    } else {
      element.removeAttribute("class");
    }
  }

  const body = document.querySelector("body");
  const fragment = body?.innerHTML.trim() ?? document.toString().trim();

  return {
    fragment,
    mappings,
  };
}

async function buildClassMappings(css: string): Promise<TailwindSelectorMapping[]> {
  const { convertedRoot } = await tailwindConverter.convertCSS(css);
  const mappings: TailwindSelectorMapping[] = [];

  convertedRoot.walkRules((rule: Rule) => {
    const tailwindClasses = extractTailwindClasses(rule);
    if (tailwindClasses.length === 0) {
      return;
    }
    const classNames = Array.from(
      new Set((rule.selector.match(/\.([_a-zA-Z]+[\w-]*)/g) ?? []).map((item) => item.slice(1))),
    );
    for (const className of classNames) {
      mappings.push({
        className,
        tailwindClasses,
      });
    }
  });

  return mappings;
}

function extractTailwindClasses(rule: Rule): string[] {
  const output: string[] = [];

  rule.nodes?.forEach((node) => {
    if (node.type !== "atrule" || node.name !== "apply") {
      return;
    }
    node.params.split(/\s+/).filter(Boolean).forEach((className) => {
      if (!output.includes(className)) {
        output.push(className);
      }
    });
  });

  return output;
}
