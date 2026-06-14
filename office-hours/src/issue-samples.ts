import { Timestamp } from "firebase/firestore";
import { logError } from "@commons-systems/errorutil/log";

export interface IssueSample {
  sampledAt: Date;
  openHelpWanted: number;
  openOther: number;
  groupId: string;
}

export function toIssueSample(id: string, data: Record<string, unknown>): IssueSample | null {
  const sampledAtRaw = data.sampledAt;
  const sampledAt =
    sampledAtRaw && typeof (sampledAtRaw as { toDate?: unknown }).toDate === "function"
      ? (sampledAtRaw as { toDate: () => Date }).toDate()
      : null;

  const openHelpWanted =
    typeof data.openHelpWanted === "number" ? data.openHelpWanted : null;
  const openOther = typeof data.openOther === "number" ? data.openOther : null;
  const groupId = typeof data.groupId === "string" ? data.groupId : null;
  const memberEmails =
    Array.isArray(data.memberEmails) &&
    (data.memberEmails as unknown[]).every((e) => typeof e === "string")
      ? (data.memberEmails as string[])
      : null;

  if (
    sampledAt === null ||
    openHelpWanted === null ||
    openOther === null ||
    groupId === null ||
    memberEmails === null
  ) {
    logError(new Error("issue-samples document missing required fields"), {
      operation: "issue-sample-validation",
      itemId: id,
    });
    return null;
  }

  return {
    sampledAt,
    openHelpWanted,
    openOther,
    groupId,
  };
}

export function issueSampleToDoc(
  s: IssueSample,
  memberEmails: string[],
): Record<string, unknown> {
  return {
    sampledAt: Timestamp.fromDate(s.sampledAt),
    openHelpWanted: s.openHelpWanted,
    openOther: s.openOther,
    groupId: s.groupId,
    memberEmails,
  };
}
