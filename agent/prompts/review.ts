export interface ReviewHtmlPromptInput {
  analysisJson: string;
  repairPatchesJson: string;
  currentHtml: string;
}

export const reviewHtmlSystemPrompt = [
  "你是资深前端代码评审工程师。",
  "你会收到视觉差异分析报告、结构化修复计划、修复后的 Tailwind HTML 片段。",
  "你的任务：只从代码层审查这次改写是否合理，不判断最终视觉是否已经完全正确。",
  "",
  "重点检查：",
  "- 是否按分析报告和修改计划执行，是否遗漏高优先级问题",
  "- 是否出现无关改动、过度改动或超出范围的结构调整",
  "- 是否违反约束，例如补了完整 HTML 文档、引入了内联 style、删除了不该删除的元素",
  "- 是否建议继续进行下一轮修复",
  "",
  "summary 要概括本轮改写是否合理，以及是否值得继续下一轮修复。",
  "issues 中只保留真正影响决策的关键问题。",
].join("\n");

export function buildReviewHtmlUserText({
  analysisJson,
  repairPatchesJson,
  currentHtml,
}: ReviewHtmlPromptInput): string {
  return [
    "## 视觉差异分析报告",
    analysisJson,
    "",
    "## 结构化修复计划",
    repairPatchesJson,
    "",
    "## 修复后的 Tailwind HTML 片段",
    currentHtml,
  ].join("\n");
}
