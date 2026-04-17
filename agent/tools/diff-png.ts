import { diffPng } from "../utils/diff-png.js";

export async function diffPngTool(input: string): Promise<string> {
  let payload: any;
  try {
    payload = JSON.parse(input);
  } catch {
    throw new Error("diffPng 工具入参必须是 JSON 字符串");
  }

  const baselineBase64 = payload?.baselineBase64;
  const currentBase64 = payload?.currentBase64;
  const threshold = payload?.threshold;

  if (!baselineBase64) throw new Error("diffPng 工具入参 baselineBase64 必须是非空字符串");
  if (!currentBase64) throw new Error("diffPng 工具入参 currentBase64 必须是非空字符串");
  if (typeof threshold !== "number" || Number.isNaN(threshold)) {
    throw new Error("diffPng 工具入参 threshold 必须是 number");
  }

  const result = diffPng(baselineBase64, currentBase64, threshold);
  return JSON.stringify(result);
}
