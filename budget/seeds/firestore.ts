// Seed data for the budget app's Firestore collections.
// The firestoreutil seed runner writes these specs to Firestore using the Admin SDK,
// which converts Date objects to Timestamps on write.
import type { SeedSpec } from "@commons-systems/firestoreutil/seed";
import type { Transaction, Statement, Budget, BudgetPeriod, Rule, NormalizationRule, WeeklyAggregate } from "../src/firestore.js";
import type { Group } from "@commons-systems/authutil/groups";

/** Seed groups include `members` (used in queries and security rules, omitted from the authutil Group type) */
type GroupSeedData = Omit<Group, "id"> & { members: string[] };

/** Seed data types override branded ID fields to plain strings since seed data is written via the Admin SDK,
 *  not consumed through the typed client read path. This applies to all seed types below. */

/** Seed transactions use Date instead of Timestamp and add `memberEmails` for security rules (not present in the client Transaction type). */
type TransactionSeedData = Omit<Transaction, "id" | "timestamp" | "budget" | "statementId" | "groupId"> & {
  timestamp: Date;
  memberEmails: string[];
  budget: string | null;
  statementId: string | null;
  groupId: string | null;
};

/** Seed budgets add `memberEmails` for security rules (not present in the client Budget type) */
type BudgetSeedData = Omit<Budget, "id" | "groupId"> & { memberEmails: string[]; groupId: string | null };

/** Seed budget periods use Date instead of Timestamp and add `memberEmails` for security rules (not present in the client BudgetPeriod type) */
type BudgetPeriodSeedData = Omit<BudgetPeriod, "id" | "periodStart" | "periodEnd" | "budgetId" | "groupId"> & {
  periodStart: Date;
  periodEnd: Date;
  memberEmails: string[];
  budgetId: string;
  groupId: string | null;
};

/** Seed rules include `memberEmails` for security rules and `groupId` for query filtering */
type RuleSeedData = Omit<Rule, "id" | "groupId"> & { memberEmails: string[]; groupId: string | null };

type NormalizationRuleSeedData = Omit<NormalizationRule, "id"> & { memberEmails: string[] };

/** Seed statements use plain string for statementId (not branded), Date instead of Timestamp for lastTransactionDate, require groupId (non-nullable), and add memberEmails for security rules. */
type StatementSeedData = Omit<Statement, "id" | "statementId" | "groupId" | "lastTransactionDate"> & { statementId: string; groupId: string; memberEmails: string[]; lastTransactionDate: Date | null };

/** Seed weekly aggregates use Date instead of Timestamp and add `memberEmails` for security rules (not present in the client WeeklyAggregate type) */
type WeeklyAggregateSeedData = Omit<WeeklyAggregate, "id" | "weekStart" | "groupId"> & {
  weekStart: Date;
  memberEmails: string[];
  groupId: string | null;
};

const budgetDocs: { id: string; data: BudgetSeedData }[] = [
  {
    id: "food",
    data: {
      name: "Food",
      weeklyAllowance: 150,
      allowancePeriod: "weekly",
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
      allowancePeriod: "monthly",
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
      allowancePeriod: "weekly",
      rollover: "balance",
      groupId: "household",
      memberEmails: ["test@example.com"],
    } satisfies BudgetSeedData,
  },
];

// Budget period totals provide realistic spending variation across ~20 weeks.
// Food (rollover: "none"): weekly reset, spending fluctuates around $150 allowance
// Housing (rollover: "debt"): periodic utility bills, spending varies around $500 allowance
// Vacation (rollover: "balance"): carry-forward, intermittent spending against $100 allowance

function weekDate(weekMonday: string): { start: Date; end: Date } {
  const start = new Date(weekMonday);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { start, end };
}

function period(
  id: string,
  budgetId: string,
  weekMonday: string,
  total: number,
  count: number,
  categoryBreakdown: Record<string, number>,
): { id: string; data: BudgetPeriodSeedData } {
  const { start, end } = weekDate(weekMonday);
  return {
    id,
    data: {
      budgetId,
      periodStart: start,
      periodEnd: end,
      total,
      count,
      categoryBreakdown,
      groupId: "household",
      memberEmails: ["test@example.com"],
    } satisfies BudgetPeriodSeedData,
  };
}

