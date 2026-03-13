// Seed data definitions for normalization acceptance tests.
//
// To activate these in the emulator, add the documents below to the
// `seed-transactions` and `seed-budget-periods` collections in
// budget/seeds/firestore.ts.  The normalized group consists of two
// transactions sharing the same normalizedId ("norm-group-1"):
//
//   - seed-norm-primary  (primary, amount 25.00, budget "food")
//   - seed-norm-secondary (non-primary, amount 12.50, no budget effect)
//
// The primary transaction falls in the food-2025-01-20 budget period,
// so its budget balance can be verified.  The non-primary transaction
// must NOT affect the budget balance.
//
// A new budget period (food-2025-02-03) is included so the primary's
// balance depends only on seed-norm-primary and seed-txn-5/seed-txn-6
// in the same period.

/** Normalized primary transaction -- renders as the visible row. */
export const seedNormPrimary = {
  id: "seed-norm-primary",
  data: {
    institution: "Example Bank",
    account: "Checking",
    description: "CAFE NERO #1234 01/22",
    amount: 25.0,
    note: "",
    category: "Food:Coffee",
    reimbursement: 0,
    budget: "food",
    timestamp: new Date("2025-01-22"),
    statementId: "stmt-2025-01",
    groupId: "household",
    memberEmails: ["test@example.com"],
    normalizedId: "norm-group-1",
    normalizedPrimary: true,
    normalizedDescription: "Cafe Nero",
  },
};

/** Normalized non-primary transaction -- hidden unless the group is expanded. */
export const seedNormSecondary = {
  id: "seed-norm-secondary",
  data: {
    institution: "Example Bank",
    account: "Checking",
    description: "CAFE NERO TIP 01/22",
    amount: 12.5,
    note: "",
    category: "Food:Coffee",
    reimbursement: 0,
    budget: "food",
    timestamp: new Date("2025-01-22"),
    statementId: "stmt-2025-01",
    groupId: "household",
    memberEmails: ["test@example.com"],
    normalizedId: "norm-group-1",
    normalizedPrimary: false,
    normalizedDescription: "Cafe Nero",
  },
};

/**
 * Expected descriptions visible in the original-transactions panel
 * when the normalized group row is expanded.
 */
export const originalDescriptions = [
  seedNormPrimary.data.description,
  seedNormSecondary.data.description,
];

/** The canonical description shown on the collapsed summary row. */
export const canonicalDescription = "Cafe Nero";

/** The amount shown on the summary row (primary transaction amount). */
export const primaryAmount = "25.00";
