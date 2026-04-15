import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export type RunAgentParams = {
  baselinePngBase64: string;
  currentPngBase64: string;
  diffPngBase64: string;
  diffRatio: number;
  similarity: number;
  model: string;
  apiKey: string;
  baseUrl?: string;
};

export async function runAgent(params: RunAgentParams): Promise<string> {
  const llm = new ChatOpenAI({
    apiKey: params.apiKey,
    model: params.model,
    configuration: params.baseUrl ? { baseURL: params.baseUrl } : undefined,
    temperature: 0,
  });

  const system = new SystemMessage(
    [
      "你是资深前端视觉还原评审专家。",
      "baseline 是 Figma 设计稿渲染图，视为唯一真理；current 是前端实现截图；diff 是像素级差异图（高亮区域 = 差异位置）。",
      "你的核心任务：以 baseline 为标准，逐一找出 current 中与设计稿不一致的地方，并给出具体、可操作的描述。",
      "",
      "请从以下 8 个维度审查，每个维度只需列出存在的问题，无问题则标注为空数组：",
      "1. layout       — 布局结构：元素排列、层级嵌套、对齐方式",
      "2. text         — 文本内容：文字是否完整正确、有无遗漏或多余",
      "3. color        — 颜色样式：背景色、文字色、边框色、渐变等",
      "4. completeness — 元素完整度：UI 组件是否齐全，有无遗漏或多余",
      "5. typography   — 字体排印：字号、字重、行高、字体",
      "6. spacing      — 间距尺寸：内外边距、宽高比例",
      "7. fidelity     — 整体视觉保真：整体观感与设计稿的贴合度",
      "8. detail       — 细节还原：图标、图片、阴影、圆角等",
      "",
      "输出要求：仅输出 JSON，不要 Markdown 包裹，不要 JSON 之外的任何文字。",
      "JSON schema：",
      "{",
      '  "summary": string,             // 一句话概括 current 与设计稿的整体差异',
      '  "pass": boolean,               // 视觉还原是否可接受',
      '  "dimensions": [',
      "    {",
      '      "category": string,        // 维度名（layout/text/color/completeness/typography/spacing/fidelity/detail）',
      '      "issues": [                // 该维度下的问题列表，无问题则为空数组',
      "        {",
      '          "severity": "low"|"medium"|"high",',
      '          "description": string, // 具体描述哪个元素、哪里不一致、与设计稿有何偏差',
      '          "evidence": string     // 你在图中观察到的视觉证据',
      "        }",
      "      ]",
      "    }",
      "  ]",
      "}",
    ].join("\n")
  );

  const user = new HumanMessage({
    content: [
      { type: "image_url", image_url: { url: `data:image/png;base64,${params.baselinePngBase64}` } },
      { type: "image_url", image_url: { url: `data:image/png;base64,${params.currentPngBase64}` } },
      { type: "image_url", image_url: { url: `data:image/png;base64,${params.diffPngBase64}` } },
      {
        type: "text",
        text: [
          "以上三张图依次为：baseline（Figma 设计稿，唯一真理）、current（前端实现截图）、diff（像素差异图）。",
          `像素级相似度参考：similarity=${(params.similarity * 100).toFixed(2)}%，diffRatio=${params.diffRatio.toFixed(6)}。`,
          "请以 baseline 为标准，找出 current 中所有与设计稿不一致的地方，从 8 个维度逐一输出 JSON。",
        ].join("\n"),
      },
    ],
  });

  const res = await llm.invoke([system, user]);
  return typeof res.content === "string" ? res.content : JSON.stringify(res.content);
}
