import type { ChatOpenAI } from "@langchain/openai";

import { observeVisualDiff } from "../steps/observe-visual-diff.js";
import { rewriteHtml } from "../steps/rewrite-html.js";
import type { RunVisualRepairParams } from "../types/index.js";
import { createInitialVisualRepairState } from "./state.js";

export async function runVisualRepairLoop(
  llm: ChatOpenAI,
  params: RunVisualRepairParams
): Promise<string> {
  const state = createInitialVisualRepairState(params);
  const analysisJson = await observeVisualDiff(llm, params);

  return rewriteHtml(llm, {
    analysisJson,
    html: state.currentHtml,
  });
}
