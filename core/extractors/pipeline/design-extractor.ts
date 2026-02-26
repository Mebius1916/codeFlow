import type {
  GetFileResponse,
  GetFileNodesResponse,
} from "@figma/rest-api-spec";
import { simplifyComponents, simplifyComponentSets } from "../../transformers/component.js";
import type { SimplifiedDesign, TraversalContext } from "../../types/extractor-types.js";
import { extractFromDesign } from "./node-processor.js";
import { resolveImageAssetsFromFigma } from "./utils/image-assets.js";
import type { ReconstructionStepFlags } from "./reconstruction.js";
import { parseAPIResponse } from "./utils/parse-api.js";

/**
 * Extract a complete SimplifiedDesign from raw Figma API response using extractors.
 */
export async function simplifyRawFigmaObjectWithImages(
  apiResponse: GetFileResponse | GetFileNodesResponse,
  options: {
    fileKey: string;
    token: string;
    format?: "png" | "jpg" | "svg" | "pdf";
    scale?: number;
    reconstruction?: { enabled?: ReconstructionStepFlags };
  },
): Promise<SimplifiedDesign> {
  const { metadata, rawNodes, components, componentSets, extraStyles } =
    parseAPIResponse(apiResponse);

  const globalVars: TraversalContext["globalVars"] = {
    styles: {},
    extraStyles,
    imageAssets: { nodeIds: [], imageRefs: [], svgNodeIds: [] },
  };
  
  const { nodes: extractedNodes, globalVars: finalGlobalVars } = extractFromDesign(
    rawNodes,
    globalVars,
    options.reconstruction ? { reconstruction: options.reconstruction } : undefined,
  );

  const design: SimplifiedDesign = {
    ...metadata,
    nodes: extractedNodes,
    components: simplifyComponents(components),
    componentSets: simplifyComponentSets(componentSets),
    globalVars: {
      styles: finalGlobalVars.styles,
      imageAssets: finalGlobalVars.imageAssets,
    },
  };

  return resolveImageAssetsFromFigma(design, options);
}
