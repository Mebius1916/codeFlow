import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { ChatOpenAI } from "@langchain/openai";

import { buildObserveVisualDiffUserText, observeVisualDiffSystemPrompt } from "../prompts/observe.js";
import type { ObserveVisualDiffParams } from "../types/index.js";

export async function observeVisualDiff(
  llm: ChatOpenAI,
  params: ObserveVisualDiffParams
): Promise<string> {
  const system = new SystemMessage(observeVisualDiffSystemPrompt);
  const user = new HumanMessage({
    content: [
      { type: "image_url", image_url: { url: `data:image/png;base64,${params.baselinePngBase64}` } },
      { type: "image_url", image_url: { url: `data:image/png;base64,${params.currentPngBase64}` } },
      { type: "image_url", image_url: { url: `data:image/png;base64,${params.diffPngBase64}` } },
      {
        type: "text",
        text: buildObserveVisualDiffUserText(params),
      },
    ],
  });

  const res = await llm.invoke([system, user]);
  return typeof res.content === "string" ? res.content : JSON.stringify(res.content);
}
