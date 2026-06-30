declare module "virtual:office-hours-issue-seed-data" {
  export interface IssueSampleResolved {
    readonly sampledAt: Date;
    readonly openSecurity: number;
    readonly openBug: number;
    readonly openEnhancement: number;
    readonly openOther: number;
    readonly groupId: string;
  }
  const issueSampleSeeds: readonly IssueSampleResolved[];
  export default issueSampleSeeds;
}
