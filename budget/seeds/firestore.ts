// Seed data for the budget app's Firestore collections.
// The firestoreutil seed runner writes these specs to Firestore using the Admin SDK,
// which converts Date objects to Timestamps on write.
import type { SeedSpec } from "@commons-systems/firestoreutil/seed";
import type { Transaction, Group } from "../src/firestore.js";

/** Seed groups include `members` (used in queries and security rules, not mapped to the client Group type) */
type GroupSeedData = Omit<Group, "id"> & { members: string[] };

/** Seed transactions use Date instead of Timestamp and add `memberUids` for security rules (not present in the client Transaction type) */
type TransactionSeedData = Omit<Transaction, "id" | "timestamp"> & {
  timestamp: Date;
  memberUids: string[];
};

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
      documents: [
        {
          id: "seed-txn-1",
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
          id: "seed-txn-2",
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
          id: "seed-txn-3",
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
      ],
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
  ],
};

export default appSeed;
