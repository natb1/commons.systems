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
  pattern: "COFFEE",
  canonicalDescription: "Coffee Shop",
  priority: 1,
  groupId: "group1",
  memberEmails: MEMBERS,
};

describe("budget normalization-rules", () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    env = await getTestEnv();
  });

  setupCleanup();

  beforeEach(async () => {
    // Seed the group doc (required for isBudgetGroupMember on create)
    await adminSetDoc(env, `budget/${ENV}/groups/group1`, {
      members: MEMBERS,
    });
    await adminSetDoc(
      env,
      `budget/${ENV}/normalization-rules/rule1`,
      baseRule,
    );
  });

  describe("read", () => {
    it("allows member to read", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        getDoc(doc(db, `budget/${ENV}/normalization-rules/rule1`)),
      );
    });

    it("denies non-member read", async () => {
      const ctx = authenticatedContext(env, "stranger@test.com");
      const db = ctx.firestore();
      await assertFails(
        getDoc(doc(db, `budget/${ENV}/normalization-rules/rule1`)),
      );
    });

    it("denies unauthenticated read", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertFails(
        getDoc(doc(db, `budget/${ENV}/normalization-rules/rule1`)),
      );
    });
  });

  describe("create", () => {
    it("allows member to create with valid data", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        setDoc(doc(db, `budget/${ENV}/normalization-rules/rule2`), {
          pattern: "STARBUCKS",
          canonicalDescription: "Starbucks",
          priority: 2,
          groupId: "group1",
          memberEmails: MEMBERS,
        }),
      );
    });

    it("allows optional fields on create", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        setDoc(doc(db, `budget/${ENV}/normalization-rules/rule3`), {
          pattern: "TEST",
          patternType: "regex",
          canonicalDescription: "Test",
          dateWindowDays: 7,
          priority: 1,
          institution: "Bank",
          account: "Checking",
          groupId: "group1",
          memberEmails: MEMBERS,
        }),
      );
    });

    it("denies create with empty pattern", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `budget/${ENV}/normalization-rules/rule2`), {
          pattern: "",
          canonicalDescription: "Test",
          priority: 1,
          groupId: "group1",
          memberEmails: MEMBERS,
        }),
      );
    });

    it("denies create with empty canonicalDescription", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `budget/${ENV}/normalization-rules/rule2`), {
          pattern: "TEST",
          canonicalDescription: "",
          priority: 1,
          groupId: "group1",
          memberEmails: MEMBERS,
        }),
      );
    });

    it("denies create with mismatched memberEmails", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `budget/${ENV}/normalization-rules/rule2`), {
          pattern: "TEST",
          canonicalDescription: "Test",
          priority: 1,
          groupId: "group1",
          memberEmails: ["member@test.com"], // doesn't match group members
        }),
      );
    });

    it("denies non-member create", async () => {
      const ctx = authenticatedContext(env, "stranger@test.com");
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `budget/${ENV}/normalization-rules/rule2`), {
          ...baseRule,
        }),
      );
    });

    it("denies create with invalid patternType", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `budget/${ENV}/normalization-rules/rule2`), {
          ...baseRule,
          patternType: "glob",
        }),
      );
    });

    it("denies create with negative dateWindowDays", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `budget/${ENV}/normalization-rules/rule2`), {
          ...baseRule,
          dateWindowDays: -1,
        }),
      );
    });

    it("denies create with extra fields", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `budget/${ENV}/normalization-rules/rule2`), {
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
        updateDoc(doc(db, `budget/${ENV}/normalization-rules/rule1`), {
          pattern: "UPDATED",
          canonicalDescription: "Updated",
          priority: 5,
        }),
      );
    });

    it("denies changing groupId", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/normalization-rules/rule1`), {
          groupId: "group2",
        }),
      );
    });

    it("denies changing memberEmails", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/normalization-rules/rule1`), {
          memberEmails: ["member@test.com"],
        }),
      );
    });

    it("denies non-member update", async () => {
      const ctx = authenticatedContext(env, "stranger@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/normalization-rules/rule1`), {
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
        deleteDoc(doc(db, `budget/${ENV}/normalization-rules/rule1`)),
      );
    });

    it("denies non-member delete", async () => {
      const ctx = authenticatedContext(env, "stranger@test.com");
      const db = ctx.firestore();
      await assertFails(
        deleteDoc(doc(db, `budget/${ENV}/normalization-rules/rule1`)),
      );
    });

    it("denies unauthenticated delete", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertFails(
        deleteDoc(doc(db, `budget/${ENV}/normalization-rules/rule1`)),
      );
    });
  });
});
