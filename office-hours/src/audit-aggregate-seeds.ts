export interface AuditAggregateSeed {
  /** Minutes relative to build "now": negative = in the past. */
  computedAtOffsetMin: number;
  windowDays: number;
  groupId: string;
  /** Per-phase spend in USD over the window. */
  phaseSpend: Record<string, number>;
  cacheRead: number;
  cacheCreation: number;
  memberEmails: string[];
}

// 7 daily aggregate windows spanning the last week, computedAtOffsetMin == 0 is
// the most recent ("now") window. Per-phase spend shifts across phases over the
// series, and the cache hit-rate — cacheRead / (cacheRead + cacheCreation) —
// climbs from ~0.50 to ~0.90 to give the chart a visibly improving trend.
export const auditAggregateSeeds: AuditAggregateSeed[] = [
  // Day -6 — early window, low cache reuse (hit rate ~0.50)
  {
    computedAtOffsetMin: -8640, // 6 days ago
    windowDays: 1,
    groupId: "demo-group",
    phaseSpend: {
      "plan-implement": 4.2,
      "review-fix": 2.1,
      "security-review-fix": 0.8,
      "qa-fix": 1.3,
      "code-review-fix": 1.0,
      "fix-checks": 0.6,
      "dispatch-worker": 3.5,
    },
    cacheRead: 1_200_000,
    cacheCreation: 1_180_000,
    memberEmails: ["demo@example.com"],
  },
  // Day -5 — heavier planning load, cache warming (hit rate ~0.62)
  {
    computedAtOffsetMin: -7200, // 5 days ago
    windowDays: 1,
    groupId: "demo-group",
    phaseSpend: {
      "plan-implement": 6.8,
      "review-fix": 2.6,
      "security-review-fix": 1.1,
      "qa-fix": 1.0,
      "code-review-fix": 1.4,
      "fix-checks": 0.9,
      "dispatch-worker": 4.1,
    },
    cacheRead: 2_000_000,
    cacheCreation: 1_230_000,
    memberEmails: ["demo@example.com"],
  },
  // Day -4 — review-heavy day (hit rate ~0.70)
  {
    computedAtOffsetMin: -5760, // 4 days ago
    windowDays: 1,
    groupId: "demo-group",
    phaseSpend: {
      "plan-implement": 3.9,
      "review-fix": 5.4,
      "security-review-fix": 2.2,
      "qa-fix": 1.7,
      "code-review-fix": 2.8,
      "fix-checks": 1.1,
      "dispatch-worker": 3.8,
    },
    cacheRead: 2_800_000,
    cacheCreation: 1_200_000,
    memberEmails: ["demo@example.com"],
  },
  // Day -3 — QA-heavy day (hit rate ~0.77)
  {
    computedAtOffsetMin: -4320, // 3 days ago
    windowDays: 1,
    groupId: "demo-group",
    phaseSpend: {
      "plan-implement": 4.5,
      "review-fix": 3.1,
      "security-review-fix": 1.4,
      "qa-fix": 4.9,
      "code-review-fix": 2.0,
      "fix-checks": 1.8,
      "dispatch-worker": 4.6,
    },
    cacheRead: 3_400_000,
    cacheCreation: 1_020_000,
    memberEmails: ["demo@example.com"],
  },
  // Day -2 — steady, cache hot (hit rate ~0.82)
  {
    computedAtOffsetMin: -2880, // 2 days ago
    windowDays: 1,
    groupId: "demo-group",
    phaseSpend: {
      "plan-implement": 5.1,
      "review-fix": 3.8,
      "security-review-fix": 1.0,
      "qa-fix": 2.2,
      "code-review-fix": 2.5,
      "fix-checks": 1.2,
      "dispatch-worker": 5.0,
    },
    cacheRead: 4_100_000,
    cacheCreation: 900_000,
    memberEmails: ["demo@example.com"],
  },
  // Day -1 — high throughput, cache very hot (hit rate ~0.87)
  {
    computedAtOffsetMin: -1440, // 1 day ago
    windowDays: 1,
    groupId: "demo-group",
    phaseSpend: {
      "plan-implement": 6.2,
      "review-fix": 4.4,
      "security-review-fix": 1.6,
      "qa-fix": 3.0,
      "code-review-fix": 3.1,
      "fix-checks": 1.5,
      "dispatch-worker": 6.3,
    },
    cacheRead: 5_200_000,
    cacheCreation: 780_000,
    memberEmails: ["demo@example.com"],
  },
  // Now — most recent window, peak cache reuse (hit rate ~0.90)
  {
    computedAtOffsetMin: 0,
    windowDays: 1,
    groupId: "demo-group",
    phaseSpend: {
      "plan-implement": 5.6,
      "review-fix": 4.0,
      "security-review-fix": 1.3,
      "qa-fix": 2.6,
      "code-review-fix": 2.9,
      "fix-checks": 1.3,
      "dispatch-worker": 5.8,
    },
    cacheRead: 6_300_000,
    cacheCreation: 700_000,
    memberEmails: ["demo@example.com"],
  },
];
