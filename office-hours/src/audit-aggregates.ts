import { Timestamp } from "firebase/firestore";
import { logError } from "@commons-systems/errorutil/log";

export interface AuditAggregate {
  computedAt: Date;
  windowDays: number;
  groupId: string;
  phaseSpend: Record<string, number>;
  cacheRead: number;
  cacheCreation: number;
}

export function toAuditAggregate(
  id: string,
  data: Record<string, unknown>,
): AuditAggregate | null {
  const computedAtRaw = data.computedAt;
  const computedAt =
    computedAtRaw && typeof (computedAtRaw as { toDate?: unknown }).toDate === "function"
      ? (computedAtRaw as { toDate: () => Date }).toDate()
      : null;

  const windowDays = typeof data.windowDays === "number" ? data.windowDays : null;
  const cacheRead = typeof data.cacheRead === "number" ? data.cacheRead : null;
  const cacheCreation = typeof data.cacheCreation === "number" ? data.cacheCreation : null;
  const groupId = typeof data.groupId === "string" ? data.groupId : null;
  const memberEmails =
    Array.isArray(data.memberEmails) &&
    (data.memberEmails as unknown[]).every((e) => typeof e === "string")
      ? (data.memberEmails as string[])
      : null;

  const phaseSpendRaw = data.phaseSpend;
  const phaseSpend =
    phaseSpendRaw &&
    typeof phaseSpendRaw === "object" &&
    !Array.isArray(phaseSpendRaw) &&
    Object.values(phaseSpendRaw as Record<string, unknown>).every((v) => typeof v === "number")
      ? (phaseSpendRaw as Record<string, number>)
      : null;

  if (
    computedAt === null ||
    windowDays === null ||
    cacheRead === null ||
    cacheCreation === null ||
    groupId === null ||
    memberEmails === null ||
    phaseSpend === null
  ) {
    logError(new Error("audit-aggregates document missing required fields"), {
      operation: "audit-aggregate-validation",
      itemId: id,
    });
    return null;
  }

  return {
    computedAt,
    windowDays,
    groupId,
    phaseSpend,
    cacheRead,
    cacheCreation,
  };
}

export function auditAggregateToDoc(
  a: AuditAggregate,
  memberEmails: string[],
): Record<string, unknown> {
  return {
    computedAt: Timestamp.fromDate(a.computedAt),
    windowDays: a.windowDays,
    groupId: a.groupId,
    phaseSpend: a.phaseSpend,
    cacheRead: a.cacheRead,
    cacheCreation: a.cacheCreation,
    memberEmails,
  };
}
