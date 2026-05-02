import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { ChatOpenAI } from "@langchain/openai";
import {
  buildReviewHtmlUserText,
  reviewHtmlSystemPrompt,
  type ReviewHtmlPromptInput,
} from "../prompts/review.js";

export type ReviewStatus = "done" | "needs_rewrite" | "blocked";
export interface ReviewIssue {
  severity: "low" | "medium" | "high";
  description: string;
  suggestion: string;
}
export interface ReviewResult {
  status: ReviewStatus;
  pass: boolean;
  summary: string;
  issues: ReviewIssue[];
  rawResponse: string;
}

export async function reviewHtml(
  llm: ChatOpenAI,
  input: ReviewHtmlPromptInput
): Promise<ReviewResult> {
  const system = new SystemMessage(reviewHtmlSystemPrompt);
  const user = new HumanMessage({
    content: [
      {
        type: "text",
        text: buildReviewHtmlUserText(input),
      },
    ],
  });

  const res = await llm.invoke([system, user]);
  const rawResponse =
    typeof res.content === "string" ? res.content : JSON.stringify(res.content);
  return parseReviewResult(rawResponse);
}


function parseReviewResult(rawResponse: string): ReviewResult {
  try {
    const parsed = JSON.parse(rawResponse) as {
      status?: string;
      pass?: boolean;
      summary?: string;
      issues?: ReviewIssue[];
    };

    if (
      (parsed.status === "done" ||
        parsed.status === "needs_rewrite" ||
        parsed.status === "blocked") &&
      typeof parsed.pass === "boolean" &&
      typeof parsed.summary === "string" &&
      Array.isArray(parsed.issues)
    ) {
      return {
        status: parsed.status,
        pass: parsed.pass,
        summary: parsed.summary,
        issues: parsed.issues,
        rawResponse,
      };
    }
  } catch {
    // review JSON 解析失败时回退到保守状态，避免错误结束流程。
  }

  return {
    status: "blocked",
    pass: false,
    summary: "代码自检结果解析失败，停止自动修复。",
    issues: [],
    rawResponse,
  };
}