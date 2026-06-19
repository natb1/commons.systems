declare module "virtual:office-hours-audit-aggregate-seed-data" {
  export interface AuditAggregateResolved {
    readonly computedAt: Date;
    readonly windowDays: number;
    readonly groupId: string;
    readonly phaseSpend: Record<string, number>;
    readonly cacheRead: number;
    readonly cacheCreation: number;
  }
  const auditAggregateSeeds: readonly AuditAggregateResolved[];
  export default auditAggregateSeeds;
}
