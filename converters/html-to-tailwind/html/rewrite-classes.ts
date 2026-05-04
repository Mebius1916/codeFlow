import type { TailwindClassMapping } from "../css/build-map.js";
import {
  parseHtmlFragment,
  readClassList,
  writeClassList,
} from "./class-utils.js";

export function rewriteHtmlFragmentClasses(
  htmlFragment: string,
  mappings: TailwindClassMapping[],
): string {
  const classMap = new Map(mappings.map((mapping) => [mapping.sourceClassName, mapping.tailwindClasses]));
  const document = parseHtmlFragment(htmlFragment);

  for (const element of document.querySelectorAll("*")) {
    const sourceClasses = readClassList(element);
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
      writeClassList(element, tailwindClasses);
      continue;
    }

    writeClassList(element, []);
  }

  return document.toString().trim();
}
