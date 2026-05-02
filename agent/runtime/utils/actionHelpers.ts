import type { RepairAction } from "../decideNextAction.js";
import type { VisualRepairContext } from "../loop.js";

export function resolveExecutableAction(
  context: VisualRepairContext,
  action: RepairAction
): RepairAction {
  if (action.type !== "rewrite" || context.repairPlan) {
    return action;
  }

  return {
    ...action,
    type: "plan",
    reason: `${action.reason}；当前缺少修改计划，先回退执行 plan。`,
  };
}

export function buildReobservedAnalysis(
  context: VisualRepairContext
): string {
  const reviewResult = context.reviewResult;
  if (!reviewResult) {
    return JSON.stringify(
      {
        source: "reobserve",
        currentHtml: context.currentHtml,
      },
      null,
      2
    );
  }

  // 这里只围绕当前修改后的 HTML 和最新 review 结果做补充观察，不再拼接历史分析。
  return JSON.stringify(
    {
      source: "reobserve",
      currentHtml: context.currentHtml,
      latestReview: {
        summary: reviewResult.summary,
        issues: reviewResult.issues,
      },
    },
    null,
    2
  );
}
