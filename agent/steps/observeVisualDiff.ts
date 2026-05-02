import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { ChatOpenAI } from "@langchain/openai";

import {
  buildObserveVisualDiffUserText,
  observeVisualDiffSystemPrompt,
  type ObserveVisualDiffPromptInput,
} from "../prompts/observe.js";
import { toPngDataUrl } from "../utils/common.js";

export interface ObserveVisualDiffInput extends ObserveVisualDiffPromptInput {
  baselinePngBase64: string;
  currentPngBase64: string;
  diffPngBase64: string;
}

export async function observeVisualDiff(
  llm: ChatOpenAI,
  input: ObserveVisualDiffInput
): Promise<string> {
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

  const res = await llm.invoke([system, user]);
  return typeof res.content === "string" ? res.content : JSON.stringify(res.content);
}
