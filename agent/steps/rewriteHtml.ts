import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { ChatOpenAI } from "@langchain/openai";

import {
  buildRewriteHtmlUserText,
  rewriteHtmlSystemPrompt,
  type RewriteHtmlPromptInput,
} from "../prompts/rewrite.js";

export async function rewriteHtml(
  llm: ChatOpenAI,
  input: RewriteHtmlPromptInput
): Promise<string> {
  const system = new SystemMessage(rewriteHtmlSystemPrompt);
  const user = new HumanMessage({
    content: [
      {
        type: "text",
        text: buildRewriteHtmlUserText(input),
      },
    ],
  });

  const res = await llm.invoke([system, user]);
  return typeof res.content === "string" ? res.content : JSON.stringify(res.content);
}
