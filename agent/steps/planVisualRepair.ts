import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { ChatOpenAI } from "@langchain/openai";

import {
  buildPlanVisualRepairUserText,
  planVisualRepairSystemPrompt,
} from "../prompts/plan.js";

export interface PlanVisualRepairParams {
  analysisJson: string;
  html: string;
}

export async function planVisualRepair(
  llm: ChatOpenAI,
  params: PlanVisualRepairParams
): Promise<string> {
  const system = new SystemMessage(planVisualRepairSystemPrompt);
  const user = new HumanMessage({
    content: [
      {
        type: "text",
        text: buildPlanVisualRepairUserText(params),
      },
    ],
  });

  const res = await llm.invoke([system, user]);
  return typeof res.content === "string" ? res.content : JSON.stringify(res.content);
}
