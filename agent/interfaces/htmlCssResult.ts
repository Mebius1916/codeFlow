import { z } from "zod";

export const htmlCssResultSchema = z.object({
  html: z.string().min(1),
  css: z.string(),
});

export type HtmlCssResult = z.infer<typeof htmlCssResultSchema>;
