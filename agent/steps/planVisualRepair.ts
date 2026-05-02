import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { ChatOpenAI } from "@langchain/openai";

import {
  buildPlanVisualRepairUserText,
  planVisualRepairSystemPrompt,
  type PlanVisualRepairPromptInput,
} from "../prompts/plan.js";

export async function planVisualRepair(
  llm: ChatOpenAI,
  input: PlanVisualRepairPromptInput
): Promise<string> {
  const system = new SystemMessage(planVisualRepairSystemPrompt);
  const user = new HumanMessage({
    content: [
      {
        type: "text",
        text: buildPlanVisualRepairUserText(input),
      },
    ],
  });

  const res = await llm.invoke([system, user]);
  return typeof res.content === "string" ? res.content : JSON.stringify(res.content);
}
