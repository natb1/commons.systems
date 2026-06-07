declare module "virtual:office-hours-usage-seed-data" {
  export interface UsageSampleResolved {
    readonly sampledAt: Date;
    readonly fiveHourUsedPct: number;
    readonly weeklyUsedPct: number;
    readonly fiveHourResetsAt: Date;
    readonly weeklyResetsAt: Date;
    readonly activeWorkers: number;
    readonly targetWorkers: number;
    readonly groupId: string;
    readonly memberEmails: string[];
  }
  const usageSampleSeeds: readonly UsageSampleResolved[];
  export default usageSampleSeeds;
}
