import { HTMLElement, parse } from "node-html-parser";

const HTML_PARSE_OPTIONS = { comment: true } as const;

export function parseHtmlFragment(htmlFragment: string) {
  return parse(htmlFragment, HTML_PARSE_OPTIONS);
}

export function readClassList(element: HTMLElement): string[] {
  return (element.getAttribute("class") ?? "")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function writeClassList(element: HTMLElement, classNames: string[]) {
  if (classNames.length > 0) {
    element.setAttribute("class", classNames.join(" "));
    return;
  }

  element.removeAttribute("class");
}
