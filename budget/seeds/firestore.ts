// Seed data for the budget app's Firestore collections.
// The firestoreutil seed runner writes these specs to Firestore using the Admin SDK,
// which converts Date objects to Timestamps on write.
import type { SeedSpec } from "@commons-systems/firestoreutil/seed";
import type { Transaction, Budget, BudgetPeriod, Rule, NormalizationRule } from "../src/firestore.js";
import type { Group } from "@commons-systems/authutil/groups";

/** Seed groups include `members` (used in queries and security rules, omitted from the authutil Group type) */
type GroupSeedData = Omit<Group, "id"> & { members: string[] };

/** Seed transactions use Date instead of Timestamp and add `memberEmails` for security rules (not present in the client Transaction type) */
type TransactionSeedData = Omit<Transaction, "id" | "timestamp"> & {
  timestamp: Date;
  memberEmails: string[];
};

/** Seed budgets add `memberEmails` for security rules (not present in the client Budget type) */
type BudgetSeedData = Omit<Budget, "id"> & { memberEmails: string[] };

/** Seed budget periods use Date instead of Timestamp and add `memberEmails` for security rules (not present in the client BudgetPeriod type) */
type BudgetPeriodSeedData = Omit<BudgetPeriod, "id" | "periodStart" | "periodEnd"> & {
  periodStart: Date;
  periodEnd: Date;
  memberEmails: string[];
};

/** Seed rules include `memberEmails` for security rules and `groupId` for query filtering */
type RuleSeedData = Omit<Rule, "id"> & { memberEmails: string[] };

type NormalizationRuleSeedData = Omit<NormalizationRule, "id"> & { memberEmails: string[] };

const budgetDocs: { id: string; data: BudgetSeedData }[] = [
  {
    id: "food",
    data: {
      name: "Food",
      weeklyAllowance: 150,
      rollover: "none",
      groupId: "household",
      memberEmails: ["test@example.com"],
    } satisfies BudgetSeedData,
  },
  {
    id: "housing",
    data: {
      name: "Housing",
      weeklyAllowance: 500,
      rollover: "debt",
      groupId: "household",
      memberEmails: ["test@example.com"],
    } satisfies BudgetSeedData,
  },
  {
    id: "vacation",
    data: {
      name: "Vacation",
      weeklyAllowance: 100,
      rollover: "balance",
      groupId: "household",
      memberEmails: ["test@example.com"],
    } satisfies BudgetSeedData,
  },
];

// Budget period totals match the seed net transaction amounts (after reimbursement) within each period.
// Food (rollover: "none"): 3 periods demonstrating weekly reset
// Housing (rollover: "debt"): 1 period (baseline)
// Vacation (rollover: "balance"): 2 periods demonstrating carry-forward
const budgetPeriodDocs: { id: string; data: BudgetPeriodSeedData }[] = [
  {
    id: "food-2025-01-06",
    data: {
      budgetId: "food",
      periodStart: new Date("2025-01-06"),
      periodEnd: new Date("2025-01-13"),
      total: 120,
      count: 2,
      categoryBreakdown: { "Food:Dining": 120 },
      groupId: "household",
      memberEmails: ["test@example.com"],
    } satisfies BudgetPeriodSeedData,
  },
  {
    id: "food-2025-01-13",
    data: {
      budgetId: "food",
      periodStart: new Date("2025-01-13"),
      periodEnd: new Date("2025-01-20"),
      total: 5.75,
      count: 1,
      categoryBreakdown: { "Food:Coffee": 5.75 },
      groupId: "household",
      memberEmails: ["test@example.com"],
    } satisfies BudgetPeriodSeedData,
  },
  {
    id: "food-2025-01-20",
    data: {
      budgetId: "food",
      periodStart: new Date("2025-01-20"),
      periodEnd: new Date("2025-01-27"),
      total: 70,
      count: 3,
      categoryBreakdown: { "Food:Dining": 25, "Food:Coffee": 45 },
      groupId: "household",
      memberEmails: ["test@example.com"],
    } satisfies BudgetPeriodSeedData,
  },
  {
    id: "housing-2025-01-20",
    data: {
      budgetId: "housing",
      periodStart: new Date("2025-01-20"),
      periodEnd: new Date("2025-01-27"),
      total: 142.50,
      count: 1,
      categoryBreakdown: { "Housing:Utilities:Electric": 142.50 },
      groupId: "household",
      memberEmails: ["test@example.com"],
    } satisfies BudgetPeriodSeedData,
  },
  {
    id: "vacation-2025-01-27",
    data: {
      budgetId: "vacation",
      periodStart: new Date("2025-01-27"),
      periodEnd: new Date("2025-02-03"),
      total: 50,
      count: 1,
      categoryBreakdown: { "Travel:Books": 50 },
      groupId: "household",
      memberEmails: ["test@example.com"],
    } satisfies BudgetPeriodSeedData,
  },
  {
    id: "vacation-2025-02-03",
    data: {
      budgetId: "vacation",
      periodStart: new Date("2025-02-03"),
      periodEnd: new Date("2025-02-10"),
      total: 0,
      count: 1,
      categoryBreakdown: { "Travel:Flights": 0 },
      groupId: "household",
      memberEmails: ["test@example.com"],
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
      memberEmails: ["test@example.com"],
      normalizedId: null,
      normalizedPrimary: true,
      normalizedDescription: null,
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
      memberEmails: ["test@example.com"],
      normalizedId: null,
      normalizedPrimary: true,
      normalizedDescription: null,
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
      memberEmails: ["test@example.com"],
      normalizedId: null,
      normalizedPrimary: true,
      normalizedDescription: null,
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
      memberEmails: ["test@example.com"],
      normalizedId: null,
      normalizedPrimary: true,
      normalizedDescription: null,
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
      memberEmails: ["test@example.com"],
      normalizedId: null,
      normalizedPrimary: true,
      normalizedDescription: null,
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
      memberEmails: ["test@example.com"],
      normalizedId: null,
      normalizedPrimary: true,
      normalizedDescription: null,
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
      memberEmails: ["test@example.com"],
      normalizedId: null,
      normalizedPrimary: true,
      normalizedDescription: null,
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
      memberEmails: ["test@example.com"],
      normalizedId: null,
      normalizedPrimary: true,
      normalizedDescription: null,
    } satisfies TransactionSeedData,
  },
  {
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
    } satisfies TransactionSeedData,
  },
  {
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
    } satisfies TransactionSeedData,
  },
];

