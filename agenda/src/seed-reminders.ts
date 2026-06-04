export interface SeedReminder {
  jitKey: string;
  title: string;
  repo: string;
  issueNumber: number;
  /** Signed offset from "now" in minutes: negative = overdue, positive = due in the future. */
  dueInMinutes: number;
}

export const seedReminders: SeedReminder[] = [
  {
    jitKey: "jit:weekly-review",
    title: "Weekly review",
    repo: "natb1/example",
    issueNumber: 101,
    dueInMinutes: -240, // overdue 4h
  },
  {
    jitKey: "jit:monthly-retro",
    title: "Monthly retrospective",
    repo: "natb1/example",
    issueNumber: 102,
    dueInMinutes: -60, // overdue 1h
  },
  {
    jitKey: "jit:triage-inbox",
    title: "Triage inbox",
    repo: "natb1/example",
    issueNumber: 103,
    dueInMinutes: 180, // due in 3h
  },
  {
    jitKey: "jit:roadmap-update",
    title: "Update roadmap",
    repo: "natb1/example",
    issueNumber: 104,
    dueInMinutes: 2880, // due in 2 days
  },
  {
    jitKey: "jit:dependency-audit",
    title: "Audit dependencies",
    repo: "natb1/example",
    issueNumber: 105,
    dueInMinutes: 10080, // due in 7 days
  },
];
