import type { VisualRepairContext } from "./loop.js";

export type RepairActionType = "plan" | "rewrite" | "finish";

export interface RepairAction {
  type: RepairActionType;
  reason: string;
}

export function decideNextAction(context: VisualRepairContext): RepairAction {
  const [reviewResult, repairPatches] = [
    context.reviewResult,
    context.repairPatches,
  ];

  const targetSimilarity = context.input.visualRegression?.targetSimilarity;
  if (
    typeof targetSimilarity === "number" &&
    context.diffRatio <= 1 - targetSimilarity &&
    // 仅当已经至少 rewrite 过一次，再基于新截图判断早停，避免对初始输入直接短路。
    context.rewriteRounds > 0
  ) {
    const similarity = 1 - context.diffRatio;
    return {
      type: "finish",
      reason: `视觉相似度 ${(similarity * 100).toFixed(2)}% 已达到目标 ${(targetSimilarity * 100).toFixed(2)}%，提前收敛。`,
    };
  }

  if (!repairPatches || repairPatches.length === 0) {
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

  if (reviewResult.status === "done" || reviewResult.status === "blocked") {
    return {
      type: "finish",
      reason: reviewResult.summary,
    };
  }

  return {
    type: "plan",
    reason: "上一轮 rewrite 后 review 未通过，基于最新视觉与上轮 review 结论重新规划。",
  };
}
