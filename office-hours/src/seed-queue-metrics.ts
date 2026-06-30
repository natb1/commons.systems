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
};
