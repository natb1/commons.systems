export interface UsageSampleSeed {
  /** Minutes relative to build "now": negative = in the past. */
  sampledAtOffsetMin: number;
  fiveHourUsedPct: number;
  weeklyUsedPct: number;
  /** Minutes relative to build "now" for the next 5-hour window reset. */
  fiveHourResetsAtOffsetMin: number;
  /** Minutes relative to build "now" for the next weekly window reset. */
  weeklyResetsAtOffsetMin: number;
  activeWorkers: number;
  targetWorkers: number;
  groupId: string;
  memberEmails: string[];
}

// 14 samples spanning ~7 days, with sawtooth resets and diverging worker counts.
// sampledAtOffsetMin == 0 is the most recent ("now") sample.
// 5-hour resets: usage climbs then drops sharply after the window closes.
// Weekly reset: one full drop in weekly% toward the middle of the series.
export const usageSampleSeeds: UsageSampleSeed[] = [
  // Day -7 — early samples, weekly window just opened, low usage
  {
    sampledAtOffsetMin: -10080, // 7 days ago
    fiveHourUsedPct: 8,
    weeklyUsedPct: 5,
    fiveHourResetsAtOffsetMin: -10080 + 280, // 4h40m until next 5h reset from that sample
    weeklyResetsAtOffsetMin: -10080 + 9120, // ~6.3 days until next weekly reset from that sample
    activeWorkers: 1,
    targetWorkers: 2,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // Day -6 — usage climbing into first 5h window
  {
    sampledAtOffsetMin: -8640, // 6 days ago
    fiveHourUsedPct: 42,
    weeklyUsedPct: 18,
    fiveHourResetsAtOffsetMin: -8640 + 130,
    weeklyResetsAtOffsetMin: -8640 + 7680,
    activeWorkers: 2,
    targetWorkers: 2,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // Day -6 — near the top of first 5h window
  {
    sampledAtOffsetMin: -8500, // just before first sawtooth drop
    fiveHourUsedPct: 78,
    weeklyUsedPct: 22,
    fiveHourResetsAtOffsetMin: -8500 + 10, // reset imminent
    weeklyResetsAtOffsetMin: -8500 + 7550,
    activeWorkers: 3,
    targetWorkers: 2,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // Day -6 — after 5h sawtooth drop (reset just rolled over)
  {
    sampledAtOffsetMin: -8490, // just after first 5h reset
    fiveHourUsedPct: 4,
    weeklyUsedPct: 23,
    fiveHourResetsAtOffsetMin: -8490 + 300, // fresh 5h window
    weeklyResetsAtOffsetMin: -8490 + 7540,
    activeWorkers: 3,
    targetWorkers: 3,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // Day -5 — steady climb
  {
    sampledAtOffsetMin: -7200, // 5 days ago
    fiveHourUsedPct: 55,
    weeklyUsedPct: 35,
    fiveHourResetsAtOffsetMin: -7200 + 210,
    weeklyResetsAtOffsetMin: -7200 + 6250,
    activeWorkers: 3,
    targetWorkers: 3,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // Day -4.5 — weekly reset (usage drops sharply)
  {
    sampledAtOffsetMin: -6480, // 4.5 days ago
    fiveHourUsedPct: 20,
    weeklyUsedPct: 3, // weekly reset just occurred
    fiveHourResetsAtOffsetMin: -6480 + 240,
    weeklyResetsAtOffsetMin: -6480 + 10080, // new full weekly window
    activeWorkers: 2,
    targetWorkers: 3,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // Day -4 — rebuilding after weekly reset
  {
    sampledAtOffsetMin: -5760, // 4 days ago
    fiveHourUsedPct: 38,
    weeklyUsedPct: 12,
    fiveHourResetsAtOffsetMin: -5760 + 170,
    weeklyResetsAtOffsetMin: -5760 + 9360,
    activeWorkers: 2,
    targetWorkers: 2,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // Day -3 — high activity, near second 5h peak
  {
    sampledAtOffsetMin: -4320, // 3 days ago
    fiveHourUsedPct: 85,
    weeklyUsedPct: 28,
    fiveHourResetsAtOffsetMin: -4320 + 20, // reset imminent again
    weeklyResetsAtOffsetMin: -4320 + 7920,
    activeWorkers: 4,
    targetWorkers: 3,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // Day -3 — after second 5h sawtooth drop
  {
    sampledAtOffsetMin: -4300,
    fiveHourUsedPct: 6,
    weeklyUsedPct: 29,
    fiveHourResetsAtOffsetMin: -4300 + 300,
    weeklyResetsAtOffsetMin: -4300 + 7900,
    activeWorkers: 4,
    targetWorkers: 4,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // Day -2 — moderate usage
  {
    sampledAtOffsetMin: -2880, // 2 days ago
    fiveHourUsedPct: 47,
    weeklyUsedPct: 41,
    fiveHourResetsAtOffsetMin: -2880 + 190,
    weeklyResetsAtOffsetMin: -2880 + 6480,
    activeWorkers: 3,
    targetWorkers: 4,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // Day -1 — climbing again
  {
    sampledAtOffsetMin: -1440, // 1 day ago
    fiveHourUsedPct: 62,
    weeklyUsedPct: 54,
    fiveHourResetsAtOffsetMin: -1440 + 150,
    weeklyResetsAtOffsetMin: -1440 + 5040,
    activeWorkers: 3,
    targetWorkers: 3,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // ~12h ago — elevated usage, workers diverging
  {
    sampledAtOffsetMin: -720, // 12h ago
    fiveHourUsedPct: 71,
    weeklyUsedPct: 63,
    fiveHourResetsAtOffsetMin: -720 + 60,
    weeklyResetsAtOffsetMin: 3600,
    activeWorkers: 2,
    targetWorkers: 4,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // ~2h ago — recent sample
  {
    sampledAtOffsetMin: -120,
    fiveHourUsedPct: 33,
    weeklyUsedPct: 68,
    fiveHourResetsAtOffsetMin: -120 + 270,
    weeklyResetsAtOffsetMin: 3600,
    activeWorkers: 2,
    targetWorkers: 2,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
  // Now — most recent sample (status band reads this one)
  {
    sampledAtOffsetMin: 0,
    fiveHourUsedPct: 41,
    weeklyUsedPct: 71,
    fiveHourResetsAtOffsetMin: 150, // next 5h reset in 2.5h
    weeklyResetsAtOffsetMin: 3600, // next weekly reset in ~2.5 days
    activeWorkers: 3,
    targetWorkers: 2,
    groupId: "demo-group",
    memberEmails: ["demo@example.com"],
  },
];
