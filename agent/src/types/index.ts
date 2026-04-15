export type CreateLLMParams = {
  model: string;
  apiKey: string;
  baseUrl?: string;
};

export type RunAgentParams = {
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

export type AnalyzeVisualDiffParams = Pick<
  RunAgentParams,
  "baselinePngBase64" | "currentPngBase64" | "diffPngBase64" | "diffRatio" | "similarity"
>;

export type FixHtmlParams = { analysisJson: string; html: string };

export type VisualDiffParams = {
  baselinePngBase64: string;
  currentPngBase64: string;
  html: string;
  model: string;
  apiKey: string;
  baseUrl?: string;
};

