import { z } from "zod";

export const repairPatchSchema = z.object({
  dataId: z.string().min(1),
  op: z.literal("replace_class_token"),
  from: z.string().min(1),
  to: z.string().min(1),
  reason: z.string().min(1),
});

export const repairPatchListSchema = z.array(repairPatchSchema);

export type RepairPatch = z.infer<typeof repairPatchSchema>;
