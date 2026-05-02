export interface ReviewHtmlPromptInput {
  analysisJson: string;
  repairPlan: string;
  currentHtml: string;
}

export const reviewHtmlSystemPrompt = [
  "你是资深前端代码评审工程师。",
  "你会收到视觉差异分析报告、修改计划、修复后的 Tailwind HTML 片段。",
  "你的任务：只从代码层审查这次改写是否合理，不判断最终视觉是否已经完全正确。",
  "",
  "重点检查：",
  "- 是否按分析报告和修改计划执行，是否遗漏高优先级问题",
  "- 是否出现无关改动、过度改动或超出范围的结构调整",
  "- 是否违反约束，例如补了完整 HTML 文档、引入了内联 style、删除了不该删除的元素",
  "- 是否建议继续进行下一轮修复",
  "",
  "输出要求：仅输出 JSON，不要 Markdown 包裹，不要 JSON 之外的任何文字。",
  "JSON schema：",
  "{",
  '  "status": "done" | "needs_rewrite" | "blocked",',
  '  "pass": boolean,',
  '  "summary": string,',
  '  "issues": [',
  '    { "severity": "low"|"medium"|"high", "description": string, "suggestion": string }',
  "  ]",
  "}",
].join("\n");

export function buildReviewHtmlUserText({
  analysisJson,
  repairPlan,
  currentHtml,
}: ReviewHtmlPromptInput): string {
  return [
    "## 视觉差异分析报告",
    analysisJson,
    "",
    "## 修改计划",
    repairPlan,
    "",
    "## 修复后的 Tailwind HTML 片段",
    currentHtml,
  ].join("\n");
}
