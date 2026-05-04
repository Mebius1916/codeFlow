import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { ChatOpenAI } from "@langchain/openai";
import {
  reviewResultSchema,
  type ReviewResult,
} from "../interfaces/reviewResult.js";
import {
  buildReviewHtmlUserText,
  reviewHtmlSystemPrompt,
  type ReviewHtmlPromptInput,
} from "../prompts/review.js";
import { sanitizers } from "../sanitizers/index.js";

export async function reviewHtml(
  llm: ChatOpenAI,
  input: ReviewHtmlPromptInput
): Promise<ReviewResult> {
  const structuredLlm = llm.withStructuredOutput(reviewResultSchema, {
    name: "ReviewResult",
    strict: true,
  });
  const system = new SystemMessage(reviewHtmlSystemPrompt);
  const user = new HumanMessage({
    content: [
      {
        type: "text",
        text: buildReviewHtmlUserText(input),
      },
    ],
  });
  const reviewResult = await structuredLlm.invoke([system, user]);
  return sanitizers.review(reviewResult);
}
