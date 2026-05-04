import { z } from "zod";

export const rewriteResultSchema = z.object({
  html: z.string().min(1),
});

export type RewriteResult = z.infer<typeof rewriteResultSchema>;
