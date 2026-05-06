import { renderAndDiffAgainstBaseline } from "../../utils/renderHtml.js";
import type { VisualRepairContext } from "../loop.js";

export async function refreshVisualRegression(
  context: VisualRepairContext
): Promise<void> {
  const config = context.input.visualRegression;
  if (!config?.renderEndpoint) return;

  const result = await renderAndDiffAgainstBaseline({
    endpoint: config.renderEndpoint,
    html: context.currentHtml,
    baselinePngBase64: context.input.baselinePngBase64,
    viewportWidth: config.viewportWidth,
    viewportHeight: config.viewportHeight,
    diffThreshold: config.diffThreshold,
  });

  context.currentPngBase64 = result.currentPngBase64;
  context.diffPngBase64 = result.diffPngBase64;
  context.diffRatio = result.diffRatio;
  context.similarity = result.similarity;
}
