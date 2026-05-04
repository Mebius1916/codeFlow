import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { ChatOpenAI } from "@langchain/openai";

import {
  htmlCssResultSchema,
  type HtmlCssResult,
} from "../interfaces/htmlCssResult.js";
import {
  buildExportHtmlCssUserText,
  exportHtmlCssSystemPrompt,
  type ExportHtmlCssPromptInput,
} from "../prompts/export.js";
import { sanitizeHtmlCssResult } from "../sanitizers/sanitizeHtmlCssResult.js";

export async function exportHtmlCss(
  llm: ChatOpenAI,
  input: ExportHtmlCssPromptInput
): Promise<HtmlCssResult> {
  const structuredLlm = llm.withStructuredOutput(htmlCssResultSchema, {
    name: "HtmlCssResult",
    strict: true,
  });
  const system = new SystemMessage(exportHtmlCssSystemPrompt);
  const user = new HumanMessage({
    content: [
      {
        type: "text",
        text: buildExportHtmlCssUserText(input),
      },
    ],
  });

  const result = await structuredLlm.invoke([system, user]);
  return sanitizeHtmlCssResult(result, {
    previousHtml: input.currentHtml,
  });
}
