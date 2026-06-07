import { Timestamp } from "firebase/firestore";
import { logError } from "@commons-systems/errorutil/log";

export interface UsageSample {
  sampledAt: Date;
  fiveHourUsedPct: number;
  weeklyUsedPct: number;
  fiveHourResetsAt: Date;
  weeklyResetsAt: Date;
  activeWorkers: number;
  targetWorkers: number;
  groupId: string;
}

export function toUsageSample(id: string, data: Record<string, unknown>): UsageSample | null {
  const sampledAtRaw = data.sampledAt;
  const sampledAt =
    sampledAtRaw && typeof (sampledAtRaw as { toDate?: unknown }).toDate === "function"
      ? (sampledAtRaw as { toDate: () => Date }).toDate()
      : null;

  const fiveHourResetsAtRaw = data.fiveHourResetsAt;
  const fiveHourResetsAt =
    fiveHourResetsAtRaw &&
    typeof (fiveHourResetsAtRaw as { toDate?: unknown }).toDate === "function"
      ? (fiveHourResetsAtRaw as { toDate: () => Date }).toDate()
      : null;

  const weeklyResetsAtRaw = data.weeklyResetsAt;
  const weeklyResetsAt =
    weeklyResetsAtRaw && typeof (weeklyResetsAtRaw as { toDate?: unknown }).toDate === "function"
      ? (weeklyResetsAtRaw as { toDate: () => Date }).toDate()
      : null;

  const fiveHourUsedPct =
    typeof data.fiveHourUsedPct === "number" ? data.fiveHourUsedPct : null;
  const weeklyUsedPct = typeof data.weeklyUsedPct === "number" ? data.weeklyUsedPct : null;
  const activeWorkers = typeof data.activeWorkers === "number" ? data.activeWorkers : null;
  const targetWorkers = typeof data.targetWorkers === "number" ? data.targetWorkers : null;
  const groupId = typeof data.groupId === "string" ? data.groupId : null;
  const memberEmails =
    Array.isArray(data.memberEmails) &&
    (data.memberEmails as unknown[]).every((e) => typeof e === "string")
      ? (data.memberEmails as string[])
      : null;

  if (
    sampledAt === null ||
    fiveHourResetsAt === null ||
    weeklyResetsAt === null ||
    fiveHourUsedPct === null ||
    weeklyUsedPct === null ||
    activeWorkers === null ||
    targetWorkers === null ||
    groupId === null ||
    memberEmails === null
  ) {
    logError(new Error("usage-samples document missing required fields"), {
      operation: "usage-sample-validation",
      itemId: id,
    });
    return null;
  }

  return {
    sampledAt,
    fiveHourUsedPct,
    weeklyUsedPct,
    fiveHourResetsAt,
    weeklyResetsAt,
    activeWorkers,
    targetWorkers,
    groupId,
  };
}

export function usageSampleToDoc(
  s: UsageSample,
  memberEmails: string[],
): Record<string, unknown> {
  return {
    sampledAt: Timestamp.fromDate(s.sampledAt),
    fiveHourUsedPct: s.fiveHourUsedPct,
    weeklyUsedPct: s.weeklyUsedPct,
    fiveHourResetsAt: Timestamp.fromDate(s.fiveHourResetsAt),
    weeklyResetsAt: Timestamp.fromDate(s.weeklyResetsAt),
    activeWorkers: s.activeWorkers,
    targetWorkers: s.targetWorkers,
    groupId: s.groupId,
    memberEmails,
  };
}
