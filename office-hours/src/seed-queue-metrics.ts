export interface SeedParkedIssue {
  number: number;
  title: string;
  url: string;
  createdAt: Date;
  repo: string;
  phase?: string;
}

export interface SeedQueueMetrics {
  openHelpWanted: number;
  closedPerDay: number;
  createdPerDay: number;
  netDrainPerDay: number;
  runwayDays: number | null;
  windowDays: number;
  /** Minutes before "now" the snapshot was computed; the vite plugin converts it to computedAt at build time. */
  computedAtMinutesAgo: number;
  groupId: string;
  memberEmails: string[];
  parked: SeedParkedIssue[];
}

export const seedQueueMetrics: SeedQueueMetrics = {
  openHelpWanted: 12,
  closedPerDay: 1.5,
  createdPerDay: 1.0,
  netDrainPerDay: 0.5,
  runwayDays: 24,
  windowDays: 14,
  computedAtMinutesAgo: 30,
  groupId: "demo-group",
  memberEmails: ["demo@example.com"],
  parked: [
    {
      number: 1466,
      title: "office-hours: surface parked dispatch:office-hours work on the dashboard",
      url: "https://github.com/natb1/commons.systems/issues/1466",
      createdAt: new Date("2026-05-15T10:00:00Z"),
      repo: "natb1/commons.systems",
      phase: "dispatch:plan",
    },
    {
      number: 1403,
      title: "dispatch: stop re-parking idle polling workers on every heartbeat",
      url: "https://github.com/natb1/commons.systems/issues/1403",
      createdAt: new Date("2026-04-28T14:30:00Z"),
      repo: "natb1/commons.systems",
    },
  ],
};
