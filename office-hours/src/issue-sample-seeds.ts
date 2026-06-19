export interface IssueSampleSeed {
  /** Minutes relative to build "now": negative = in the past. */
  sampledAtOffsetMin: number;
  openSecurity: number;
  openBug: number;
  openEnhancement: number;
  openOther: number;
  groupId: string;
  memberEmails: string[];
}

// 14 samples spanning ~7 days, showing a shrinking open-issue backlog. The total
// (openSecurity + openBug + openEnhancement + openOther) trends downward as
// sampledAtOffsetMin climbs from -10080 (7 days ago) to 0 ("now"), so the demo
// renders a real downward runway projection. Each sample partitions its total
// across the four mutually-exclusive work-type buckets in precedence order
// (security small, bug/enhancement moderate, other the remainder).
// sampledAtOffsetMin == 0 is the most recent ("now") sample.
export const issueSampleSeeds: IssueSampleSeed[] = [
  // Day -7 — backlog at its peak (total 62)
  {
    sampledAtOffsetMin: -10080, // 7 days ago
    openSecurity: 3,
    openBug: 18,
    openEnhancement: 16,
    openOther: 25,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // Day -6.5 (total 59)
  {
    sampledAtOffsetMin: -9360,
    openSecurity: 3,
    openBug: 17,
    openEnhancement: 15,
    openOther: 24,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // Day -6 (total 57)
  {
    sampledAtOffsetMin: -8640,
    openSecurity: 2,
    openBug: 17,
    openEnhancement: 15,
    openOther: 23,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // Day -5.5 — deceleration: total drops only 1 vs the prior 2-3 per half-day (total 56)
  {
    sampledAtOffsetMin: -7920,
    openSecurity: 2,
    openBug: 16,
    openEnhancement: 15,
    openOther: 23,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // Day -5 (total 52)
  {
    sampledAtOffsetMin: -7200,
    openSecurity: 2,
    openBug: 15,
    openEnhancement: 14,
    openOther: 21,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // Day -4 (total 48)
  {
    sampledAtOffsetMin: -5760,
    openSecurity: 2,
    openBug: 14,
    openEnhancement: 13,
    openOther: 19,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // Day -3.5 (total 45)
  {
    sampledAtOffsetMin: -5040,
    openSecurity: 2,
    openBug: 13,
    openEnhancement: 12,
    openOther: 18,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // Day -3 (total 41)
  {
    sampledAtOffsetMin: -4320,
    openSecurity: 1,
    openBug: 12,
    openEnhancement: 11,
    openOther: 17,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // Day -2.5 — brief plateau (total 40)
  {
    sampledAtOffsetMin: -3600,
    openSecurity: 1,
    openBug: 12,
    openEnhancement: 11,
    openOther: 16,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // Day -2 (total 36)
  {
    sampledAtOffsetMin: -2880,
    openSecurity: 1,
    openBug: 11,
    openEnhancement: 10,
    openOther: 14,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // Day -1 (total 31)
  {
    sampledAtOffsetMin: -1440,
    openSecurity: 1,
    openBug: 9,
    openEnhancement: 9,
    openOther: 12,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // ~12h ago (total 27)
  {
    sampledAtOffsetMin: -720,
    openSecurity: 1,
    openBug: 8,
    openEnhancement: 8,
    openOther: 10,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // ~2h ago (total 23)
  {
    sampledAtOffsetMin: -120,
    openSecurity: 1,
    openBug: 7,
    openEnhancement: 7,
    openOther: 8,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // Now — most recent sample, backlog at its lowest (total 19)
  {
    sampledAtOffsetMin: 0,
    openSecurity: 1,
    openBug: 6,
    openEnhancement: 6,
    openOther: 6,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
];
