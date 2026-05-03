import { parse } from "node-html-parser";
import type { TailwindClassMapping } from "./map-css-to-tailwind.js";

export function rewriteHtmlFragmentClasses(
  htmlFragment: string,
  mappings: TailwindClassMapping[],
): string {
  const classMap = new Map(mappings.map((mapping) => [mapping.sourceClassName, mapping.tailwindClasses]));
  const document = parse(htmlFragment, { comment: true });

  for (const element of document.querySelectorAll("*")) {
    const sourceClasses = (element.getAttribute("class") ?? "")
      .split(/\s+/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (sourceClasses.length === 0) {
      continue;
    }

    const tailwindClasses: string[] = [];
    sourceClasses.forEach((sourceClassName) => {
      classMap.get(sourceClassName)?.forEach((tailwindClass) => {
        if (!tailwindClass || tailwindClasses.includes(tailwindClass)) {
          return;
        }
        tailwindClasses.push(tailwindClass);
      });
    });

    if (tailwindClasses.length > 0) {
      element.setAttribute("class", tailwindClasses.join(" "));
      continue;
    }

    element.removeAttribute("class");
  }

  return document.toString().trim();
}
