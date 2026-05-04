import { HTMLElement } from "node-html-parser";
import {
  parseHtmlFragment,
  readClassList,
  writeClassList,
} from "./class-utils.js";

export function cleanTailwindFragment(htmlFragment: string): string {
  const document = parseHtmlFragment(htmlFragment);

  for (const element of document.querySelectorAll("*")) {
    const classes = readClassList(element);
    if (classes.length === 0) {
      continue;
    }

    const cleanedClasses = cleanupClassList(classes);
    writeClassList(element, cleanedClasses);
  }

  trimDuplicateTextClasses(document);
  return document.toString().trim();
}

function cleanupClassList(classes: string[]): string[] {
  const normalizedClasses = classes
    .map((className) => normalizeClassName(className))
    .filter(Boolean) as string[];

  return Array.from(new Set(normalizedClasses));
}

function normalizeClassName(className: string): string {
  if (className === "text-[white]") {
    return "text-white";
  }

  if (className === "border-[white]") {
    return "border-white";
  }

  return className;
}

function trimDuplicateTextClasses(root: HTMLElement) {
  for (const paragraph of root.querySelectorAll("p")) {
    const spanChildren = paragraph.childNodes.filter(
      (node) => node instanceof HTMLElement && node.tagName === "SPAN",
    ) as HTMLElement[];
    if (spanChildren.length !== 1 || paragraph.childNodes.length !== 1) {
      continue;
    }

    const span = spanChildren[0];
    const parentClasses = readClassList(paragraph);
    const spanClasses = readClassList(span);
    if (parentClasses.length === 0 || spanClasses.length === 0) {
      continue;
    }

    const nextSpanClasses = spanClasses.filter((className) => {
      return !parentClasses.includes(className);
    });

    const normalizedSpanClasses = parentClasses.includes("whitespace-nowrap")
      ? nextSpanClasses.filter((className) => className !== "break-words")
      : nextSpanClasses;

    writeClassList(span, normalizedSpanClasses);
  }
}
