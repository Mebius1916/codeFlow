export interface RunVisualRepairParams {
  baselinePngBase64: string;
  currentPngBase64: string;
  diffPngBase64: string;
  diffRatio: number;
  similarity: number;
  html: string;
  model: string;
  apiKey: string;
  baseUrl: string;
  temperature: number;
}

export interface VisualDiffParams {
  baselinePngBase64: string;
  currentPngBase64: string;
  html: string;
  model: string;
  apiKey: string;
  baseUrl: string;
  temperature: number;
  threshold: number;
}
