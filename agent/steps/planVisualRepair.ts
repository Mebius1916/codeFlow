import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { ChatOpenAI } from "@langchain/openai";
import {
  repairPatchListSchema,
  type RepairPatch,
} from "../interfaces/repairPatch.js";
import {
  buildPlanVisualRepairUserText,
  planVisualRepairSystemPrompt,
  type PlanVisualRepairPromptInput,
} from "../prompts/plan.js";

export async function planVisualRepair(
  llm: ChatOpenAI,
  input: PlanVisualRepairPromptInput
): Promise<RepairPatch[]> {
  // 约束大模型的输出
  const structuredLlm = llm.withStructuredOutput(repairPatchListSchema, {
    name: "RepairPatchList",
    strict: true,
  });
  const system = new SystemMessage(planVisualRepairSystemPrompt);
  const user = new HumanMessage({
    content: [
      {
        type: "text",
        text: buildPlanVisualRepairUserText(input),
      },
    ],
  });

  const patches = await structuredLlm.invoke([system, user]);
  return patches.filter(
    (patch) =>
      patch.from !== patch.to &&
      patch.dataId.trim() !== "" &&
      patch.reason.trim() !== ""
  );
}
