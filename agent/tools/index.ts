import { compressHtml } from "./compress-html.js";

export const toolDirectory = [
  {
    name: "compressHtml",
    description: "Html 压缩",
  },
] as const;

export type ToolName = (typeof toolDirectory)[number]["name"];

export function listTools() {
  return toolDirectory;
}

export async function callTool(name: ToolName, input: string): Promise<string> {
  switch (name) {
    case "compressHtml":
      return compressHtml(input);
  }
}
