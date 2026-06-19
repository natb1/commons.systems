// Seed data for the office-hours app's Firestore `items` collection.
// The firestoreutil seed runner writes these specs to Firestore using the Admin SDK,
// which converts Date objects to Timestamps on write.
// The reminders are reused from src/seed-reminders.ts so the seeded owner-tier
// data matches the bundled demo data shown to unauthenticated visitors.
import type { SeedSpec } from "@commons-systems/firestoreutil/seed";
import { TEST_USER } from "@commons-systems/authutil/seed";
import { seedReminders } from "../src/seed-reminders.js";

/** Date is used instead of Timestamp because the Admin SDK converts on write. */
interface ReminderSeedData {
  kind: "reminder";
  jitKey: string;
  title: string;
  repo: string;
  issueNumber: number;
  dueAt: Date;
  memberEmails: string[];
  updatedAt: Date;
}

/** Mirrors the merge-pr doc shape written by the syncOfficeHours Function
 * (functions/src/office-hours-sync.ts). */
interface MergePrSeedData {
  kind: "merge-pr";
  title: string;
  repo: string;
  issueNumber: number;
  prTitle: string;
  prUrl: string;
  prNumber: number;
  prRepo: string;
  memberEmails: string[];
  updatedAt: Date;
}

type ItemSeedData = ReminderSeedData | MergePrSeedData;

const now = Date.now();

// Branch on the discriminated-union kind: reminders are keyed by jitKey and carry a
// computed dueAt; merge-pr items are keyed by `merge-pr-<prNumber>` (matching the sync
// Function's docId scheme) and carry the PR fields the data adapter validates.
const itemDocs: { id: string; data: ItemSeedData }[] = seedReminders.map((r) =>
  r.kind === "merge-pr"
    ? {
        id: `merge-pr-${r.prNumber}`,
        data: {
          kind: "merge-pr",
          title: r.title,
          repo: r.repo,
          issueNumber: r.issueNumber,
          prTitle: r.prTitle,
          prUrl: r.prUrl,
          prNumber: r.prNumber,
          prRepo: r.prRepo,
          memberEmails: [TEST_USER.email],
          updatedAt: new Date(now),
        } satisfies MergePrSeedData,
      }
    : {
        id: r.jitKey,
        data: {
          kind: "reminder",
          jitKey: r.jitKey,
          title: r.title,
          repo: r.repo,
          issueNumber: r.issueNumber,
          dueAt: new Date(now + r.dueInMinutes * 60000),
          memberEmails: [TEST_USER.email],
          updatedAt: new Date(now),
        } satisfies ReminderSeedData,
      },
);

// convergent: true — the seed spec is authoritative for the ephemeral preview/qa/emulator
// namespace; any stale items left from a previous run are deleted.
// Not testOnly: run-qa-server.sh does not pass SEED_TEST_ONLY, so the owner tier must seed
// unconditionally. run-seed never targets prod — prod's items come from the sync Function.
const appSeed: Omit<SeedSpec, "namespace"> = {
  collections: [
    { name: "items", convergent: true, documents: itemDocs },
  ],
};

export default appSeed;
