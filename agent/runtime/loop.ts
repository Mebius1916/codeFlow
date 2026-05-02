import type { ChatOpenAI } from "@langchain/openai";
import { observeVisualDiff } from "../steps/observeVisualDiff.js";
import { planVisualRepair } from "../steps/planVisualRepair.js";
import { rewriteHtml } from "../steps/rewriteHtml.js";
import type { RunVisualRepairParams } from "../interfaces/runtime.js";

interface VisualRepairState {
  currentHtml: string;
  analysisJson?: string;
  repairPlan?: string;
}

export async function runVisualRepairLoop(
  llm: ChatOpenAI,
  params: RunVisualRepairParams
): Promise<string> {
  // 维护本轮修复过程中逐步产出的中间结果。
  const state: VisualRepairState = {
    currentHtml: params.html,
  };

  // 第一步先做视觉问题诊断，得到结构化差异分析。
  state.analysisJson = await observeVisualDiff(llm, params);

  // 第二步把诊断结果转成低风险的修改计划，约束后续改写范围。
  state.repairPlan = await planVisualRepair(llm, {
    analysisJson: state.analysisJson,
    html: state.currentHtml,
  });

  // 第三步根据诊断和计划改写 HTML，产出最终修复结果。
  state.currentHtml = await rewriteHtml(llm, {
    analysisJson: state.analysisJson,
    repairPlan: state.repairPlan,
    html: state.currentHtml,
  });
  return state.currentHtml;
}
