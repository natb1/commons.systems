declare module "virtual:office-hours-seed-data" {
  export interface SeedReminderModule {
    readonly kind: "reminder";
    readonly jitKey: string;
    readonly title: string;
    readonly repo: string;
    readonly issueNumber: number;
    readonly dueAt: Date;
  }
  export interface SeedMergePrModule {
    readonly kind: "merge-pr";
    readonly title: string;
    readonly repo: string;
    readonly issueNumber: number;
    readonly prTitle: string;
    readonly prUrl: string;
    readonly prNumber: number;
    readonly prRepo: string;
  }
  const seedReminders: readonly (SeedReminderModule | SeedMergePrModule)[];
  export default seedReminders;
}
