import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { ChatOpenAI } from "@langchain/openai";

import {
  observeResultSchema,
  type ObserveResult,
} from "../interfaces/observeResult.js";
import {
  buildObserveVisualDiffUserText,
  observeVisualDiffSystemPrompt,
  type ObserveVisualDiffPromptInput,
} from "../prompts/observe.js";
import { sanitizers } from "../sanitizers/index.js";
import { toPngDataUrl } from "./utils/common.js";

export interface ObserveVisualDiffInput extends ObserveVisualDiffPromptInput {
  baselinePngBase64: string;
  currentPngBase64: string;
  diffPngBase64: string;
}

export async function observeVisualDiff(
  llm: ChatOpenAI,
  input: ObserveVisualDiffInput
): Promise<ObserveResult> {
  const structuredLlm = llm.withStructuredOutput(observeResultSchema, {
    name: "ObserveResult",
    strict: true,
  });
  const system = new SystemMessage(observeVisualDiffSystemPrompt);
  const user = new HumanMessage({
    content: [
      { type: "image_url", image_url: { url: toPngDataUrl(input.baselinePngBase64) } },
      { type: "image_url", image_url: { url: toPngDataUrl(input.currentPngBase64) } },
      { type: "image_url", image_url: { url: toPngDataUrl(input.diffPngBase64) } },
      {
        type: "text",
        text: buildObserveVisualDiffUserText(input),
      },
    ],
  });

  const observation = await structuredLlm.invoke([system, user]);
  return sanitizers.observe(observation);
}
