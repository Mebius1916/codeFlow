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
      context.repairPatches = await planVisualRepair(llm, {
        analysisJson: context.analysisJson ?? "",
        currentHtml: context.currentHtml,
      });
      return executableAction;

    case "reobserve":
      context.lastAction = "reobserve";
      context.reobserveRounds += 1;
      context.analysisJson = buildReobservedAnalysis(context);
      return executableAction;

    case "retry_with_new_plan":
      context.lastAction = "retry_with_new_plan";
      context.repairPatches = await planVisualRepair(llm, {
        analysisJson: context.analysisJson ?? "",
        currentHtml: context.currentHtml,
      });

      // 旧 review 已经服务完重规划，这里清掉，强制下一轮进入 rewrite。
      context.reviewResult = undefined;
      return executableAction;

    case "rewrite": {
      context.lastAction = "rewrite";
      context.rewriteRounds += 1;
      const repairPatchesJson = JSON.stringify(
        context.repairPatches ?? [],
        null,
        2
      );

      // patch 只作为结构化计划，真正的改写仍交给 AI 执行。
      const rewriteResult = await rewriteHtml(llm, {
        analysisJson: context.analysisJson ?? "",
        repairPatchesJson,
        currentHtml: context.currentHtml,
      });
      context.currentHtml = rewriteResult.html;

      // 对改写结果做代码层自检，为下一步动作选择提供依据。
      context.reviewResult = await reviewHtml(llm, {
        analysisJson: context.analysisJson ?? "",
        repairPatchesJson,
        currentHtml: context.currentHtml,
      });
      return executableAction;
    }

    case "finish":
      context.lastAction = "finish";
      return executableAction;
  }
}
