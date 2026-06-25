import type { UsageSample } from "./usage-samples.js";
import type { Reminder } from "./reminders.js";
import type { QueueMetricsSnapshot } from "./queue-metrics.js";
import type { IssueSample } from "./issue-samples.js";
import type { AuditAggregate } from "./audit-aggregates.js";

/**
 * The tier-resolved data the panels render. Mirrors the vanilla ViewState's
 * owner payload (and the demo payload built by buildContext).
 *
 * Defined here (not in Dashboard.tsx) so the merge helper below can reference
 * it without creating a circular import.
 */
export interface PanelData {
  samples: UsageSample[];
  reminders: Reminder[];
  queueMetrics: QueueMetricsSnapshot | null;
  issueSamples: IssueSample[];
  auditAggregates: AuditAggregate[];
}

// WHY per-field coverage matters: for append-only collections (samples,
// issueSamples, auditAggregates) a length change does most of the work. But
// `reminders` and the single `queueMetrics` doc mutate IN PLACE — same length,
// changed fields — so per-field coverage is load-bearing there. Comparing every
// Date by .getTime() is required because a re-fetch always yields fresh Date
// objects; identity comparison would always report unequal.

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/** Walks two same-length arrays with a per-item predicate. */
function arraysEqual<T>(a: T[], b: T[], eq: (x: T, y: T) => boolean): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!eq(a[i], b[i])) return false;
  }
  return true;
}

/** Deep equality for Record<string, number>: same key set in both directions, equal values. */
function phaseSpendEqual(a: Record<string, number>, b: Record<string, number>): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const k of aKeys) {
    if (!(k in b) || a[k] !== b[k]) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Exported per-field predicates
// ---------------------------------------------------------------------------

/**
 * Content equality for UsageSample arrays. Compares all 8 fields per item;
 * Date fields by .getTime().
 */
export function usageSamplesEqual(a: UsageSample[], b: UsageSample[]): boolean {
  return arraysEqual(a, b, (x, y) =>
    x.sampledAt.getTime() === y.sampledAt.getTime() &&
    x.fiveHourUsedPct === y.fiveHourUsedPct &&
    x.weeklyUsedPct === y.weeklyUsedPct &&
    x.fiveHourResetsAt.getTime() === y.fiveHourResetsAt.getTime() &&
    x.weeklyResetsAt.getTime() === y.weeklyResetsAt.getTime() &&
    x.activeWorkers === y.activeWorkers &&
    x.targetWorkers === y.targetWorkers &&
    x.groupId === y.groupId,
  );
}

/**
 * Content equality for Reminder arrays. Compares all 5 fields per item;
 * dueAt by .getTime(). Reminders mutate in place (same length, changed fields)
 * so per-field comparison is load-bearing here.
 */
export function remindersEqual(a: Reminder[], b: Reminder[]): boolean {
  return arraysEqual(a, b, (x, y) =>
    x.jitKey === y.jitKey &&
    x.title === y.title &&
    x.repo === y.repo &&
    x.issueNumber === y.issueNumber &&
    x.dueAt.getTime() === y.dueAt.getTime(),
  );
}

/**
 * Content equality for IssueSample arrays. Compares all 6 fields per item;
 * sampledAt by .getTime().
 */
export function issueSamplesEqual(a: IssueSample[], b: IssueSample[]): boolean {
  return arraysEqual(a, b, (x, y) =>
    x.sampledAt.getTime() === y.sampledAt.getTime() &&
    x.openSecurity === y.openSecurity &&
    x.openBug === y.openBug &&
    x.openEnhancement === y.openEnhancement &&
    x.openOther === y.openOther &&
    x.groupId === y.groupId,
  );
}

/**
 * Content equality for AuditAggregate arrays. Compares all 6 fields per item,
 * including a deep comparison of the phaseSpend record.
 */
export function auditAggregatesEqual(a: AuditAggregate[], b: AuditAggregate[]): boolean {
  return arraysEqual(a, b, (x, y) =>
    x.computedAt.getTime() === y.computedAt.getTime() &&
    x.windowDays === y.windowDays &&
    x.groupId === y.groupId &&
    phaseSpendEqual(x.phaseSpend, y.phaseSpend) &&
    x.cacheRead === y.cacheRead &&
    x.cacheCreation === y.cacheCreation,
  );
}

/**
 * Content equality for QueueMetricsSnapshot (nullable). (null, null) → true,
 * the steady-null state must not trigger re-renders. null vs non-null (either
 * direction) → false. Otherwise compares all scalar fields, memberEmails
 * element-wise, and parked items field-by-field including the optional `phase`.
 * The queueMetrics doc mutates in place so per-field coverage is load-bearing.
 */
export function queueMetricsEqual(
  a: QueueMetricsSnapshot | null,
  b: QueueMetricsSnapshot | null,
): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;

  // Scalars
  if (
    a.openHelpWanted !== b.openHelpWanted ||
    a.closedPerDay !== b.closedPerDay ||
    a.createdPerDay !== b.createdPerDay ||
    a.netDrainPerDay !== b.netDrainPerDay ||
    a.runwayDays !== b.runwayDays ||
    a.windowDays !== b.windowDays ||
    a.computedAt.getTime() !== b.computedAt.getTime() ||
    a.groupId !== b.groupId
  ) {
    return false;
  }

  // memberEmails — deep element-wise
  if (a.memberEmails.length !== b.memberEmails.length) return false;
  for (let i = 0; i < a.memberEmails.length; i++) {
    if (a.memberEmails[i] !== b.memberEmails[i]) return false;
  }

  // parked — deep per ParkedIssue fields
  if (a.parked.length !== b.parked.length) return false;
  for (let i = 0; i < a.parked.length; i++) {
    const pa = a.parked[i];
    const pb = b.parked[i];
    if (
      pa.number !== pb.number ||
      pa.title !== pb.title ||
      pa.url !== pb.url ||
      pa.createdAt.getTime() !== pb.createdAt.getTime() ||
      pa.repo !== pb.repo ||
      pa.phase !== pb.phase
    ) {
      return false;
    }
  }

  return true;
}

// ---------------------------------------------------------------------------
// Top-level merge helper
// ---------------------------------------------------------------------------

/**
 * Returns a PanelData that reuses prev's slices where the content predicate
 * reports equal, and takes next's slices where it changed. If ALL five slices
 * are reused, returns `prev` itself unchanged — preserving object identity so
 * React's Object.is bails the render. Otherwise returns a new object mixing
 * prev and next slices.
 */
export function mergePanelData(prev: PanelData, next: PanelData): PanelData {
  const samplesEq = usageSamplesEqual(prev.samples, next.samples);
  const remindersEq = remindersEqual(prev.reminders, next.reminders);
  const queueMetricsEq = queueMetricsEqual(prev.queueMetrics, next.queueMetrics);
  const issueSamplesEq = issueSamplesEqual(prev.issueSamples, next.issueSamples);
  const auditAggregatesEq = auditAggregatesEqual(prev.auditAggregates, next.auditAggregates);

  if (samplesEq && remindersEq && queueMetricsEq && issueSamplesEq && auditAggregatesEq) {
    return prev;
  }

  return {
    samples: samplesEq ? prev.samples : next.samples,
    reminders: remindersEq ? prev.reminders : next.reminders,
    queueMetrics: queueMetricsEq ? prev.queueMetrics : next.queueMetrics,
    issueSamples: issueSamplesEq ? prev.issueSamples : next.issueSamples,
    auditAggregates: auditAggregatesEq ? prev.auditAggregates : next.auditAggregates,
  };
}