const seedRuleDocs: { id: string; data: RuleSeedData }[] = [
  {
    id: "cat-restaurant",
    data: {
      type: "categorization",
      pattern: "restaurant",
      target: "Food:Dining",
      priority: 10,
      institution: null,
      account: null,
      groupId: "household",
      memberEmails: ["test@example.com"],
    } satisfies RuleSeedData,
  },
  {
    id: "cat-coffee",
    data: {
      type: "categorization",
      pattern: "coffee",
      target: "Food:Coffee",
      priority: 10,
      institution: null,
      account: null,
      groupId: "household",
      memberEmails: ["test@example.com"],
    } satisfies RuleSeedData,
  },
  {
    id: "cat-electric",
    data: {
      type: "categorization",
      pattern: "electric",
      target: "Housing:Utilities:Electric",
      priority: 10,
      institution: "Example Bank",
      account: "Credit Card",
      groupId: "household",
      memberEmails: ["test@example.com"],
    } satisfies RuleSeedData,
  },
  {
    id: "budget-food",
    data: {
      type: "budget_assignment",
      pattern: "food",
      target: "food",
      priority: 100,
      institution: null,
      account: null,
      groupId: "household",
      memberEmails: ["test@example.com"],
    } satisfies RuleSeedData,
  },
  {
    id: "budget-housing",
    data: {
      type: "budget_assignment",
      pattern: "housing",
      target: "housing",
      priority: 100,
      institution: null,
      account: null,
      groupId: "household",
      memberEmails: ["test@example.com"],
    } satisfies RuleSeedData,
  },
  {
    id: "budget-travel",
    data: {
      type: "budget_assignment",
      pattern: "travel",
      target: "vacation",
      priority: 100,
      institution: "Example Credit Union",
      account: "Savings",
      groupId: "household",
      memberEmails: ["test@example.com"],
    } satisfies RuleSeedData,
  },
];

const seedNormalizationRuleDocs: { id: string; data: NormalizationRuleSeedData }[] = [
  {
    id: "norm-cafe-nero",
    data: {
      pattern: "cafe nero",
      patternType: "substring",
      canonicalDescription: "Cafe Nero",

      dateWindowDays: 7,
      institution: null,
      account: null,
      priority: 10,
      groupId: "household",
      memberEmails: ["test@example.com"],
    } satisfies NormalizationRuleSeedData,
  },
  {
    id: "norm-electric",
    data: {
      pattern: "electric",
      patternType: "substring",
      canonicalDescription: "Electric Utility",

      dateWindowDays: 5,
      institution: "Example Bank",
      account: null,
      priority: 20,
      groupId: "household",
      memberEmails: ["test@example.com"],
    } satisfies NormalizationRuleSeedData,
  },
];

const appSeed: Omit<SeedSpec, "namespace"> = {
  collections: [
    {
      name: "groups",
      testOnly: true,
      documents: [
        {
          id: "household",
          data: {
            name: "household",
            members: ["test@example.com"],
          } satisfies GroupSeedData,
        },
      ],
    },
    {
      name: "seed-transactions",
      convergent: true,
      documents: seedTransactionDocs,
    },
    {
      name: "transactions",
      testOnly: true,
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
            memberEmails: ["test@example.com"],
            normalizedId: null,
            normalizedPrimary: true,
            normalizedDescription: null,
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
            memberEmails: ["test@example.com"],
            normalizedId: null,
            normalizedPrimary: true,
            normalizedDescription: null,
          } satisfies TransactionSeedData,
        },
      ],
    },
    { name: "seed-budgets", convergent: true, documents: budgetDocs },
    { name: "budgets", testOnly: true, documents: budgetDocs },
    { name: "seed-budget-periods", convergent: true, documents: budgetPeriodDocs },
    { name: "budget-periods", testOnly: true, documents: budgetPeriodDocs },
    { name: "seed-rules", convergent: true, documents: seedRuleDocs },
    { name: "rules", testOnly: true, documents: seedRuleDocs },
    { name: "seed-normalization-rules", convergent: true, documents: seedNormalizationRuleDocs },
    { name: "normalization-rules", testOnly: true, documents: seedNormalizationRuleDocs },
  ],
};

export default appSeed;
