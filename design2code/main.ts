import type {
  GetFileResponse,
  GetFileNodesResponse,
} from "@figma/rest-api-spec";
import codegen, { type CodegenResult } from "./core/codegen/index.js";
import { simplifyRawFigmaObjectWithImages, type FetcherAdapter } from "./core/extractors/pipeline/design-extractor.js";
import type { SimplifiedDesign } from "./core/types/extractor-types.js";
import { getDefaultOptions, setOptions, type AlgorithmOptions } from "./options.js";

interface ConvertFigmaToCodeOptions extends ExtractFigmaAsJSONOptions {
  algorithmOptions?: Partial<AlgorithmOptions>;
}

interface ExtractFigmaAsJSONOptions {
  fileKey: string;
  token: string;
  format?: "png" | "jpg" | "svg" | "pdf";
  scale?: number;
  assetsDir?: string;
  assetsUrlPrefix?: string;
  fetcher?: FetcherAdapter;
  skipAssetFetch?: boolean;
}

export async function convertFigmaToCode(
  figmaData: GetFileResponse | GetFileNodesResponse,
  options: ConvertFigmaToCodeOptions,
): Promise<CodegenResult> {
  const { algorithmOptions, ...extractOptions } = options;

  setOptions(getDefaultOptions());
  if (algorithmOptions && Object.keys(algorithmOptions).length) {
    setOptions(algorithmOptions);
  }

  const simplifiedDesign = await extractFigmaAsJSON(figmaData, extractOptions);
  return codegen(simplifiedDesign);
}

async function extractFigmaAsJSON(
  figmaData: GetFileResponse | GetFileNodesResponse,
  options: ExtractFigmaAsJSONOptions,
): Promise<SimplifiedDesign> {
  return simplifyRawFigmaObjectWithImages(figmaData, options);
}
