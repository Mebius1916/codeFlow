import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { ChatOpenAI } from "@langchain/openai";
import type { FixHtmlParams } from "../types/index.js";

export async function fixHtml(
  llm: ChatOpenAI,
  params: FixHtmlParams
): Promise<string> {
  const system = new SystemMessage(
    [
      "你是资深前端工程师。你将收到一份视觉还原差异分析报告和当前的 HTML+CSS 代码。",
      "你的任务：根据分析报告中指出的每一个问题，修改 HTML+CSS 代码，使其与设计稿完全一致。",
      "",
      "规则：",
      "- 只修改需要修改的部分，不要重构整体结构",
      "- 不要删除任何现有元素，除非分析报告明确指出该元素多余",
      "- 保持所有 class 名称、id 和 img src 不变",
      "- 仅输出完整的修改后的 HTML，不要任何解释文字、不要 Markdown 包裹",
    ].join("\n")
  );

  const user = new HumanMessage({
    content: [
      {
        type: "text",
        text: ["## 视觉差异分析报告", params.analysisJson, "", "## 当前 HTML 代码", params.html].join("\n"),
      },
    ],
  });

  const res = await llm.invoke([system, user]);
  return typeof res.content === "string" ? res.content : JSON.stringify(res.content);
}
