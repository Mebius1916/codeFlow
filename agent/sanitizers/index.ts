import type { ObserveResult } from "../interfaces/observeResult.js";
import type { RepairPatch } from "../interfaces/repairPatch.js";
import type { ReviewResult } from "../interfaces/reviewResult.js";
import type { RewriteResult } from "../interfaces/rewriteResult.js";
import { sanitizeObserveResult } from "./sanitizeObserveResult.js";
import { sanitizeRepairPatches } from "./sanitizeRepairPatches.js";
import { sanitizeReviewResult } from "./sanitizeReviewResult.js";
import { sanitizeRewriteResult } from "./sanitizeRewriteResult.js";
import type { SanitizeOutputContext } from "./shared.js";

export const sanitizers = {
  observe: (payload: ObserveResult) => 
    sanitizeObserveResult(payload),

  plan: (payload: RepairPatch[], context: SanitizeOutputContext) =>
    sanitizeRepairPatches(payload, context),

  review: (payload: ReviewResult) => 
    sanitizeReviewResult(payload),

  rewrite: (payload: RewriteResult, context: SanitizeOutputContext) =>
    sanitizeRewriteResult(payload, context),

};
