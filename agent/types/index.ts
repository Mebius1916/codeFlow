export type CreateLLMParams = {
  model: string;
  apiKey: string;
  baseUrl?: string;
};

export type RunVisualRepairParams = {
  baselinePngBase64: string;
  currentPngBase64: string;
  diffPngBase64: string;
  diffRatio: number;
  similarity: number;
  html: string;
  model: string;
  apiKey: string;
  baseUrl?: string;
};

// 兼容旧命名，避免外部调用方一次性改太多。
export type RunAgentParams = RunVisualRepairParams;

export type ObserveVisualDiffParams = Pick<
  RunVisualRepairParams,
  "baselinePngBase64" | "currentPngBase64" | "diffPngBase64" | "diffRatio" | "similarity"
>;

export type RewriteHtmlParams = {
  analysisJson: string;
  html: string;
};

export type VisualDiffParams = {
  baselinePngBase64: string;
  currentPngBase64: string;
  html: string;
  model: string;
  apiKey: string;
  baseUrl?: string;
};

export type VisualRepairState = {
  currentHtml: string;
  analysisJson?: string;
  iteration: number;
};
