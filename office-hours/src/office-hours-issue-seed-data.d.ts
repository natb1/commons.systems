declare module "virtual:office-hours-issue-seed-data" {
  export interface IssueSampleResolved {
    readonly sampledAt: Date;
    readonly openHelpWanted: number;
    readonly openOther: number;
    readonly groupId: string;
  }
  const issueSampleSeeds: readonly IssueSampleResolved[];
  export default issueSampleSeeds;
}
