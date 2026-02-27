import type { SeedSpec } from "@commons-systems/firestoreutil/seed";

const appSeed: Omit<SeedSpec, "namespace"> = {
  collections: [
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
            vacation: false,
          },
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
            vacation: false,
          },
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
            vacation: true,
          },
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
            vacation: false,
            uid: "test-github-user",
          },
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
            vacation: false,
            uid: "test-github-user",
          },
        },
      ],
    },
  ],
};

export default appSeed;
