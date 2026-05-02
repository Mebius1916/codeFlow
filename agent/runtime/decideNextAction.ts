import type { ReviewResult } from "../steps/reviewHtml.js";
import type { VisualRepairContext } from "./loop.js";

export type RepairActionType = "plan" | "rewrite" | "finish";

export interface RepairAction {
  type: RepairActionType;
  reason: string;
}

export function decideNextAction(context: VisualRepairContext): RepairAction {
  const [reviewResult, repairPlan] =  [context.reviewResult, context.repairPlan];
  if (!repairPlan) {
    return {
      type: "plan",
      reason: "当前还没有修改计划，先生成计划再继续。",
    };
  }

  if (!reviewResult) {
    return {
      type: "rewrite",
      reason: "当前还没有改写后的自检结果，先执行 rewrite。",
    };
  }

  if (
    reviewResult.status === "done" ||
    reviewResult.status === "blocked"
  ) {
    return {
      type: "finish",
      reason: reviewResult.summary,
    };
  }

  return {
    type: "rewrite",
    reason: reviewResult.summary,
  };
}
