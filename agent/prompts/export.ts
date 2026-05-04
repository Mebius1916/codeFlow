export interface ExportHtmlCssPromptInput {
  currentHtml: string;
}

export const exportHtmlCssSystemPrompt = [
  "你是资深前端工程师。",
  "你会收到一段已经修复完成的 Tailwind HTML 片段。",
  "你的任务：在尽量保持现有 DOM 结构和视觉语义的前提下，把它整理成结构化的 html + css 输出。",
  "",
  "规则：",
  "- 可以把 Tailwind 工具类转换为普通 class，并把样式写入 css 字段",
  "- 保持 data-id、id、img src 和文本内容不变，除非代码本身明显错误",
  "- 不要补完整 HTML 文档；html 字段只放片段内容",
  "- html 字段中不要包含 style 标签、不要包含解释文字、不要 Markdown 包裹",
  "- css 字段中只放纯 CSS 规则，不要包含 style 标签、不要解释文字",
  "- 不要使用内联 style",
  "- 如果不需要额外样式，css 返回空字符串",
].join("\n");

export function buildExportHtmlCssUserText({
  currentHtml,
}: ExportHtmlCssPromptInput): string {
  return [
    "## 最终 Tailwind HTML 片段",
    currentHtml,
    "",
    "请将以上代码转换为结构化的 html 和 css 输出。",
  ].join("\n");
}
