import type { ChatOpenAI } from "@langchain/openai";

import type { RunVisualRepairParams } from "../interfaces/runtime.js";
import { observeVisualDiff } from "../steps/observeVisualDiff.js";
import type { ReviewResult } from "../steps/reviewHtml.js";
import { executeRepairAction } from "./actionExecutor.js";
import { decideNextAction, type RepairAction } from "./decideNextAction.js";

export interface VisualRepairContext {
  input: RunVisualRepairParams;
  round: number;
  currentHtml: string;
  analysisJson?: string;
  repairPlan?: string;
  reviewResult?: ReviewResult;
}

const MAX_ACTION_ROUNDS = 10;

export async function runVisualRepairLoop(
  llm: ChatOpenAI,
  params: RunVisualRepairParams
): Promise<string> {
  // 维护本轮修复过程中逐步产出的中间结果。
  const context: VisualRepairContext = {
    input: params,
    round: 1,
    currentHtml: params.html,
  };

  // runtime 自己保留完整 context，但传给 observe 的只是一份最小输入快照。
  context.analysisJson = await observeVisualDiff(llm, {
    baselinePngBase64: params.baselinePngBase64,
    currentPngBase64: params.currentPngBase64,
    diffPngBase64: params.diffPngBase64,
    similarity: params.similarity,
    diffRatio: params.diffRatio,
  });

  // 基于当前上下文先决定第一次动作，后续每轮执行完再重新判断。
  let nextAction: RepairAction = decideNextAction(context);

  while (context.round <= MAX_ACTION_ROUNDS) {
    // 当状态机判断当前结果可以结束时，直接返回最新 HTML。
    if (nextAction.type === "finish") {
      return context.currentHtml;
    }

    // 执行动作会更新 context，例如补计划、改 HTML、写入 review 结果。
    await executeRepairAction(llm, context, nextAction);

    context.round += 1;
    nextAction = decideNextAction(context);
  }

  // 超过最大轮次后停止自动修复，返回当前轮次产出的结果。
  return context.currentHtml;
}
