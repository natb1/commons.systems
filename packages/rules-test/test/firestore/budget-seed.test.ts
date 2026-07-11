import { describeDeniedBudgetCollection } from "../setup.js";

// The budget seed-* collections were formerly public read-only example data
// (`allow read: if true`). They were pruned with the rest of the legacy budget
// Firestore surface (tactic-firebase-rules-residue-prune): budget is local-first
// and seeds are baked into the client bundle at build time
// (budget/src/vite-plugin-seed-data.ts), not fetched from Firestore at runtime.
// Assert every seed collection is now fully denied — this pins the pruned
// (formerly world-readable) surface closed rather than deleting its coverage.
const seedCollections = [
  "seed-transactions",
  "seed-statement-items",
  "seed-reconciliation-notes",
  "seed-budgets",
  "seed-statements",
  "seed-budget-periods",
  "seed-normalization-rules",
  "seed-rules",
  "seed-weekly-aggregates",
  "seed-accounts",
  "seed-journal-entries",
  "seed-journal-legs",
  "seed-reconciliation-events",
];

for (const collection of seedCollections) {
  describeDeniedBudgetCollection(collection);
}