const budgetPeriodDocs: { id: string; data: BudgetPeriodSeedData }[] = [
  // --- Food: 20 weeks (Oct 2024 – Feb 2025) ---
  period("food-2024-10-07", "food", "2024-10-07", 130, 3, { "Food:Dining": 90, "Food:Coffee": 40 }),
  period("food-2024-10-14", "food", "2024-10-14", 95, 2, { "Food:Dining": 60, "Food:Coffee": 35 }),
  period("food-2024-10-21", "food", "2024-10-21", 175, 4, { "Food:Dining": 120, "Food:Coffee": 55 }),
  period("food-2024-10-28", "food", "2024-10-28", 110, 2, { "Food:Dining": 80, "Food:Coffee": 30 }),
  period("food-2024-11-04", "food", "2024-11-04", 160, 3, { "Food:Dining": 110, "Food:Coffee": 50 }),
  period("food-2024-11-11", "food", "2024-11-11", 85, 2, { "Food:Dining": 55, "Food:Coffee": 30 }),
  period("food-2024-11-18", "food", "2024-11-18", 200, 5, { "Food:Dining": 140, "Food:Coffee": 60 }),
  period("food-2024-11-25", "food", "2024-11-25", 145, 3, { "Food:Dining": 100, "Food:Coffee": 45 }),
  period("food-2024-12-02", "food", "2024-12-02", 120, 2, { "Food:Dining": 80, "Food:Coffee": 40 }),
  period("food-2024-12-09", "food", "2024-12-09", 190, 4, { "Food:Dining": 130, "Food:Coffee": 60 }),
  period("food-2024-12-16", "food", "2024-12-16", 155, 3, { "Food:Dining": 105, "Food:Coffee": 50 }),
  period("food-2024-12-23", "food", "2024-12-23", 210, 5, { "Food:Dining": 150, "Food:Coffee": 60 }),
  period("food-2024-12-30", "food", "2024-12-30", 75, 2, { "Food:Dining": 50, "Food:Coffee": 25 }),
  period("food-2025-01-06", "food", "2025-01-06", 120, 2, { "Food:Dining": 120 }),
  period("food-2025-01-13", "food", "2025-01-13", 5.75, 1, { "Food:Coffee": 5.75 }),
  period("food-2025-01-20", "food", "2025-01-20", 70, 3, { "Food:Dining": 25, "Food:Coffee": 45 }),
  period("food-2025-01-27", "food", "2025-01-27", 140, 3, { "Food:Dining": 95, "Food:Coffee": 45 }),
  period("food-2025-02-03", "food", "2025-02-03", 165, 4, { "Food:Dining": 115, "Food:Coffee": 50 }),
  period("food-2025-02-10", "food", "2025-02-10", 88, 2, { "Food:Dining": 58, "Food:Coffee": 30 }),
  period("food-2025-02-17", "food", "2025-02-17", 135, 3, { "Food:Dining": 90, "Food:Coffee": 45 }),

  // --- Housing: 20 weeks (Oct 2024 – Feb 2025), rollover: "debt" ---
  period("housing-2024-10-07", "housing", "2024-10-07", 85, 1, { "Housing:Internet": 85 }),
  period("housing-2024-10-14", "housing", "2024-10-14", 45, 1, { "Housing:Supplies": 45 }),
  period("housing-2024-10-21", "housing", "2024-10-21", 142.50, 1, { "Housing:Utilities:Electric": 142.50 }),
  period("housing-2024-10-28", "housing", "2024-10-28", 60, 1, { "Housing:Utilities:Water": 60 }),
  period("housing-2024-11-04", "housing", "2024-11-04", 85, 1, { "Housing:Internet": 85 }),
  period("housing-2024-11-11", "housing", "2024-11-11", 30, 1, { "Housing:Supplies": 30 }),
  period("housing-2024-11-18", "housing", "2024-11-18", 155, 1, { "Housing:Utilities:Electric": 155 }),
  period("housing-2024-11-25", "housing", "2024-11-25", 120, 2, { "Housing:Utilities:Gas": 75, "Housing:Supplies": 45 }),
  period("housing-2024-12-02", "housing", "2024-12-02", 85, 1, { "Housing:Internet": 85 }),
  period("housing-2024-12-09", "housing", "2024-12-09", 65, 1, { "Housing:Utilities:Water": 65 }),
  period("housing-2024-12-16", "housing", "2024-12-16", 180, 1, { "Housing:Utilities:Electric": 180 }),
  period("housing-2024-12-23", "housing", "2024-12-23", 250, 2, { "Housing:Utilities:Gas": 95, "Housing:Insurance": 155 }),
  period("housing-2024-12-30", "housing", "2024-12-30", 40, 1, { "Housing:Supplies": 40 }),
  period("housing-2025-01-06", "housing", "2025-01-06", 85, 1, { "Housing:Internet": 85 }),
  period("housing-2025-01-13", "housing", "2025-01-13", 55, 1, { "Housing:Utilities:Water": 55 }),
  period("housing-2025-01-20", "housing", "2025-01-20", 142.50, 1, { "Housing:Utilities:Electric": 142.50 }),
  period("housing-2025-01-27", "housing", "2025-01-27", 90, 2, { "Housing:Utilities:Gas": 90 }),
  period("housing-2025-02-03", "housing", "2025-02-03", 85, 1, { "Housing:Internet": 85 }),
  period("housing-2025-02-10", "housing", "2025-02-10", 35, 1, { "Housing:Supplies": 35 }),
  period("housing-2025-02-17", "housing", "2025-02-17", 165, 1, { "Housing:Utilities:Electric": 165 }),

  // --- Vacation: 20 weeks (Oct 2024 – Feb 2025), rollover: "balance" ---
  period("vacation-2024-10-07", "vacation", "2024-10-07", 25, 1, { "Travel:Books": 25 }),
  period("vacation-2024-10-14", "vacation", "2024-10-14", 60, 1, { "Travel:Gear": 60 }),
  period("vacation-2024-10-21", "vacation", "2024-10-21", 35, 1, { "Travel:Books": 35 }),
  period("vacation-2024-10-28", "vacation", "2024-10-28", 15, 1, { "Travel:Maps": 15 }),
  period("vacation-2024-11-04", "vacation", "2024-11-04", 0, 0, {}),
  period("vacation-2024-11-11", "vacation", "2024-11-11", 75, 1, { "Travel:Lodging": 75 }),
  period("vacation-2024-11-18", "vacation", "2024-11-18", 45, 1, { "Travel:Gear": 45 }),
  period("vacation-2024-11-25", "vacation", "2024-11-25", 0, 0, {}),
  period("vacation-2024-12-02", "vacation", "2024-12-02", 30, 1, { "Travel:Books": 30 }),
  period("vacation-2024-12-09", "vacation", "2024-12-09", 250, 1, { "Travel:Flights": 250 }),
  period("vacation-2024-12-16", "vacation", "2024-12-16", 80, 1, { "Travel:Lodging": 80 }),
  period("vacation-2024-12-23", "vacation", "2024-12-23", 0, 0, {}),
  period("vacation-2024-12-30", "vacation", "2024-12-30", 40, 1, { "Travel:Gear": 40 }),
  period("vacation-2025-01-06", "vacation", "2025-01-06", 20, 1, { "Travel:Books": 20 }),
  period("vacation-2025-01-13", "vacation", "2025-01-13", 0, 0, {}),
  period("vacation-2025-01-20", "vacation", "2025-01-20", 55, 1, { "Travel:Gear": 55 }),
  period("vacation-2025-01-27", "vacation", "2025-01-27", 50, 1, { "Travel:Books": 50 }),
  period("vacation-2025-02-03", "vacation", "2025-02-03", 150, 2, { "Travel:Flights": 150 }),
  period("vacation-2025-02-10", "vacation", "2025-02-10", 35, 1, { "Travel:Books": 35 }),
  period("vacation-2025-02-17", "vacation", "2025-02-17", 45, 1, { "Travel:Books": 45 }),
];

