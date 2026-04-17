import { compressHtml } from "./compress-html.js";
import { diffPngTool } from "./diff-png.js";

export const toolDirectory = [
  {
    name: "compressHtml",
    description: "Html 压缩",
  },
  {
    name: "diffPng",
    description: "对比两张 PNG（base64），返回差异比例与差异图（base64）",
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
    case "diffPng":
      return diffPngTool(input);
  }
}
