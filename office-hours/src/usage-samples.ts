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

/**
 * Parse a usage-sample document into the domain `UsageSample`.
 *
 * `opts.requireMemberEmails` (default true) controls whether the source document
 * must carry the denormalized `memberEmails` auth field. A live Firestore doc
 * always carries it — the office-hours security rules evaluate it — so its
 * absence there is real drift and must reject. The offline snapshot wire
 * deliberately OMITS it (it is the group's real ACL, and a `--plaintext` debug
 * run lands the whole document unencrypted in the shared Drive dir), so
 * `decodeSnapshot` passes false and the field is ignored entirely. Either way it
 * is stripped from the returned object — it is never a dashboard field.
 */
export function toUsageSample(
  id: string,
  data: Record<string, unknown>,
  opts: { requireMemberEmails?: boolean } = {},
): UsageSample | null {
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
  const requireMemberEmails = opts.requireMemberEmails ?? true;
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
    (requireMemberEmails && memberEmails === null)
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

/**
 * Returns the sample with the maximum sampledAt, or null for an empty array.
 * Does not mutate the input array.
 */
export function selectLatestSample(samples: UsageSample[]): UsageSample | null {
  if (samples.length === 0) return null;
  return samples.reduce((best, s) =>
    s.sampledAt.getTime() > best.sampledAt.getTime() ? s : best,
  );
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
