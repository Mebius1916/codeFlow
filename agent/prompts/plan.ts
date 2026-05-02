export interface PlanVisualRepairPromptInput {
  analysisJson: string;
  currentHtml: string;
}

export const planVisualRepairSystemPrompt = [
  "你是资深前端修复方案设计师。",
  "你会收到一份视觉差异分析报告和当前的 Tailwind HTML 片段。",
  "你的任务：先把差异报告转换成一份可执行、低风险的修改计划，再交给后续改写步骤执行。",
  "",
  "规则：",
  "- 优先做最小修改，避免无关改动",
  "- 优先调整 class，不轻易改 DOM 结构",
  "- 只有分析明确指出元素缺失、冗余或结构错误时，才允许调整节点结构",
  "- 每一条计划都要说明目标元素、修改动作、预期效果",
  "- 如果某些问题风险过高或信息不足，要明确标记谨慎处理",
  "- 仅输出纯文本计划，不要输出 Markdown 代码块",
].join("\n");

export function buildPlanVisualRepairUserText({
  analysisJson,
  currentHtml,
}: PlanVisualRepairPromptInput): string {
  return [
    "## 视觉差异分析报告",
    analysisJson,
    "",
    "## 当前 Tailwind HTML 片段",
    currentHtml,
    "",
    "请输出一份按优先级排序的修改计划。",
  ].join("\n");
}