function txn(
  id: string,
  budget: string | null,
  description: string,
  amount: number,
  category: string,
  dateStr: string,
  overrides?: Partial<TransactionSeedData>,
): { id: string; data: TransactionSeedData } {
  const institution = budget === "vacation" ? "Example Credit Union" : "Example Bank";
  const account = budget === "housing" ? "Credit Card" : budget === "vacation" ? "Savings" : "Checking";
  const stmtMonth = dateStr.slice(0, 7);
  return {
    id,
    data: {
      institution,
      account,
      description,
      amount,
      note: "",
      category,
      reimbursement: 0,
      budget,
      timestamp: new Date(dateStr),
      statementId: `stmt-${stmtMonth}`,
      groupId: "household",
      memberEmails: ["test@example.com"],
      normalizedId: null,
      normalizedPrimary: true,
      normalizedDescription: null,
      ...overrides,
    } satisfies TransactionSeedData,
  };
}

const seedTransactionDocs = [
  // --- Food: 20 weeks (Oct 2024 – Feb 2025) ---
  // food-2024-10-07: total=130, count=3, {Dining:90, Coffee:40}
  txn("seed-f01", "food", "Restaurant", 50, "Food:Dining", "2024-10-07"),
  txn("seed-f02", "food", "Thai Takeout", 40, "Food:Dining", "2024-10-09"),
  txn("seed-f03", "food", "Espresso Bar", 40, "Food:Coffee", "2024-10-11"),
  // food-2024-10-14: total=95, count=2, {Dining:60, Coffee:35}
  txn("seed-f04", "food", "Burger Joint", 60, "Food:Dining", "2024-10-14"),
  txn("seed-f05", "food", "Tea House", 35, "Food:Coffee", "2024-10-17"),
  // food-2024-10-21: total=175, count=4, {Dining:120, Coffee:55}
  txn("seed-f06", "food", "Steakhouse", 65, "Food:Dining", "2024-10-21"),
  txn("seed-f07", "food", "Sushi Bar", 55, "Food:Dining", "2024-10-23"),
  txn("seed-f08", "food", "Cafe", 30, "Food:Coffee", "2024-10-25"),
  txn("seed-f09", "food", "Bakery", 25, "Food:Coffee", "2024-10-26"),
  // food-2024-10-28: total=110, count=2, {Dining:80, Coffee:30}
  txn("seed-f10", "food", "Italian Bistro", 80, "Food:Dining", "2024-10-28"),
  txn("seed-f11", "food", "Espresso Bar", 30, "Food:Coffee", "2024-10-31"),
  // food-2024-11-04: total=160, count=3, {Dining:110, Coffee:50}
  txn("seed-f12", "food", "Pizza Place", 60, "Food:Dining", "2024-11-04"),
  txn("seed-f13", "food", "Taco Stand", 50, "Food:Dining", "2024-11-06"),
  txn("seed-f14", "food", "Tea House", 50, "Food:Coffee", "2024-11-08"),
  // food-2024-11-11: total=85, count=2, {Dining:55, Coffee:30}
  txn("seed-f15", "food", "Deli Lunch", 55, "Food:Dining", "2024-11-11"),
  txn("seed-f16", "food", "Cafe", 30, "Food:Coffee", "2024-11-14"),
  // food-2024-11-18: total=200, count=5, {Dining:140, Coffee:60}
  txn("seed-f17", "food", "Restaurant", 50, "Food:Dining", "2024-11-18"),
  txn("seed-f18", "food", "Indian Curry", 45, "Food:Dining", "2024-11-19"),
  txn("seed-f19", "food", "Burger Joint", 45, "Food:Dining", "2024-11-20"),
  txn("seed-f20", "food", "Bakery", 35, "Food:Coffee", "2024-11-22"),
  txn("seed-f21", "food", "Espresso Bar", 25, "Food:Coffee", "2024-11-23"),
  // food-2024-11-25: total=145, count=3, {Dining:100, Coffee:45}
  txn("seed-f22", "food", "Steakhouse", 55, "Food:Dining", "2024-11-25"),
  txn("seed-f23", "food", "Thai Takeout", 45, "Food:Dining", "2024-11-27"),
  txn("seed-f24", "food", "Tea House", 45, "Food:Coffee", "2024-11-29"),
  // food-2024-12-02: total=120, count=2, {Dining:80, Coffee:40}
  txn("seed-f25", "food", "Sushi Bar", 80, "Food:Dining", "2024-12-02"),
  txn("seed-f26", "food", "Cafe", 40, "Food:Coffee", "2024-12-05"),
  // food-2024-12-09: total=190, count=4, {Dining:130, Coffee:60}
  txn("seed-f27", "food", "Italian Bistro", 70, "Food:Dining", "2024-12-09"),
  txn("seed-f28", "food", "Pizza Place", 60, "Food:Dining", "2024-12-11"),
  txn("seed-f29", "food", "Bakery", 35, "Food:Coffee", "2024-12-13"),
  txn("seed-f30", "food", "Espresso Bar", 25, "Food:Coffee", "2024-12-14"),
  // food-2024-12-16: total=155, count=3, {Dining:105, Coffee:50}
  txn("seed-f31", "food", "Restaurant", 55, "Food:Dining", "2024-12-16"),
  txn("seed-f32", "food", "Taco Stand", 50, "Food:Dining", "2024-12-18"),
  txn("seed-f33", "food", "Tea House", 50, "Food:Coffee", "2024-12-20"),
  // food-2024-12-23: total=210, count=5, {Dining:150, Coffee:60}
  txn("seed-f34", "food", "Steakhouse", 55, "Food:Dining", "2024-12-23"),
  txn("seed-f35", "food", "Indian Curry", 50, "Food:Dining", "2024-12-24"),
  txn("seed-f36", "food", "Deli Lunch", 45, "Food:Dining", "2024-12-26"),
  txn("seed-f37", "food", "Bakery", 35, "Food:Coffee", "2024-12-27"),
  txn("seed-f38", "food", "Cafe", 25, "Food:Coffee", "2024-12-28"),
  // food-2024-12-30: total=75, count=2, {Dining:50, Coffee:25}
  txn("seed-f39", "food", "Burger Joint", 50, "Food:Dining", "2024-12-30"),
  txn("seed-f40", "food", "Espresso Bar", 25, "Food:Coffee", "2025-01-02"),
  // food-2025-01-06: total=120, count=2, {Dining:120}
  txn("seed-f41", "food", "Restaurant", 80, "Food:Dining", "2025-01-07", { note: "dinner" }),
  txn("seed-f42", "food", "Deli Lunch", 40, "Food:Dining", "2025-01-09"),
  // food-2025-01-13: total=5.75, count=1, {Coffee:5.75}
  txn("seed-f43", "food", "Coffee Shop", 5.75, "Food:Coffee", "2025-01-15"),
  // food-2025-01-20: total=70, count=3, {Dining:25, Coffee:45}
  // CAFE NERO primary (25, Food:Coffee) is one of these 3; secondary is extra (not in count)
  txn("seed-f44", "food", "Pizza Delivery", 25, "Food:Dining", "2025-01-21"),
  txn("seed-f45", "food", "Bakery", 20, "Food:Coffee", "2025-01-23"),
  // food-2025-01-27: total=140, count=3, {Dining:95, Coffee:45}
  txn("seed-f46", "food", "Sushi Bar", 50, "Food:Dining", "2025-01-27"),
  txn("seed-f47", "food", "Thai Takeout", 45, "Food:Dining", "2025-01-29"),
  txn("seed-f48", "food", "Tea House", 45, "Food:Coffee", "2025-01-31"),
  // food-2025-02-03: total=165, count=4, {Dining:115, Coffee:50}
  txn("seed-f49", "food", "Italian Bistro", 60, "Food:Dining", "2025-02-03"),
  txn("seed-f50", "food", "Taco Stand", 55, "Food:Dining", "2025-02-05"),
  txn("seed-f51", "food", "Bakery", 30, "Food:Coffee", "2025-02-07"),
  txn("seed-f52", "food", "Espresso Bar", 20, "Food:Coffee", "2025-02-08"),
  // food-2025-02-10: total=88, count=2, {Dining:58, Coffee:30}
  txn("seed-f53", "food", "Burger Joint", 58, "Food:Dining", "2025-02-10"),
  txn("seed-f54", "food", "Cafe", 30, "Food:Coffee", "2025-02-13"),
  // food-2025-02-17: total=135, count=3, {Dining:90, Coffee:45}
  txn("seed-f55", "food", "Restaurant", 50, "Food:Dining", "2025-02-17"),
  txn("seed-f56", "food", "Pizza Place", 40, "Food:Dining", "2025-02-18"),
  txn("seed-f57", "food", "Tea House", 45, "Food:Coffee", "2025-02-19"),

  // --- Housing: 20 weeks (Oct 2024 – Feb 2025) ---
  // housing-2024-10-07: 85, 1, {Internet:85}
  txn("seed-h01", "housing", "Internet Provider", 85, "Housing:Internet", "2024-10-08"),
  // housing-2024-10-14: 45, 1, {Supplies:45}
  txn("seed-h02", "housing", "Hardware Store", 45, "Housing:Supplies", "2024-10-15"),
  // housing-2024-10-21: 142.50, 1, {Electric:142.50}
  txn("seed-h03", "housing", "Electric Company", 142.50, "Housing:Utilities:Electric", "2024-10-22"),
  // housing-2024-10-28: 60, 1, {Water:60}
  txn("seed-h04", "housing", "Water Utility", 60, "Housing:Utilities:Water", "2024-10-29"),
  // housing-2024-11-04: 85, 1, {Internet:85}
  txn("seed-h05", "housing", "Internet Provider", 85, "Housing:Internet", "2024-11-05"),
  // housing-2024-11-11: 30, 1, {Supplies:30}
  txn("seed-h06", "housing", "Home Supply Store", 30, "Housing:Supplies", "2024-11-12"),
  // housing-2024-11-18: 155, 1, {Electric:155}
  txn("seed-h07", "housing", "Electric Company", 155, "Housing:Utilities:Electric", "2024-11-19"),
  // housing-2024-11-25: 120, 2, {Gas:75, Supplies:45}
  txn("seed-h08", "housing", "Gas Company", 75, "Housing:Utilities:Gas", "2024-11-25"),
  txn("seed-h09", "housing", "Hardware Store", 45, "Housing:Supplies", "2024-11-28"),
  // housing-2024-12-02: 85, 1, {Internet:85}
  txn("seed-h10", "housing", "Internet Provider", 85, "Housing:Internet", "2024-12-03"),
  // housing-2024-12-09: 65, 1, {Water:65}
  txn("seed-h11", "housing", "Water Utility", 65, "Housing:Utilities:Water", "2024-12-10"),
  // housing-2024-12-16: 180, 1, {Electric:180}
  txn("seed-h12", "housing", "Electric Company", 180, "Housing:Utilities:Electric", "2024-12-17"),
  // housing-2024-12-23: 250, 2, {Gas:95, Insurance:155}
  txn("seed-h13", "housing", "Gas Company", 95, "Housing:Utilities:Gas", "2024-12-23"),
  txn("seed-h14", "housing", "Home Insurance", 155, "Housing:Insurance", "2024-12-26"),
  // housing-2024-12-30: 40, 1, {Supplies:40}
  txn("seed-h15", "housing", "Hardware Store", 40, "Housing:Supplies", "2024-12-31"),
  // housing-2025-01-06: 85, 1, {Internet:85}
  txn("seed-h16", "housing", "Internet Provider", 85, "Housing:Internet", "2025-01-07"),
  // housing-2025-01-13: 55, 1, {Water:55}
  txn("seed-h17", "housing", "Water Utility", 55, "Housing:Utilities:Water", "2025-01-14"),
  // housing-2025-01-20: 142.50, 1, {Electric:142.50}
  txn("seed-h18", "housing", "Electric Company", 142.50, "Housing:Utilities:Electric", "2025-01-21"),
  // housing-2025-01-27: 90, 2, {Gas:90}
  txn("seed-h19", "housing", "Gas Company", 50, "Housing:Utilities:Gas", "2025-01-27"),
  txn("seed-h20", "housing", "Gas Delivery", 40, "Housing:Utilities:Gas", "2025-01-30"),
  // housing-2025-02-03: 85, 1, {Internet:85}
  txn("seed-h21", "housing", "Internet Provider", 85, "Housing:Internet", "2025-02-04"),
  // housing-2025-02-10: 35, 1, {Supplies:35}
  txn("seed-h22", "housing", "Hardware Store", 35, "Housing:Supplies", "2025-02-11"),
  // housing-2025-02-17: 165, 1, {Electric:165}
  txn("seed-h23", "housing", "Electric Company", 165, "Housing:Utilities:Electric", "2025-02-20"),

  // --- Vacation: 20 weeks (Oct 2024 – Feb 2025) ---
  // vacation-2024-10-07: 25, 1, {Books:25}
  txn("seed-v01", "vacation", "Travel Bookshop", 25, "Travel:Books", "2024-10-09"),
  // vacation-2024-10-14: 60, 1, {Gear:60}
  txn("seed-v02", "vacation", "Outdoor Gear Store", 60, "Travel:Gear", "2024-10-16"),
  // vacation-2024-10-21: 35, 1, {Books:35}
  txn("seed-v03", "vacation", "Travel Guide", 35, "Travel:Books", "2024-10-24"),
  // vacation-2024-10-28: 15, 1, {Maps:15}
  txn("seed-v04", "vacation", "Map Store", 15, "Travel:Maps", "2024-10-30"),
  // vacation-2024-11-11: 75, 1, {Lodging:75}
  txn("seed-v05", "vacation", "Hotel Booking", 75, "Travel:Lodging", "2024-11-13"),
  // vacation-2024-11-18: 45, 1, {Gear:45}
  txn("seed-v06", "vacation", "Travel Gear Shop", 45, "Travel:Gear", "2024-11-21"),
  // vacation-2024-12-02: 30, 1, {Books:30}
  txn("seed-v07", "vacation", "Bookstore", 30, "Travel:Books", "2024-12-04"),
  // vacation-2024-12-09: 250, 1, {Flights:250}
  txn("seed-v08", "vacation", "Flight Booking", 250, "Travel:Flights", "2024-12-12"),
  // vacation-2024-12-16: 80, 1, {Lodging:80}
  txn("seed-v09", "vacation", "Hostel Reservation", 80, "Travel:Lodging", "2024-12-19"),
  // vacation-2024-12-30: 40, 1, {Gear:40}
  txn("seed-v10", "vacation", "Camping Supply", 40, "Travel:Gear", "2025-01-01"),
  // vacation-2025-01-06: 20, 1, {Books:20}
  txn("seed-v11", "vacation", "Travel Bookshop", 20, "Travel:Books", "2025-01-08"),
  // vacation-2025-01-20: 55, 1, {Gear:55}
  txn("seed-v12", "vacation", "Outdoor Gear Store", 55, "Travel:Gear", "2025-01-22"),
  // vacation-2025-01-27: 50, 1, {Books:50}
  txn("seed-v13", "vacation", "Travel Guide", 50, "Travel:Books", "2025-01-30", { note: "trip planning" }),
  // vacation-2025-02-03: 150, 2, {Flights:150} — includes reimbursed Airline Ticket (net 0)
  txn("seed-v14", "vacation", "Flight Booking", 150, "Travel:Flights", "2025-02-04"),
  txn("seed-v15", "vacation", "Airline Ticket", 389, "Travel:Flights", "2025-02-06", {
    reimbursement: 100,
    note: "summer trip",
  }),
  // vacation-2025-02-10: 35, 1, {Books:35}
  txn("seed-v16", "vacation", "Bookstore", 35, "Travel:Books", "2025-02-12"),
  // vacation-2025-02-17: 45, 1, {Books:45}
  txn("seed-v17", "vacation", "Travel Bookshop", 45, "Travel:Books", "2025-02-21"),

  // --- Unbudgeted spending: miscellaneous expenses with no budget assignment ---
  txn("seed-u01", null, "Parking Meter", 8, "Transportation:Parking", "2025-01-14"),
  txn("seed-u02", null, "Dry Cleaner", 22, "Services:Laundry", "2025-02-06"),
  txn("seed-u03", null, "Pharmacy", 15.50, "Health:Pharmacy", "2025-02-18"),

  // --- Transfer:CardPayment: credit card payments (double-counted in spending) ---
  txn("seed-cp01", null, "Card Payment - Visa", 500, "Transfer:CardPayment", "2025-01-10"),
  txn("seed-cp02", null, "Card Payment - Mastercard", 285, "Transfer:CardPayment", "2025-02-10"),
  txn("seed-cp03", null, "Card Payment - Amex", 150, "Transfer:CardPayment:Amex", "2025-02-15"),

  // --- Income: biweekly paycheck + occasional freelance ---
  // These have no budget assignment. Negative amounts represent credits (money in).
  // Biweekly paycheck (every other Friday, $2400)
  txn("seed-i01", null, "Payroll Deposit", -2400, "Income:Salary", "2024-10-11"),
  txn("seed-i02", null, "Payroll Deposit", -2400, "Income:Salary", "2024-10-25"),
  txn("seed-i03", null, "Payroll Deposit", -2400, "Income:Salary", "2024-11-08"),
  txn("seed-i04", null, "Payroll Deposit", -2400, "Income:Salary", "2024-11-22"),
  txn("seed-i05", null, "Payroll Deposit", -2400, "Income:Salary", "2024-12-06"),
  txn("seed-i06", null, "Payroll Deposit", -2400, "Income:Salary", "2024-12-20"),
  txn("seed-i07", null, "Payroll Deposit", -2400, "Income:Salary", "2025-01-03"),
  txn("seed-i08", null, "Freelance Payment", -500, "Income:Freelance", "2025-01-10"),
  txn("seed-i09", null, "Payroll Deposit", -2400, "Income:Salary", "2025-01-17"),
  txn("seed-i10", null, "Payroll Deposit", -2400, "Income:Salary", "2025-01-31"),
  txn("seed-i11", null, "Payroll Deposit", -2400, "Income:Salary", "2025-02-14"),

  // Normalized CAFE NERO pair — in food-2025-01-20 period (primary counts toward period total)
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
      minAmount: null,
      maxAmount: null,
      excludeCategory: null,
      matchCategory: null,
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
      minAmount: null,
      maxAmount: null,
      excludeCategory: null,
      matchCategory: null,
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
      minAmount: null,
      maxAmount: null,
      excludeCategory: null,
      matchCategory: null,
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
      minAmount: null,
      maxAmount: null,
      excludeCategory: null,
      matchCategory: null,
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
      minAmount: null,
      maxAmount: null,
      excludeCategory: null,
      matchCategory: null,
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
      minAmount: null,
      maxAmount: null,
      excludeCategory: null,
      matchCategory: null,
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

const seedStatementDocs: { id: string; data: StatementSeedData }[] = [
  {
    id: "stmt-checking-2025-01",
    data: {
      statementId: "Example Bank-Checking-2025-01",
      institution: "Example Bank",
      account: "Checking",
      balance: 2286.00,
      period: "2025-01",
      balanceDate: null,
      lastTransactionDate: new Date("2025-02-19"),
      groupId: "household",
      memberEmails: ["test@example.com"],
    } satisfies StatementSeedData,
  },
  {
    id: "stmt-checking-2025-02",
    data: {
      statementId: "Example Bank-Checking-2025-02",
      institution: "Example Bank",
      account: "Checking",
      balance: 3825.50,
      period: "2025-02",
      balanceDate: null,
      lastTransactionDate: new Date("2025-02-19"),
      groupId: "household",
      memberEmails: ["test@example.com"],
    } satisfies StatementSeedData,
  },
  {
    id: "stmt-cc-2025-01",
    data: {
      statementId: "Example Bank-Credit Card-2025-01",
      institution: "Example Bank",
      account: "Credit Card",
      balance: 0,
      period: "2025-01",
      balanceDate: null,
      lastTransactionDate: new Date("2025-02-20"),
      groupId: "household",
      memberEmails: ["test@example.com"],
    } satisfies StatementSeedData,
  },
  {
    id: "stmt-cc-2025-02",
    data: {
      statementId: "Example Bank-Credit Card-2025-02",
      institution: "Example Bank",
      account: "Credit Card",
      balance: -285.00,
      period: "2025-02",
      balanceDate: null,
      lastTransactionDate: new Date("2025-02-20"),
      groupId: "household",
      memberEmails: ["test@example.com"],
    } satisfies StatementSeedData,
  },
  {
    id: "stmt-savings-2025-01",
    data: {
      statementId: "Example Credit Union-Savings-2025-01",
      institution: "Example Credit Union",
      account: "Savings",
      balance: 1210.00,
      period: "2025-01",
      balanceDate: null,
      lastTransactionDate: new Date("2025-02-21"),
      groupId: "household",
      memberEmails: ["test@example.com"],
    } satisfies StatementSeedData,
  },
  {
    id: "stmt-savings-2025-02",
    data: {
      statementId: "Example Credit Union-Savings-2025-02",
      institution: "Example Credit Union",
      account: "Savings",
      balance: 980.00,
      period: "2025-02",
      balanceDate: null,
      lastTransactionDate: new Date("2025-02-21"),
      groupId: "household",
      memberEmails: ["test@example.com"],
    } satisfies StatementSeedData,
  },
];

// Weekly aggregates: pre-computed credit and unbudgeted spending totals per Monday-aligned week.
// Derived from seed transactions using the same logic as the ETL:
//   creditTotal: sum of -net for credit transactions (net < 0, not Transfer:CardPayment*)
//   unbudgetedTotal: sum of net for unbudgeted spending (budget == null, net > 0)
// Only weeks with non-zero creditTotal or unbudgetedTotal are included.
const weeklyAggregateDocs: { id: string; data: WeeklyAggregateSeedData }[] = [
  // Biweekly paycheck weeks (each $2400 credit)
  { id: "household-2024-10-07", data: { weekStart: new Date("2024-10-07"), creditTotal: 2400, unbudgetedTotal: 0, groupId: "household", memberEmails: ["test@example.com"] } },
  { id: "household-2024-10-21", data: { weekStart: new Date("2024-10-21"), creditTotal: 2400, unbudgetedTotal: 0, groupId: "household", memberEmails: ["test@example.com"] } },
  { id: "household-2024-11-04", data: { weekStart: new Date("2024-11-04"), creditTotal: 2400, unbudgetedTotal: 0, groupId: "household", memberEmails: ["test@example.com"] } },
  { id: "household-2024-11-18", data: { weekStart: new Date("2024-11-18"), creditTotal: 2400, unbudgetedTotal: 0, groupId: "household", memberEmails: ["test@example.com"] } },
  { id: "household-2024-12-02", data: { weekStart: new Date("2024-12-02"), creditTotal: 2400, unbudgetedTotal: 0, groupId: "household", memberEmails: ["test@example.com"] } },
  { id: "household-2024-12-16", data: { weekStart: new Date("2024-12-16"), creditTotal: 2400, unbudgetedTotal: 0, groupId: "household", memberEmails: ["test@example.com"] } },
  { id: "household-2024-12-30", data: { weekStart: new Date("2024-12-30"), creditTotal: 2400, unbudgetedTotal: 0, groupId: "household", memberEmails: ["test@example.com"] } },
  // Credit: $500 freelance. Unbudgeted: $500 card payment.
  { id: "household-2025-01-06", data: { weekStart: new Date("2025-01-06"), creditTotal: 500, unbudgetedTotal: 500, groupId: "household", memberEmails: ["test@example.com"] } },
  // Paycheck $2400 + parking $8 unbudgeted
  { id: "household-2025-01-13", data: { weekStart: new Date("2025-01-13"), creditTotal: 2400, unbudgetedTotal: 8, groupId: "household", memberEmails: ["test@example.com"] } },
  // Paycheck $2400
  { id: "household-2025-01-27", data: { weekStart: new Date("2025-01-27"), creditTotal: 2400, unbudgetedTotal: 0, groupId: "household", memberEmails: ["test@example.com"] } },
  // Dry cleaner $22 unbudgeted
  { id: "household-2025-02-03", data: { weekStart: new Date("2025-02-03"), creditTotal: 0, unbudgetedTotal: 22, groupId: "household", memberEmails: ["test@example.com"] } },
  // Credit: $2400 paycheck. Unbudgeted: $285 + $150 card payments = $435.
  { id: "household-2025-02-10", data: { weekStart: new Date("2025-02-10"), creditTotal: 2400, unbudgetedTotal: 435, groupId: "household", memberEmails: ["test@example.com"] } },
  // Pharmacy $15.50 unbudgeted
  { id: "household-2025-02-17", data: { weekStart: new Date("2025-02-17"), creditTotal: 0, unbudgetedTotal: 15.50, groupId: "household", memberEmails: ["test@example.com"] } },
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
    { name: "seed-statements", convergent: true, documents: seedStatementDocs },
    { name: "statements", testOnly: true, documents: seedStatementDocs },
    { name: "seed-weekly-aggregates", convergent: true, documents: weeklyAggregateDocs },
    { name: "weekly-aggregates", testOnly: true, documents: weeklyAggregateDocs },
  ],
};

export default appSeed;
