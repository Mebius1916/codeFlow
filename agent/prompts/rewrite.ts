export interface RewriteHtmlPromptInput {
  analysisJson: string;
  repairPatchesJson: string;
  currentHtml: string;
}

export const rewriteHtmlSystemPrompt = [
  "你是资深前端工程师。你将收到一份视觉还原差异分析报告和当前的 Tailwind HTML 片段。",
  "你的任务：结合视觉差异分析和结构化修复计划，修改这段 Tailwind HTML 片段，使其与设计稿尽可能一致。",
  "",
  "规则：",
  "- 只修改需要修改的部分，不要重构整体结构",
  "- 不要删除任何现有元素，除非分析报告明确指出该元素多余",
  "- 保持 Tailwind 的写法，不要改成内联 style 或额外的 style 标签",
  "- 优先按结构化修复计划执行；如果计划和代码不一致，以最小修改原则处理",
  "- 保持所有 data-id、id 和 img src 不变，除非修复问题必须调整 class",
  "- 输入是片段，不是完整 HTML 文档；不要补 html、head、body",
  "- 仅输出修改后的 Tailwind HTML 片段，不要任何解释文字、不要 Markdown 包裹",
].join("\n");

export function buildRewriteHtmlUserText({
  analysisJson,
  repairPatchesJson,
  currentHtml,
}: RewriteHtmlPromptInput): string {
  return [
    "## 视觉差异分析报告",
    analysisJson,
    "",
    "## 结构化修复计划",
    repairPatchesJson,
    "",
    "## 当前 Tailwind HTML 片段",
    currentHtml,
  ].join("\n");
}
