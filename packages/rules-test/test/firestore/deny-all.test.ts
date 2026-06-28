import { describe, it, beforeAll } from "vitest";
import { assertFails } from "@firebase/rules-unit-testing";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  getTestEnv,
  authenticatedContext,
  unauthenticatedContext,
  setupCleanup,
} from "../setup.js";

describe("deny-all catch-all", () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    env = await getTestEnv();
  });

  setupCleanup();

  it("denies unauthenticated read on unknown path", async () => {
    const ctx = unauthenticatedContext(env);
    const db = ctx.firestore();
    await assertFails(getDoc(doc(db, "unknown/doc")));
  });

  it("denies authenticated read on unknown path", async () => {
    const ctx = authenticatedContext(env, "user@test.com");
    const db = ctx.firestore();
    await assertFails(getDoc(doc(db, "unknown/doc")));
  });

  it("denies unauthenticated write on unknown path", async () => {
    const ctx = unauthenticatedContext(env);
    const db = ctx.firestore();
    await assertFails(setDoc(doc(db, "unknown/doc"), { data: true }));
  });

  it("denies authenticated write on unknown path", async () => {
    const ctx = authenticatedContext(env, "user@test.com");
    const db = ctx.firestore();
    await assertFails(setDoc(doc(db, "unknown/doc"), { data: true }));
  });
});
