// Seed data for the budget app's Firestore collections.
// The firestoreutil seed runner writes these specs to Firestore using the Admin SDK,
// which converts Date objects to Timestamps on write.
import type { SeedSpec } from "@commons-systems/firestoreutil/seed";
import type { Transaction, Budget, BudgetPeriod } from "../src/firestore.js";
import type { Group } from "@commons-systems/authutil/groups";

/** Seed groups include `members` (used in queries and security rules, omitted from the authutil Group type) */
type GroupSeedData = Omit<Group, "id"> & { members: string[] };

/** Seed transactions use Date instead of Timestamp and add `memberUids` for security rules (not present in the client Transaction type) */
type TransactionSeedData = Omit<Transaction, "id" | "timestamp"> & {
  timestamp: Date;
  memberUids: string[];
};

/** Seed budgets add `memberUids` for security rules (not present in the client Budget type) */
type BudgetSeedData = Omit<Budget, "id"> & { memberUids: string[] };

/** Seed budget periods use Date instead of Timestamp and add `memberUids` for security rules (not present in the client BudgetPeriod type) */
type BudgetPeriodSeedData = Omit<BudgetPeriod, "id" | "periodStart" | "periodEnd"> & {
  periodStart: Date;
  periodEnd: Date;
  memberUids: string[];
};

const budgetDocs: { id: string; data: BudgetSeedData }[] = [
  {
    id: "food",
    data: {
      name: "Food",
      weeklyAllowance: 150,
      rollover: "none",
      groupId: "household",
      memberUids: ["test-github-user"],
    } satisfies BudgetSeedData,
  },
  {
    id: "housing",
    data: {
      name: "Housing",
      weeklyAllowance: 500,
      rollover: "balance",
      groupId: "household",
      memberUids: ["test-github-user"],
    } satisfies BudgetSeedData,
  },
  {
    id: "vacation",
    data: {
      name: "Vacation",
      weeklyAllowance: 100,
      rollover: "balance",
      groupId: "household",
      memberUids: ["test-github-user"],
    } satisfies BudgetSeedData,
  },
];

// Budget period totals match the seed transaction amounts within each period.
// Food (rollover: "none"): 3 periods demonstrating weekly reset
// Housing (rollover: "balance"): 1 period (baseline)
// Vacation (rollover: "balance"): 2 periods demonstrating carry-forward
const budgetPeriodDocs: { id: string; data: BudgetPeriodSeedData }[] = [
  {
    id: "food-2025-01-06",
    data: {
      budgetId: "food",
      periodStart: new Date("2025-01-06"),
      periodEnd: new Date("2025-01-13"),
      total: 120,
      groupId: "household",
      memberUids: ["test-github-user"],
    } satisfies BudgetPeriodSeedData,
  },
  {
    id: "food-2025-01-13",
    data: {
      budgetId: "food",
      periodStart: new Date("2025-01-13"),
      periodEnd: new Date("2025-01-20"),
      total: 5.75,
      groupId: "household",
      memberUids: ["test-github-user"],
    } satisfies BudgetPeriodSeedData,
  },
  {
    id: "food-2025-01-20",
    data: {
      budgetId: "food",
      periodStart: new Date("2025-01-20"),
      periodEnd: new Date("2025-01-27"),
      total: 45,
      groupId: "household",
      memberUids: ["test-github-user"],
    } satisfies BudgetPeriodSeedData,
  },
  {
    id: "housing-2025-01-20",
    data: {
      budgetId: "housing",
      periodStart: new Date("2025-01-20"),
      periodEnd: new Date("2025-01-27"),
      total: 142.50,
      groupId: "household",
      memberUids: ["test-github-user"],
    } satisfies BudgetPeriodSeedData,
  },
  {
    id: "vacation-2025-01-27",
    data: {
      budgetId: "vacation",
      periodStart: new Date("2025-01-27"),
      periodEnd: new Date("2025-02-03"),
      total: 50,
      groupId: "household",
      memberUids: ["test-github-user"],
    } satisfies BudgetPeriodSeedData,
  },
  {
    id: "vacation-2025-02-03",
    data: {
      budgetId: "vacation",
      periodStart: new Date("2025-02-03"),
      periodEnd: new Date("2025-02-10"),
      total: 389.00,
      groupId: "household",
      memberUids: ["test-github-user"],
    } satisfies BudgetPeriodSeedData,
  },
];

