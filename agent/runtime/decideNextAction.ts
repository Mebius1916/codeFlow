import type { VisualRepairContext } from "./loop.js";

export type RepairActionType =
  | "plan"
  | "reobserve"
  | "retry_with_new_plan"
  | "rewrite"
  | "finish";

export interface RepairAction {
  type: RepairActionType;
  reason: string;
}

export function decideNextAction(context: VisualRepairContext): RepairAction {
  const [reviewResult, repairPlan] = [context.reviewResult, context.repairPlan];

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

  if (context.lastAction === "rewrite") {
    return {
      type: "reobserve",
      reason: "上一轮 rewrite 后仍未通过自检，先补充观察最新问题。",
    };
  }

  if (context.lastAction === "reobserve") {
    return {
      type: "retry_with_new_plan",
      reason: "补充观察后需要刷新修改方案，先基于新观察重做计划。",
    };
  }

  return {
    type: "rewrite",
    reason: "已完成补充观察和重新规划，继续按新计划执行 rewrite。",
  };
}
