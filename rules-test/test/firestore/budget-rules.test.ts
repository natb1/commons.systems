import { describe, it, beforeAll, beforeEach } from "vitest";
import { assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  getTestEnv,
  authenticatedContext,
  unauthenticatedContext,
  adminSetDoc,
  setupCleanup,
} from "../setup.js";

const ENV = "test";
const MEMBERS = ["member@test.com", "other@test.com"];

const baseRule = {
  type: "categorization",
  pattern: "GROCERY",
  target: "groceries",
  priority: 1,
  groupId: "group1",
  memberEmails: MEMBERS,
};

describe("budget rules", () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    env = await getTestEnv();
  });

  setupCleanup();

  beforeEach(async () => {
    await adminSetDoc(env, `budget/${ENV}/groups/group1`, {
      members: MEMBERS,
    });
    await adminSetDoc(env, `budget/${ENV}/rules/rule1`, baseRule);
  });

  describe("read", () => {
    it("allows member to read", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        getDoc(doc(db, `budget/${ENV}/rules/rule1`)),
      );
    });

    it("denies non-member read", async () => {
      const ctx = authenticatedContext(env, "stranger@test.com");
      const db = ctx.firestore();
      await assertFails(getDoc(doc(db, `budget/${ENV}/rules/rule1`)));
    });

    it("denies unauthenticated read", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertFails(getDoc(doc(db, `budget/${ENV}/rules/rule1`)));
    });
  });

  describe("create", () => {
    it("allows member to create categorization rule", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        setDoc(doc(db, `budget/${ENV}/rules/rule2`), {
          type: "categorization",
          pattern: "AMAZON",
          target: "shopping",
          priority: 2,
          groupId: "group1",
          memberEmails: MEMBERS,
        }),
      );
    });

    it("allows member to create budget_assignment rule", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        setDoc(doc(db, `budget/${ENV}/rules/rule2`), {
          type: "budget_assignment",
          pattern: "GROCERY",
          target: "food-budget",
          priority: 1,
          groupId: "group1",
          memberEmails: MEMBERS,
        }),
      );
    });

    it("allows optional fields on create", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        setDoc(doc(db, `budget/${ENV}/rules/rule2`), {
          type: "categorization",
          pattern: "TEST",
          target: "test-cat",
          priority: 1,
          institution: "Bank",
          account: "Checking",
          minAmount: 10,
          maxAmount: 100,
          excludeCategory: "transfer",
          matchCategory: "food",
          groupId: "group1",
          memberEmails: MEMBERS,
        }),
      );
    });

    it("denies create with invalid type", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `budget/${ENV}/rules/rule2`), {
          ...baseRule,
          type: "invalid",
        }),
      );
    });

    it("denies create with empty target", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `budget/${ENV}/rules/rule2`), {
          ...baseRule,
          target: "",
        }),
      );
    });

    it("denies create with mismatched memberEmails", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `budget/${ENV}/rules/rule2`), {
          ...baseRule,
          memberEmails: ["member@test.com"],
        }),
      );
    });

    it("denies non-member create", async () => {
      const ctx = authenticatedContext(env, "stranger@test.com");
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `budget/${ENV}/rules/rule2`), { ...baseRule }),
      );
    });

    it("denies create with extra fields", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `budget/${ENV}/rules/rule2`), {
          ...baseRule,
          extraField: "nope",
        }),
      );
    });
  });

  describe("update", () => {
    it("allows updating mutable fields", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        updateDoc(doc(db, `budget/${ENV}/rules/rule1`), {
          pattern: "UPDATED",
          target: "updated-category",
          priority: 10,
        }),
      );
    });

    it("denies changing groupId", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/rules/rule1`), {
          groupId: "group2",
        }),
      );
    });

    it("denies changing memberEmails", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/rules/rule1`), {
          memberEmails: ["member@test.com"],
        }),
      );
    });

    it("denies non-member update", async () => {
      const ctx = authenticatedContext(env, "stranger@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/rules/rule1`), {
          pattern: "HACK",
        }),
      );
    });
  });

  describe("delete", () => {
    it("allows member to delete", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        deleteDoc(doc(db, `budget/${ENV}/rules/rule1`)),
      );
    });

    it("denies non-member delete", async () => {
      const ctx = authenticatedContext(env, "stranger@test.com");
      const db = ctx.firestore();
      await assertFails(
        deleteDoc(doc(db, `budget/${ENV}/rules/rule1`)),
      );
    });

    it("denies unauthenticated delete", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertFails(
        deleteDoc(doc(db, `budget/${ENV}/rules/rule1`)),
      );
    });
  });
});
