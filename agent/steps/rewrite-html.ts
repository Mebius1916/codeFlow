import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { ChatOpenAI } from "@langchain/openai";

import { buildRewriteHtmlUserText, rewriteHtmlSystemPrompt } from "../prompts/rewrite.js";
import type { RewriteHtmlParams } from "../types/index.js";

export async function rewriteHtml(
  llm: ChatOpenAI,
  params: RewriteHtmlParams
): Promise<string> {
  const system = new SystemMessage(rewriteHtmlSystemPrompt);
  const user = new HumanMessage({
    content: [
      {
        type: "text",
        text: buildRewriteHtmlUserText(params),
      },
    ],
  });

  const res = await llm.invoke([system, user]);
  return typeof res.content === "string" ? res.content : JSON.stringify(res.content);
}
