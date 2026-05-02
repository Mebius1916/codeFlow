import type { ChatOpenAI } from "@langchain/openai";
import { planVisualRepair } from "../steps/planVisualRepair.js";
import { reviewHtml } from "../steps/reviewHtml.js";
import { rewriteHtml } from "../steps/rewriteHtml.js";
import type { RepairAction } from "./decideNextAction.js";
import type { VisualRepairContext } from "./loop.js";
import {
  buildReobservedAnalysis,
  resolveExecutableAction,
} from "./utils/actionHelpers.js";

export async function executeRepairAction(
  llm: ChatOpenAI,
  context: VisualRepairContext,
  action: RepairAction
): Promise<RepairAction> {
  const executableAction = resolveExecutableAction(context, action);

  switch (executableAction.type) {
    case "plan":
      context.lastAction = "plan";
      // runtime 内部保留 context，但下游 step 只接收当前动作真正需要的字段。
      context.repairPlan = await planVisualRepair(llm, {
        analysisJson: context.analysisJson ?? "",
        currentHtml: context.currentHtml,
      });
      return executableAction;
    case "reobserve":
      context.lastAction = "reobserve";
      context.analysisJson = buildReobservedAnalysis(context);
      return executableAction;
    case "retry_with_new_plan":
      context.lastAction = "retry_with_new_plan";
      context.repairPlan = await planVisualRepair(llm, {
        analysisJson: context.analysisJson ?? "",
        currentHtml: context.currentHtml,
      });

      // 旧 review 已经服务完重规划，这里清掉，强制下一轮进入 rewrite。
      context.reviewResult = undefined;
      return executableAction;
    case "rewrite": {
      context.lastAction = "rewrite";
      const repairPlan = context.repairPlan ?? "";

      // 根据诊断和计划改写 HTML，产出当前轮次的修复结果。
      context.currentHtml = await rewriteHtml(llm, {
        analysisJson: context.analysisJson ?? "",
        repairPlan,
        currentHtml: context.currentHtml,
      });

      // 对改写结果做代码层自检，为下一步动作选择提供依据。
      context.reviewResult = await reviewHtml(llm, {
        analysisJson: context.analysisJson ?? "",
        repairPlan,
        currentHtml: context.currentHtml,
      });
      return executableAction;
    }
    case "finish":
      context.lastAction = "finish";
      return executableAction;
  }
}
