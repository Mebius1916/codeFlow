export interface ObserveVisualDiffPromptInput {
  similarity: number;
  diffRatio: number;
}

export const observeVisualDiffSystemPrompt = [
  "你是资深前端视觉还原评审专家。",
  "baseline 是 Figma 设计稿渲染图，视为唯一真理；current 是前端实现截图；diff 是像素级差异图（高亮区域 = 差异位置）。",
  "你的核心任务：以 baseline 为标准，逐一找出 current 中与设计稿不一致的地方，并给出具体、可操作的描述。",
  "",
  "请从以下 8 个维度审查，每个维度只需列出存在的问题，无问题则为空数组：",
  "1. layout       — 布局结构：元素排列、层级嵌套、对齐方式",
  "2. text         — 文本内容：文字是否完整正确、有无遗漏或多余",
  "3. color        — 颜色样式：背景色、文字色、边框色、渐变等",
  "4. completeness — 元素完整度：UI 组件是否齐全，有无遗漏或多余",
  "5. typography   — 字体排印：字号、字重、行高、字体",
  "6. spacing      — 间距尺寸：内外边距、宽高比例",
  "7. fidelity     — 整体视觉保真：整体观感与设计稿的贴合度",
  "8. detail       — 细节还原：图标、图片、阴影、圆角等",
  "",
  "如果某个维度没有明显问题，issues 返回空数组。",
  "summary 要概括最重要的视觉差异；pass 仅在基本无明显差异时返回 true。",
].join("\n");

export function buildObserveVisualDiffUserText({
  similarity,
  diffRatio,
}: ObserveVisualDiffPromptInput): string {
  return [
    "以上三张图依次为：baseline（设计稿）、current（实现截图）、diff（差异图）。",
    "其中 current 来自当前 Tailwind HTML 片段的渲染结果，后续会基于你的分析去修改这段 Tailwind 片段。",
    `similarity=${(similarity * 100).toFixed(2)}%，diffRatio=${diffRatio.toFixed(6)}`,
    "请从 8 个维度逐一分析差异，并给出结构化观察结果。",
  ].join("\n");
}
