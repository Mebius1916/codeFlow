import type { RepairAction } from "../decideNextAction.js";
import type { VisualRepairContext } from "../loop.js";

export function resolveExecutableAction(
  context: VisualRepairContext,
  action: RepairAction
): RepairAction {
  if (
    action.type !== "rewrite" ||
    (context.repairPatches && context.repairPatches.length > 0)
  ) {
    return action;
  }

  return {
    ...action,
    type: "plan",
    reason: `${action.reason}；当前缺少修改计划，先回退执行 plan。`,
  };
}
