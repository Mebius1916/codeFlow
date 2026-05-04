import type { ChatOpenAI } from "@langchain/openai";

import type { HtmlCssResult } from "../interfaces/htmlCssResult.js";
import type { RepairPatch } from "../interfaces/repairPatch.js";
import type { ReviewResult } from "../interfaces/reviewResult.js";
import type { RunVisualRepairParams } from "../interfaces/runtime.js";
import { exportHtmlCss } from "../steps/exportHtmlCss.js";
import { observeVisualDiff } from "../steps/observeVisualDiff.js";
import { executeRepairAction } from "./actionExecutor.js";
import { decideNextAction, type RepairAction } from "./decideNextAction.js";

export interface VisualRepairContext {
  input: RunVisualRepairParams;
  round: number;
  rewriteRounds: number;
  reobserveRounds: number;
  currentHtml: string;
  analysisJson?: string;
  repairPatches?: RepairPatch[];
  reviewResult?: ReviewResult;
  lastAction?: RepairAction["type"];
}

const MAX_ACTION_ROUNDS = 10;

export async function runVisualRepairLoop(
  llm: ChatOpenAI,
  params: RunVisualRepairParams
): Promise<HtmlCssResult> {
  // 维护本轮修复过程中逐步产出的中间结果。
  const context: VisualRepairContext = {
    input: params,
    round: 1,
    rewriteRounds: 0,
    reobserveRounds: 0,
    currentHtml: params.html,
  };

  // 先拿到结构化 diff 观察结果，再序列化给后续 prompt 复用。
  const observation = await observeVisualDiff(llm, {
    baselinePngBase64: params.baselinePngBase64,
    currentPngBase64: params.currentPngBase64,
    diffPngBase64: params.diffPngBase64,
    similarity: params.similarity,
    diffRatio: params.diffRatio,
  });
  context.analysisJson = JSON.stringify(observation, null, 2);

  // 基于当前上下文先决定第一次动作，后续每轮执行完再重新判断。
  let nextAction: RepairAction = decideNextAction(context);

  while (context.round <= MAX_ACTION_ROUNDS) {
    if (nextAction.type === "finish") {
      return exportHtmlCss(llm, { currentHtml: context.currentHtml });
    }

    // 执行动作会更新 context，例如补观察、重做计划、改 HTML、写入 review 结果。
    await executeRepairAction(llm, context, nextAction);

    // 一轮动作完成后，再根据最新上下文进入下一次决策。
    context.round += 1;
    nextAction = decideNextAction(context);
  }

  // 超过最大轮次后停止自动修复，返回当前轮次产出的结果。
  return exportHtmlCss(llm, { currentHtml: context.currentHtml });
}
