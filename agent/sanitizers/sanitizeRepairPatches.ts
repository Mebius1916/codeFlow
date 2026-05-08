import type { RepairPatch } from "../interfaces/repairPatch.js";
import { extractDataIds } from "./utils/dataIds.js";

export function sanitizeRepairPatches(
  patches: RepairPatch[],
  context: { currentHtml?: string; previousHtml?: string }
): RepairPatch[] {
  const validDataIds = extractDataIds(context.currentHtml);

  return patches
    .map((patch) => ({
      ...patch,
      dataId: patch.dataId.trim(),
      change: patch.change.trim(),
      reason: patch.reason.trim(),
    }))
    .filter(
      (patch) =>
        patch.dataId !== "" &&
        validDataIds.has(patch.dataId) &&
        patch.change !== "" &&
        patch.reason !== ""
    );
}
