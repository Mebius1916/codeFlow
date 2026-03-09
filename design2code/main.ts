import type {
  GetFileResponse,
  GetFileNodesResponse,
} from "@figma/rest-api-spec";
import { simplifyRawFigmaObjectWithImages, type FetcherAdapter } from "./core/extractors/pipeline/design-extractor.js";
import type { SimplifiedDesign } from "./core/types/extractor-types.js";

export { type FetcherAdapter };

export async function extractFigmaAsJSON(
  figmaData: GetFileResponse | GetFileNodesResponse,
  options: {
    fileKey: string;
    token: string;
    format?: "png" | "jpg" | "svg" | "pdf";
    scale?: number;
    assetsDir?: string;
    assetsUrlPrefix?: string;
    fetcher?: FetcherAdapter;
  },
): Promise<SimplifiedDesign> {
  return simplifyRawFigmaObjectWithImages(figmaData, options);
}
