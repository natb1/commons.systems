import { describe, it, beforeAll, beforeEach } from "vitest";
import { assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import {
  getTestEnv,
  authenticatedContext,
  unauthenticatedContext,
  adminSetDoc,
  setupCleanup,
} from "../setup.js";

const ENV = "test";
const MEMBERS = ["member@test.com", "other@test.com"];

const baseTxn = {
  institution: "Bank",
  account: "Checking",
  description: "Coffee shop",
  amount: -4.5,
  timestamp: "2024-01-15",
  statementId: "stmt1",
  groupId: "group1",
  memberEmails: MEMBERS,
  note: "",
  category: "food",
  budget: null,
  reimbursement: 0,
};

describe("budget transactions", () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    env = await getTestEnv();
  });

  setupCleanup();

  beforeEach(async () => {
    await adminSetDoc(env, `budget/${ENV}/transactions/txn1`, baseTxn);
  });

  describe("read", () => {
    it("allows member to read", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        getDoc(doc(db, `budget/${ENV}/transactions/txn1`)),
      );
    });

    it("denies non-member read", async () => {
      const ctx = authenticatedContext(env, "stranger@test.com");
      const db = ctx.firestore();
      await assertFails(
        getDoc(doc(db, `budget/${ENV}/transactions/txn1`)),
      );
    });

    it("denies unauthenticated read", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertFails(
        getDoc(doc(db, `budget/${ENV}/transactions/txn1`)),
      );
    });
  });

  describe("update - mutable fields", () => {
    it("allows updating note", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        updateDoc(doc(db, `budget/${ENV}/transactions/txn1`), {
          note: "Updated note",
        }),
      );
    });

    it("allows updating category", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        updateDoc(doc(db, `budget/${ENV}/transactions/txn1`), {
          category: "dining",
        }),
      );
    });

    it("allows updating budget", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        updateDoc(doc(db, `budget/${ENV}/transactions/txn1`), {
          budget: "groceries",
        }),
      );
    });

    it("allows setting budget to null", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        updateDoc(doc(db, `budget/${ENV}/transactions/txn1`), {
          budget: null,
        }),
      );
    });

    it("allows updating reimbursement within range", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        updateDoc(doc(db, `budget/${ENV}/transactions/txn1`), {
          reimbursement: 50,
        }),
      );
    });

    it("allows reimbursement at 0", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        updateDoc(doc(db, `budget/${ENV}/transactions/txn1`), {
          reimbursement: 0,
        }),
      );
    });

    it("allows reimbursement at 100", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        updateDoc(doc(db, `budget/${ENV}/transactions/txn1`), {
          reimbursement: 100,
        }),
      );
    });

    it("allows updating normalization fields", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        updateDoc(doc(db, `budget/${ENV}/transactions/txn1`), {
          normalizedId: "norm1",
          normalizedPrimary: true,
          normalizedDescription: "Coffee",
        }),
      );
    });

    it("allows null normalization fields", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        updateDoc(doc(db, `budget/${ENV}/transactions/txn1`), {
          normalizedId: null,
          normalizedDescription: null,
        }),
      );
    });
  });

  describe("update - immutable field violations", () => {
    it("denies changing institution", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/transactions/txn1`), {
          institution: "Other Bank",
        }),
      );
    });

    it("denies changing account", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/transactions/txn1`), {
          account: "Savings",
        }),
      );
    });

    it("denies changing description", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/transactions/txn1`), {
          description: "Changed",
        }),
      );
    });

    it("denies changing amount", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/transactions/txn1`), {
          amount: -10,
        }),
      );
    });

    it("denies changing timestamp", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/transactions/txn1`), {
          timestamp: "2024-02-01",
        }),
      );
    });

    it("denies changing statementId", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/transactions/txn1`), {
          statementId: "stmt2",
        }),
      );
    });

    it("denies changing groupId", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/transactions/txn1`), {
          groupId: "group2",
        }),
      );
    });

    it("denies changing memberEmails", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/transactions/txn1`), {
          memberEmails: ["member@test.com"],
        }),
      );
    });
  });

  describe("update - type/range violations", () => {
    it("denies reimbursement below 0", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/transactions/txn1`), {
          reimbursement: -1,
        }),
      );
    });

    it("denies reimbursement above 100", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/transactions/txn1`), {
          reimbursement: 101,
        }),
      );
    });

    it("denies non-string note", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/transactions/txn1`), {
          note: 123,
        }),
      );
    });

    it("denies non-string category", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/transactions/txn1`), {
          category: 123,
        }),
      );
    });

    it("denies extra fields", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/transactions/txn1`), {
          extraField: "not allowed",
        }),
      );
    });
  });

  describe("update - non-member denied", () => {
    it("denies non-member update", async () => {
      const ctx = authenticatedContext(env, "stranger@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/transactions/txn1`), {
          note: "hack",
        }),
      );
    });
  });

  describe("create and delete", () => {
    it("denies create", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `budget/${ENV}/transactions/txn2`), baseTxn),
      );
    });

    it("denies delete", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        deleteDoc(doc(db, `budget/${ENV}/transactions/txn1`)),
      );
    });
  });
});
