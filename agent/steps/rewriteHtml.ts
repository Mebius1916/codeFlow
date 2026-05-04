import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { ChatOpenAI } from "@langchain/openai";

import {
  rewriteResultSchema,
  type RewriteResult,
} from "../interfaces/rewriteResult.js";
import {
  buildRewriteHtmlUserText,
  rewriteHtmlSystemPrompt,
  type RewriteHtmlPromptInput,
} from "../prompts/rewrite.js";
import { sanitizers } from "../sanitizers/index.js";

export async function rewriteHtml(
  llm: ChatOpenAI,
  input: RewriteHtmlPromptInput
): Promise<RewriteResult> {
  const structuredLlm = llm.withStructuredOutput(rewriteResultSchema, {
    name: "RewriteResult",
    strict: true,
  });
  const system = new SystemMessage(rewriteHtmlSystemPrompt);
  const user = new HumanMessage({
    content: [
      {
        type: "text",
        text: buildRewriteHtmlUserText(input),
      },
    ],
  });

  const rewriteResult = await structuredLlm.invoke([system, user]);
  return sanitizers.rewrite(rewriteResult, {
    previousHtml: input.currentHtml,
  });
}
