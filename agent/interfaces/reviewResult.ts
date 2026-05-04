import { z } from "zod";

export const reviewIssueSchema = z.object({
  severity: z.enum(["low", "medium", "high"]),
  description: z.string().min(1),
  suggestion: z.string().min(1),
});

export const reviewResultSchema = z.object({
  status: z.enum(["done", "needs_rewrite", "blocked"]),
  pass: z.boolean(),
  summary: z.string().min(1),
  issues: z.array(reviewIssueSchema),
});

export type ReviewIssue = z.infer<typeof reviewIssueSchema>;
export type ReviewResult = z.infer<typeof reviewResultSchema>;
