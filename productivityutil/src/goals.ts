import type { Timestamp } from "firebase/firestore";
import type { Brand } from "@commons-systems/firestoreutil/brand";
import type { GroupId } from "@commons-systems/authutil/groups";
import {
  requireString,
  requireNonNegativeNumber,
  requireOneOf,
} from "@commons-systems/firestoreutil/validate";
import {
  requireTimestamp,
  requireGroupId,
  requireMemberEmails,
  requireBoundedNumber,
} from "./validate.js";

export type GoalId = Brand<"GoalId">;

export const GOAL_HORIZONS = ["weekly", "quarterly", "yearly"] as const;
export type GoalHorizon = (typeof GOAL_HORIZONS)[number];

export const GOAL_STATUSES = ["active", "done", "dropped"] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];

export interface Goal {
  readonly id: GoalId;
  readonly title: string;
  readonly horizon: GoalHorizon;
  /** Lower value = higher priority. Non-negative. */
  readonly priority: number;
  readonly status: GoalStatus;
  /** Percentage in [0, 100]. */
  readonly progress: number;
  readonly groupId: GroupId;
  readonly memberEmails: readonly string[];
  readonly createdAt: Timestamp;
}

export function requireGoal(id: string, data: unknown): Goal {
  if (data == null || typeof data !== "object") {
    throw new TypeError(`Expected object for goal ${id}, got ${typeof data}`);
  }
  const d = data as Record<string, unknown>;
  return {
    id: id as GoalId,
    title: requireString(d.title, "title"),
    horizon: requireOneOf(d.horizon, GOAL_HORIZONS, "horizon"),
    priority: requireNonNegativeNumber(d.priority, "priority"),
    status: requireOneOf(d.status, GOAL_STATUSES, "status"),
    progress: requireBoundedNumber(d.progress, "progress", 0, 100),
    groupId: requireGroupId(d.groupId, "groupId"),
    memberEmails: requireMemberEmails(d.memberEmails),
    createdAt: requireTimestamp(d.createdAt, "createdAt"),
  };
}
