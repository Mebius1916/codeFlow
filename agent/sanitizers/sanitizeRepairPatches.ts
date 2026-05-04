import type { RepairPatch } from "../interfaces/repairPatch.js";
import {
  extractAttributeValue,
  findOpeningTagByDataId,
  type SanitizeOutputContext,
} from "./shared.js";

export function sanitizeRepairPatches(
  patches: RepairPatch[],
  context: SanitizeOutputContext
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
        patch.from !== patch.to &&
        isPatchApplicable(context.currentHtml, patch)
    );
}

function isPatchApplicable(
  currentHtml: string | undefined,
  patch: RepairPatch
): boolean {
  if (!currentHtml) {
    return true;
  }

  const openingTag = findOpeningTagByDataId(currentHtml, patch.dataId);
  if (!openingTag) {
    return false;
  }

  const classValue = extractAttributeValue(openingTag, "class");
  if (!classValue) {
    return false;
  }

  return classValue.split(/\s+/).filter(Boolean).includes(patch.from);
}
