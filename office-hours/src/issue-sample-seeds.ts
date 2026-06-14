export interface IssueSampleSeed {
  /** Minutes relative to build "now": negative = in the past. */
  sampledAtOffsetMin: number;
  openHelpWanted: number;
  openOther: number;
  groupId: string;
  memberEmails: string[];
}

// 14 samples spanning ~7 days, showing a shrinking open-issue backlog. The total
// (openHelpWanted + openOther) trends downward as sampledAtOffsetMin climbs from
// -10080 (7 days ago) to 0 ("now"), so the demo renders a real downward runway
// projection. sampledAtOffsetMin == 0 is the most recent ("now") sample.
export const issueSampleSeeds: IssueSampleSeed[] = [
  // Day -7 — backlog at its peak
  {
    sampledAtOffsetMin: -10080, // 7 days ago
    openHelpWanted: 18,
    openOther: 44,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // Day -6.5
  {
    sampledAtOffsetMin: -9360,
    openHelpWanted: 17,
    openOther: 42,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // Day -6
  {
    sampledAtOffsetMin: -8640,
    openHelpWanted: 16,
    openOther: 41,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // Day -5.5 — small uptick (new issues filed) against the overall trend
  {
    sampledAtOffsetMin: -7920,
    openHelpWanted: 17,
    openOther: 39,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // Day -5
  {
    sampledAtOffsetMin: -7200,
    openHelpWanted: 15,
    openOther: 37,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // Day -4
  {
    sampledAtOffsetMin: -5760,
    openHelpWanted: 14,
    openOther: 34,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // Day -3.5
  {
    sampledAtOffsetMin: -5040,
    openHelpWanted: 13,
    openOther: 32,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // Day -3
  {
    sampledAtOffsetMin: -4320,
    openHelpWanted: 12,
    openOther: 29,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // Day -2.5 — brief plateau
  {
    sampledAtOffsetMin: -3600,
    openHelpWanted: 12,
    openOther: 28,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // Day -2
  {
    sampledAtOffsetMin: -2880,
    openHelpWanted: 11,
    openOther: 25,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // Day -1
  {
    sampledAtOffsetMin: -1440,
    openHelpWanted: 9,
    openOther: 22,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // ~12h ago
  {
    sampledAtOffsetMin: -720,
    openHelpWanted: 8,
    openOther: 19,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // ~2h ago
  {
    sampledAtOffsetMin: -120,
    openHelpWanted: 7,
    openOther: 16,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // Now — most recent sample, backlog at its lowest
  {
    sampledAtOffsetMin: 0,
    openHelpWanted: 6,
    openOther: 13,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
];
