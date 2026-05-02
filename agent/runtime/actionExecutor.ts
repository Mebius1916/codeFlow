import type { ChatOpenAI } from "@langchain/openai";

import { planVisualRepair } from "../steps/planVisualRepair.js";
import { reviewHtml } from "../steps/reviewHtml.js";
import { rewriteHtml } from "../steps/rewriteHtml.js";
import type { RepairAction } from "./decideNextAction.js";
import type { VisualRepairContext } from "./loop.js";

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

export async function executeRepairAction(
  llm: ChatOpenAI,
  context: VisualRepairContext,
  action: RepairAction
): Promise<RepairAction> {
  const executableAction = resolveExecutableAction(context, action);
  const analysisJson = context.analysisJson ?? "";

  switch (executableAction.type) {
    case "plan":
      // runtime 内部保留 context，但下游 step 只接收当前动作真正需要的字段。
      context.repairPlan = await planVisualRepair(llm, {
        analysisJson,
        currentHtml: context.currentHtml,
      });
      return executableAction;
    case "rewrite": {
      const repairPlan = context.repairPlan ?? "";

      // 根据诊断和计划改写 HTML，产出当前轮次的修复结果。
      context.currentHtml = await rewriteHtml(llm, {
        analysisJson,
        repairPlan,
        currentHtml: context.currentHtml,
      });

      // 对改写结果做代码层自检，为下一步动作选择提供依据。
      context.reviewResult = await reviewHtml(llm, {
        analysisJson,
        repairPlan,
        currentHtml: context.currentHtml,
      });
      return executableAction;
    }
    case "finish":
      return executableAction;
  }
}