const seedTransactionDocs = [
  {
    id: "seed-txn-1",
    data: {
      institution: "Example Bank",
      account: "Checking",
      description: "Restaurant",
      amount: 80,
      note: "dinner",
      category: "Food:Dining",
      reimbursement: 0,
      budget: "food",
      timestamp: new Date("2025-01-07"),
      statementId: "stmt-2025-01",
      groupId: "household",
      memberUids: ["test-github-user"],
    } satisfies TransactionSeedData,
  },
  {
    id: "seed-txn-2",
    data: {
      institution: "Example Bank",
      account: "Checking",
      description: "Deli Lunch",
      amount: 40,
      note: "",
      category: "Food:Dining",
      reimbursement: 0,
      budget: "food",
      timestamp: new Date("2025-01-09"),
      statementId: "stmt-2025-01",
      groupId: "household",
      memberUids: ["test-github-user"],
    } satisfies TransactionSeedData,
  },
  {
    id: "seed-txn-3",
    data: {
      institution: "Example Bank",
      account: "Checking",
      description: "Coffee Shop",
      amount: 5.75,
      note: "",
      category: "Food:Coffee",
      reimbursement: 0,
      budget: "food",
      timestamp: new Date("2025-01-15"),
      statementId: "stmt-2025-01",
      groupId: "household",
      memberUids: ["test-github-user"],
    } satisfies TransactionSeedData,
  },
  {
    id: "seed-txn-4",
    data: {
      institution: "Example Bank",
      account: "Credit Card",
      description: "Electric Company",
      amount: 142.50,
      note: "monthly bill",
      category: "Housing:Utilities:Electric",
      reimbursement: 0,
      budget: "housing",
      timestamp: new Date("2025-01-20"),
      statementId: "stmt-2025-01",
      groupId: "household",
      memberUids: ["test-github-user"],
    } satisfies TransactionSeedData,
  },
  {
    id: "seed-txn-5",
    data: {
      institution: "Example Bank",
      account: "Checking",
      description: "Pizza Delivery",
      amount: 25,
      note: "",
      category: "Food:Dining",
      reimbursement: 0,
      budget: "food",
      timestamp: new Date("2025-01-21"),
      statementId: "stmt-2025-01",
      groupId: "household",
      memberUids: ["test-github-user"],
    } satisfies TransactionSeedData,
  },
  {
    id: "seed-txn-6",
    data: {
      institution: "Example Bank",
      account: "Checking",
      description: "Bakery",
      amount: 20,
      note: "",
      category: "Food:Coffee",
      reimbursement: 0,
      budget: "food",
      timestamp: new Date("2025-01-23"),
      statementId: "stmt-2025-01",
      groupId: "household",
      memberUids: ["test-github-user"],
    } satisfies TransactionSeedData,
  },
  {
    id: "seed-txn-7",
    data: {
      institution: "Example Credit Union",
      account: "Savings",
      description: "Travel Guide",
      amount: 50,
      note: "trip planning",
      category: "Travel:Books",
      reimbursement: 0,
      budget: "vacation",
      timestamp: new Date("2025-01-30"),
      statementId: "stmt-2025-01",
      groupId: "household",
      memberUids: ["test-github-user"],
    } satisfies TransactionSeedData,
  },
  {
    id: "seed-txn-8",
    data: {
      institution: "Example Credit Union",
      account: "Savings",
      description: "Airline Ticket",
      amount: 389.00,
      note: "summer trip",
      category: "Travel:Flights",
      reimbursement: 100,
      budget: "vacation",
      timestamp: new Date("2025-02-05"),
      statementId: "stmt-2025-02",
      groupId: "household",
      memberUids: ["test-github-user"],
    } satisfies TransactionSeedData,
  },
];

const appSeed: Omit<SeedSpec, "namespace"> = {
  collections: [
    {
      name: "groups",
      documents: [
        {
          id: "household",
          data: {
            name: "household",
            members: ["test-github-user"],
          } satisfies GroupSeedData,
        },
      ],
    },
    {
      name: "seed-transactions",
      documents: seedTransactionDocs,
    },
    {
      name: "transactions",
      documents: [
        {
          id: "user-txn-1",
          data: {
            institution: "First National",
            account: "Checking",
            description: "Grocery Store",
            amount: 67.23,
            note: "",
            category: "Food:Groceries",
            reimbursement: 0,
            budget: "food",
            timestamp: new Date("2025-02-10"),
            statementId: "stmt-2025-02",
            groupId: "household",
            memberUids: ["test-github-user"],
          } satisfies TransactionSeedData,
        },
        {
          id: "user-txn-2",
          data: {
            institution: "First National",
            account: "Credit Card",
            description: "Hotel Stay",
            amount: 215.00,
            note: "conference",
            category: "Travel:Lodging",
            reimbursement: 50,
            budget: null,
            timestamp: new Date("2025-02-15"),
            statementId: null,
            groupId: "household",
            memberUids: ["test-github-user"],
          } satisfies TransactionSeedData,
        },
      ],
    },
    { name: "seed-budgets", documents: budgetDocs },
    { name: "budgets", documents: budgetDocs },
    { name: "seed-budget-periods", documents: budgetPeriodDocs },
    { name: "budget-periods", documents: budgetPeriodDocs },
  ],
};

export default appSeed;
