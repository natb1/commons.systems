import { describe, it, beforeAll, beforeEach } from "vitest";
import { assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  getTestEnv,
  authenticatedContext,
  unauthenticatedContext,
  adminSetDoc,
  setupCleanup,
} from "../setup.js";

const ENV = "test";

describe("budget statements", () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    env = await getTestEnv();
  });

  setupCleanup();

  beforeEach(async () => {
    await adminSetDoc(env, `budget/${ENV}/statements/stmt1`, {
      memberEmails: ["member@test.com"],
      institution: "Bank",
      account: "Checking",
    });
  });

  it("allows member to read", async () => {
    const ctx = authenticatedContext(env, "member@test.com");
    const db = ctx.firestore();
    await assertSucceeds(
      getDoc(doc(db, `budget/${ENV}/statements/stmt1`)),
    );
  });

  it("denies non-member read", async () => {
    const ctx = authenticatedContext(env, "stranger@test.com");
    const db = ctx.firestore();
    await assertFails(
      getDoc(doc(db, `budget/${ENV}/statements/stmt1`)),
    );
  });

  it("denies unauthenticated read", async () => {
    const ctx = unauthenticatedContext(env);
    const db = ctx.firestore();
    await assertFails(
      getDoc(doc(db, `budget/${ENV}/statements/stmt1`)),
    );
  });

  it("denies write", async () => {
    const ctx = authenticatedContext(env, "member@test.com");
    const db = ctx.firestore();
    await assertFails(
      setDoc(doc(db, `budget/${ENV}/statements/stmt1`), {
        memberEmails: ["member@test.com"],
      }),
    );
  });
});
