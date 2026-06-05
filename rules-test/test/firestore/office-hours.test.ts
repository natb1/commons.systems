import { describe, it, beforeAll, beforeEach } from "vitest";
import { assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import {
  getTestEnv,
  authenticatedContext,
  unauthenticatedContext,
  adminSetDoc,
  setupCleanup,
} from "../setup.js";

const ENV = "test";

describe("office-hours items", () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    env = await getTestEnv();
  });

  setupCleanup();

  beforeEach(async () => {
    await adminSetDoc(env, `office-hours/${ENV}/items/jit-demo`, {
      memberEmails: ["owner@test.com"],
      title: "Weekly review",
      dueAt: new Date("2026-06-10T00:00:00Z"),
      repo: "natb1/example",
      issueNumber: 42,
      jitKey: "jit-demo",
    });
  });

  it("allows owner to read", async () => {
    const ctx = authenticatedContext(env, "owner@test.com");
    const db = ctx.firestore();
    await assertSucceeds(
      getDoc(doc(db, `office-hours/${ENV}/items/jit-demo`)),
    );
  });

  it("denies non-owner read", async () => {
    const ctx = authenticatedContext(env, "stranger@test.com");
    const db = ctx.firestore();
    await assertFails(
      getDoc(doc(db, `office-hours/${ENV}/items/jit-demo`)),
    );
  });

  it("denies unauthenticated read", async () => {
    const ctx = unauthenticatedContext(env);
    const db = ctx.firestore();
    await assertFails(
      getDoc(doc(db, `office-hours/${ENV}/items/jit-demo`)),
    );
  });

  it("denies write (owner setDoc)", async () => {
    const ctx = authenticatedContext(env, "owner@test.com");
    const db = ctx.firestore();
    await assertFails(
      setDoc(doc(db, `office-hours/${ENV}/items/jit-demo`), {
        memberEmails: ["owner@test.com"],
      }),
    );
  });

  it("denies owner deleteDoc", async () => {
    const ctx = authenticatedContext(env, "owner@test.com");
    const db = ctx.firestore();
    await assertFails(
      deleteDoc(doc(db, `office-hours/${ENV}/items/jit-demo`)),
    );
  });

  it("denies owner updateDoc", async () => {
    const ctx = authenticatedContext(env, "owner@test.com");
    const db = ctx.firestore();
    await assertFails(
      updateDoc(doc(db, `office-hours/${ENV}/items/jit-demo`), {
        title: "Updated title",
      }),
    );
  });

  it("denies non-owner write (setDoc)", async () => {
    const ctx = authenticatedContext(env, "stranger@test.com");
    const db = ctx.firestore();
    await assertFails(
      setDoc(doc(db, `office-hours/${ENV}/items/jit-demo`), {
        memberEmails: ["stranger@test.com"],
      }),
    );
  });

  it("denies unauthenticated write (setDoc)", async () => {
    const ctx = unauthenticatedContext(env);
    const db = ctx.firestore();
    await assertFails(
      setDoc(doc(db, `office-hours/${ENV}/items/jit-demo`), {
        memberEmails: ["owner@test.com"],
      }),
    );
  });
});
