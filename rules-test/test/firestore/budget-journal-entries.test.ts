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
const GROUP_ID = "group1";

const baseDoc = {
  timestamp: new Date("2024-01-15T00:00:00Z"),
  description: "Opening balance",
  note: "memo",
  legCount: 2,
  groupId: GROUP_ID,
  memberEmails: MEMBERS,
};

describe("budget journal entries", () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    env = await getTestEnv();
  });

  setupCleanup();

  beforeEach(async () => {
    await adminSetDoc(env, `budget/${ENV}/groups/${GROUP_ID}`, {
      members: MEMBERS,
    });
    await adminSetDoc(env, `budget/${ENV}/journal-entries/existing1`, baseDoc);
  });

  describe("read", () => {
    it("allows member to read", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        getDoc(doc(db, `budget/${ENV}/journal-entries/existing1`)),
      );
    });

    it("denies non-member read", async () => {
      const ctx = authenticatedContext(env, "stranger@test.com");
      const db = ctx.firestore();
      await assertFails(
        getDoc(doc(db, `budget/${ENV}/journal-entries/existing1`)),
      );
    });

    it("denies unauthenticated read", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertFails(
        getDoc(doc(db, `budget/${ENV}/journal-entries/existing1`)),
      );
    });
  });

  describe("create", () => {
    it("allows member to create valid doc", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        setDoc(doc(db, `budget/${ENV}/journal-entries/new1`), baseDoc),
      );
    });

    it("denies non-member create", async () => {
      const ctx = authenticatedContext(env, "stranger@test.com");
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `budget/${ENV}/journal-entries/new1`), baseDoc),
      );
    });

    it("denies create when memberEmails != group.members", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `budget/${ENV}/journal-entries/new1`), {
          ...baseDoc,
          memberEmails: ["member@test.com"],
        }),
      );
    });

    it("denies create with invalid field", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `budget/${ENV}/journal-entries/new1`), {
          ...baseDoc,
          legCount: "two",
        }),
      );
    });
  });

  describe("update", () => {
    it("allows member to update mutable field", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        updateDoc(doc(db, `budget/${ENV}/journal-entries/existing1`), {
          description: "updated",
        }),
      );
    });

    it("denies changing groupId", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/journal-entries/existing1`), {
          groupId: "group2",
        }),
      );
    });

    it("denies changing memberEmails", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/journal-entries/existing1`), {
          memberEmails: ["member@test.com"],
        }),
      );
    });

    it("denies non-member update", async () => {
      const ctx = authenticatedContext(env, "stranger@test.com");
      const db = ctx.firestore();
      await assertFails(
        updateDoc(doc(db, `budget/${ENV}/journal-entries/existing1`), {
          description: "hack",
        }),
      );
    });
  });

  describe("delete", () => {
    it("allows member to delete", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        deleteDoc(doc(db, `budget/${ENV}/journal-entries/existing1`)),
      );
    });

    it("denies non-member delete", async () => {
      const ctx = authenticatedContext(env, "stranger@test.com");
      const db = ctx.firestore();
      await assertFails(
        deleteDoc(doc(db, `budget/${ENV}/journal-entries/existing1`)),
      );
    });
  });
});
