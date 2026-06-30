declare module "virtual:office-hours-seed-data" {
  export interface SeedReminder {
    readonly jitKey: string;
    readonly title: string;
    readonly repo: string;
    readonly issueNumber: number;
    readonly dueAt: Date;
  }
  const seedReminders: readonly SeedReminder[];
  export default seedReminders;
}
