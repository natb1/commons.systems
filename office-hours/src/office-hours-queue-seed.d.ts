declare module "virtual:office-hours-queue-seed" {
  const seedQueueMetrics: {
    readonly openHelpWanted: number;
    readonly closedPerDay: number;
    readonly createdPerDay: number;
    readonly netDrainPerDay: number;
    readonly runwayDays: number | null;
    readonly windowDays: number;
    readonly computedAt: Date;
    readonly groupId: string;
    readonly memberEmails: readonly string[];
  };
  export default seedQueueMetrics;
}
