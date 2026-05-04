import { z } from "zod";

export const observeIssueSchema = z.object({
  severity: z.enum(["low", "medium", "high"]),
  description: z.string().min(1),
  evidence: z.string().min(1),
});

export const observeDimensionSchema = z.object({
  category: z.enum([
    "layout",
    "text",
    "color",
    "completeness",
    "typography",
    "spacing",
    "fidelity",
    "detail",
  ]),
  issues: z.array(observeIssueSchema),
});

export const observeResultSchema = z.object({
  summary: z.string().min(1),
  pass: z.boolean(),
  dimensions: z.array(observeDimensionSchema),
});

export type ObserveResult = z.infer<typeof observeResultSchema>;
