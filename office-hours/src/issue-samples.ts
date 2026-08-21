import { Timestamp } from "firebase/firestore";
import { logError } from "@commons-systems/errorutil/log";

export interface IssueSample {
  sampledAt: Date;
  openSecurity: number;
  openBug: number;
  openEnhancement: number;
  openOther: number;
  groupId: string;
}

/** Total open issues across all four work-type buckets — the stacked-area total. */
export function sampleTotal(s: IssueSample): number {
  return s.openSecurity + s.openBug + s.openEnhancement + s.openOther;
}

/**
 * Parse an issue-sample document into the domain `IssueSample`.
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
export function toIssueSample(
  id: string,
  data: Record<string, unknown>,
  opts: { requireMemberEmails?: boolean } = {},
): IssueSample | null {
  const sampledAtRaw = data.sampledAt;
  const sampledAt =
    sampledAtRaw && typeof (sampledAtRaw as { toDate?: unknown }).toDate === "function"
      ? (sampledAtRaw as { toDate: () => Date }).toDate()
      : null;

  const groupId = typeof data.groupId === "string" ? data.groupId : null;
  const requireMemberEmails = opts.requireMemberEmails ?? true;
  const memberEmails =
    Array.isArray(data.memberEmails) &&
    (data.memberEmails as unknown[]).every((e) => typeof e === "string")
      ? (data.memberEmails as string[])
      : null;

  // Tolerant, append-only migration. Pre-#1828 docs carry openHelpWanted +
  // openOther and none of the four work-type fields; fold their total into the
  // new openOther bucket (none of the three typed buckets is known for old
  // docs). New-format docs use their four fields directly.
  let openSecurity: number | null;
  let openBug: number | null;
  let openEnhancement: number | null;
  let openOther: number | null;

  if (typeof data.openHelpWanted === "number") {
    openSecurity = 0;
    openBug = 0;
    openEnhancement = 0;
    openOther =
      data.openHelpWanted + (typeof data.openOther === "number" ? data.openOther : 0);
  } else {
    openSecurity = typeof data.openSecurity === "number" ? data.openSecurity : null;
    openBug = typeof data.openBug === "number" ? data.openBug : null;
    openEnhancement = typeof data.openEnhancement === "number" ? data.openEnhancement : null;
    openOther = typeof data.openOther === "number" ? data.openOther : null;
  }

  if (
    sampledAt === null ||
    openSecurity === null ||
    openBug === null ||
    openEnhancement === null ||
    openOther === null ||
    groupId === null ||
    (requireMemberEmails && memberEmails === null)
  ) {
    logError(new Error("issue-samples document missing required fields"), {
      operation: "issue-sample-validation",
      itemId: id,
    });
    return null;
  }

  return {
    sampledAt,
    openSecurity,
    openBug,
    openEnhancement,
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
    openSecurity: s.openSecurity,
    openBug: s.openBug,
    openEnhancement: s.openEnhancement,
    openOther: s.openOther,
    groupId: s.groupId,
    memberEmails,
  };
}
