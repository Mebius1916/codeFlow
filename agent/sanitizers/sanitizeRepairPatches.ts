import type { RepairPatch } from "../interfaces/repairPatch.js";

export function sanitizeRepairPatches(
  patches: RepairPatch[],
  _context: { currentHtml?: string; previousHtml?: string }
): RepairPatch[] {
  return patches
    .map((patch) => ({
      ...patch,
      dataId: patch.dataId.trim(),
      from: patch.from.trim(),
      to: patch.to.trim(),
      reason: patch.reason.trim(),
    }))
    .filter(
      (patch) =>
        patch.dataId !== "" &&
        patch.from !== "" &&
        patch.to !== "" &&
        patch.reason !== "" &&
        patch.from !== patch.to
    );
}
