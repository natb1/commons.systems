// Seed data definitions for normalization acceptance tests.
//
// To activate these in the emulator, add the documents below to the
// `seed-transactions` and `seed-budget-periods` collections in
// budget/seeds/firestore.ts.  The normalized group consists of two
// transactions sharing the same normalizedId ("norm-group-1"):
//
//   - seed-norm-primary  (primary, amount 25.00, stmt-2025-01)
//   - seed-norm-secondary (non-primary, amount 25.00, stmt-2025-02)
//
// Both represent the same real-world transaction appearing in overlapping
// statement periods.  The primary transaction falls in the food-2025-01-20
// budget period.  The non-primary must NOT affect the budget balance.

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
    description: "CAFE NERO 01/22 DEBIT CARD",
    amount: 25.0,
    note: "",
    category: "Food:Coffee",
    reimbursement: 0,
    budget: "food",
    timestamp: new Date("2025-01-22"),
    statementId: "stmt-2025-02",
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
