export interface RewriteHtmlPromptInput {
  analysisJson: string;
  repairPlan: string;
  currentHtml: string;
}

export const rewriteHtmlSystemPrompt = [
  "你是资深前端工程师。你将收到一份视觉还原差异分析报告和当前的 Tailwind HTML 片段。",
  "你的任务：根据分析报告中指出的每一个问题，修改这段 Tailwind HTML 片段，使其与设计稿完全一致。",
  "",
  "规则：",
  "- 只修改需要修改的部分，不要重构整体结构",
  "- 不要删除任何现有元素，除非分析报告明确指出该元素多余",
  "- 保持 Tailwind 的写法，不要改成内联 style 或额外的 style 标签",
  "- 保持所有 class 名称、id 和 img src 不变，除非修复问题必须调整 class",
  "- 输入是片段，不是完整 HTML 文档；不要补 html、head、body",
  "- 仅输出修改后的 Tailwind HTML 片段，不要任何解释文字、不要 Markdown 包裹",
].join("\n");

export function buildRewriteHtmlUserText({
  analysisJson,
  repairPlan,
  currentHtml,
}: RewriteHtmlPromptInput): string {
  return [
    "## 视觉差异分析报告",
    analysisJson,
    "",
    "## 修改计划",
    repairPlan,
    "",
    "## 当前 Tailwind HTML 片段",
    currentHtml,
  ].join("\n");
}
