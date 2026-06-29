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

const baseBudget = {
  name: "Groceries",
  allowance: 500,
  rollover: "none" as const,
  groupId: "group1",
  memberEmails: MEMBERS,
};

describe("budget budgets", () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    env = await getTestEnv();
  });

  setupCleanup();

  beforeEach(async () => {
    await adminSetDoc(env, `budget/${ENV}/budgets/budget1`, baseBudget);
  });

  describe("read", () => {
    it("allows member to read", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        getDoc(doc(db, `budget/${ENV}/budgets/budget1`)),
      );
    });

    it("denies non-member read", async () => {
      const ctx = authenticatedContext(env, "stranger@test.com");
      const db = ctx.firestore();
      await assertFails(
        getDoc(doc(db, `budget/${ENV}/budgets/budget1`)),
      );
    });

    it("denies unauthenticated read", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertFails(
        getDoc(doc(db, `budget/${ENV}/budgets/budget1`)),
      );
    });
  });

  describe("update - valid changes", () => {
    it("allows updating name", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        updateDoc(doc(db, `budget/${ENV}/budgets/budget1`), {
          name: "Food & Drink",
        }),
      );
    });

    it("allows updating allowance", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        updateDoc(doc(db, `budget/${ENV}/budgets/budget1`), {
          allowance: 600,
        }),
      );
    });

    it("allows allowance of 0", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        updateDoc(doc(db, `budget/${ENV}/budgets/budget1`), {
          allowance: 0,
        }),
      );
    });

    it("allows updating rollover to debt", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        updateDoc(doc(db, `budget/${ENV}/budgets/budget1`), {
          rollover: "debt",
        }),
      );
    });

    it("allows updating rollover to balance", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        updateDoc(doc(db, `budget/${ENV}/budgets/budget1`), {
          rollover: "balance",
        }),
      );
    });

    it("allows adding overrides", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        updateDoc(doc(db, `budget/${ENV}/budgets/budget1`), {
          overrides: [{ period: "2024-01", amount: 700 }],
        }),
      );
    });

    it("allows setting allowancePeriod", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        updateDoc(doc(db, `budget/${ENV}/budgets/budget1`), {
          allowancePeriod: "monthly",
        }),
      );
    });

    it("allows allowancePeriod weekly", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        updateDoc(doc(db, `budget/${ENV}/budgets/budget1`), {
          allowancePeriod: "weekly",
        }),
      );
    });

    it("allows allowancePeriod quarterly", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        updateDoc(doc(db, `budget/${ENV}/budgets/budget1`), {
          allowancePeriod: "quarterly",
        }),
      );
    });
  });

  describe("update - immutable field violations", () => {
    it("denies changing groupId", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/budgets/budget1`), {
          groupId: "group2",
        }),
      );
    });

    it("denies changing memberEmails", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/budgets/budget1`), {
          memberEmails: ["member@test.com"],
        }),
      );
    });
  });

  describe("update - validation violations", () => {
    it("denies empty name", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/budgets/budget1`), { name: "" }),
      );
    });

    it("denies non-string name", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/budgets/budget1`), { name: 123 }),
      );
    });

    it("denies negative allowance", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/budgets/budget1`), {
          allowance: -1,
        }),
      );
    });

    it("denies invalid rollover value", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/budgets/budget1`), {
          rollover: "invalid",
        }),
      );
    });

    it("denies invalid allowancePeriod", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/budgets/budget1`), {
          allowancePeriod: "daily",
        }),
      );
    });

    it("denies extra fields", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/budgets/budget1`), {
          extraField: "nope",
        }),
      );
    });
  });

  describe("create and delete", () => {
    it("denies create", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `budget/${ENV}/budgets/budget2`), baseBudget),
      );
    });

    it("denies delete", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        deleteDoc(doc(db, `budget/${ENV}/budgets/budget1`)),
      );
    });
  });
});
