export interface SeedReminder {
  kind: "reminder";
  jitKey: string;
  title: string;
  repo: string;
  issueNumber: number;
  /** Signed offset from "now" in minutes: negative = overdue, positive = due in the future. */
  dueInMinutes: number;
}

export interface SeedMergePr {
  kind: "merge-pr";
  title: string;
  repo: string;
  issueNumber: number;
  prTitle: string;
  prUrl: string;
  prNumber: number;
  prRepo: string;
}

export const seedReminders: (SeedReminder | SeedMergePr)[] = [
  {
    kind: "reminder",
    jitKey: "weekly-review",
    title: "Weekly review",
    repo: "natb1/example",
    issueNumber: 101,
    dueInMinutes: -240, // overdue 4h
  },
  {
    kind: "reminder",
    jitKey: "monthly-retro",
    title: "Monthly retrospective",
    repo: "natb1/example",
    issueNumber: 102,
    dueInMinutes: -60, // overdue 1h
  },
  {
    kind: "reminder",
    jitKey: "triage-inbox",
    title: "Triage inbox",
    repo: "natb1/example",
    issueNumber: 103,
    dueInMinutes: 180, // due in 3h
  },
  {
    kind: "reminder",
    jitKey: "roadmap-update",
    title: "Update roadmap",
    repo: "natb1/example",
    issueNumber: 104,
    dueInMinutes: 2880, // due in 2 days
  },
  {
    kind: "reminder",
    jitKey: "dependency-audit",
    title: "Audit dependencies",
    repo: "natb1/example",
    issueNumber: 105,
    dueInMinutes: 10080, // due in 7 days
  },
  {
    kind: "merge-pr",
    title: "Merge ready PR",
    repo: "natb1/example",
    issueNumber: 106,
    prTitle: "Add CSV export to the budget app",
    prUrl: "https://github.com/natb1/example/pull/42",
    prNumber: 42,
    prRepo: "natb1/example",
  },
];
