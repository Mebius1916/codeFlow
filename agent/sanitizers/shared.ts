export interface SanitizeOutputContext {
  currentHtml?: string;
  previousHtml?: string;
}

export function findOpeningTagByDataId(
  html: string,
  dataId: string
): string | undefined {
  const markerIndex = html.indexOf(`data-id="${dataId}"`);
  const resolvedIndex =
    markerIndex !== -1 ? markerIndex : html.indexOf(`data-id='${dataId}'`);
  if (resolvedIndex === -1) {
    return undefined;
  }

  const tagStart = html.lastIndexOf("<", resolvedIndex);
  const tagEnd = html.indexOf(">", resolvedIndex);
  if (tagStart === -1 || tagEnd === -1) {
    return undefined;
  }

  return html.slice(tagStart, tagEnd + 1);
}

export function extractAttributeValue(
  openingTag: string,
  attributeName: string
): string | undefined {
  const match = openingTag.match(
    new RegExp(`\\b${attributeName}=(["'])([\\s\\S]*?)\\1`)
  );
  return match?.[2];
}

export function extractDataIds(html: string): string[] {
  return [...html.matchAll(/data-id=(["'])(.*?)\1/g)].map((match) => match[2]);
}
