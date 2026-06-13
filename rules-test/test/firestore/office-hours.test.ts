import { describe, it, beforeAll, beforeEach } from "vitest";
import { assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  collection,
  query,
  where,
} from "firebase/firestore";
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

describe("office-hours usage-samples", () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    env = await getTestEnv();
  });

  setupCleanup();

  const sampleDoc = {
    memberEmails: ["owner@test.com"],
    sampledAt: new Date("2026-06-07T12:00:00Z"),
    fiveHourUsedPct: 42,
    weeklyUsedPct: 70,
    fiveHourResetsAt: new Date("2026-06-07T17:00:00Z"),
    weeklyResetsAt: new Date("2026-06-14T00:00:00Z"),
    activeWorkers: 3,
    targetWorkers: 5,
    groupId: "owner-group",
  };

  const demoSampleDoc = {
    memberEmails: ["demo@example.com"],
    sampledAt: new Date("2026-06-07T11:00:00Z"),
    fiveHourUsedPct: 20,
    weeklyUsedPct: 35,
    fiveHourResetsAt: new Date("2026-06-07T16:00:00Z"),
    weeklyResetsAt: new Date("2026-06-14T00:00:00Z"),
    activeWorkers: 1,
    targetWorkers: 2,
    groupId: "demo-group",
  };

  beforeEach(async () => {
    await adminSetDoc(
      env,
      `office-hours/${ENV}/usage-samples/sample-owner`,
      sampleDoc,
    );
    await adminSetDoc(
      env,
      `office-hours/demo/usage-samples/sample-demo`,
      demoSampleDoc,
    );
  });

  it("allows owner to read test-env doc", async () => {
    const ctx = authenticatedContext(env, "owner@test.com");
    const db = ctx.firestore();
    await assertSucceeds(
      getDoc(doc(db, `office-hours/${ENV}/usage-samples/sample-owner`)),
    );
  });

  it("denies non-owner read of test-env doc", async () => {
    const ctx = authenticatedContext(env, "stranger@test.com");
    const db = ctx.firestore();
    await assertFails(
      getDoc(doc(db, `office-hours/${ENV}/usage-samples/sample-owner`)),
    );
  });

  it("denies unauthenticated read of test-env doc", async () => {
    const ctx = unauthenticatedContext(env);
    const db = ctx.firestore();
    await assertFails(
      getDoc(doc(db, `office-hours/${ENV}/usage-samples/sample-owner`)),
    );
  });

  it("allows unauthenticated read of demo-env doc", async () => {
    const ctx = unauthenticatedContext(env);
    const db = ctx.firestore();
    await assertSucceeds(
      getDoc(doc(db, `office-hours/demo/usage-samples/sample-demo`)),
    );
  });

  it("denies owner setDoc on test-env doc", async () => {
    const ctx = authenticatedContext(env, "owner@test.com");
    const db = ctx.firestore();
    await assertFails(
      setDoc(doc(db, `office-hours/${ENV}/usage-samples/sample-owner`), {
        memberEmails: ["owner@test.com"],
      }),
    );
  });

  it("denies owner updateDoc on test-env doc", async () => {
    const ctx = authenticatedContext(env, "owner@test.com");
    const db = ctx.firestore();
    await assertFails(
      updateDoc(doc(db, `office-hours/${ENV}/usage-samples/sample-owner`), {
        activeWorkers: 4,
      }),
    );
  });

  it("denies owner deleteDoc on test-env doc", async () => {
    const ctx = authenticatedContext(env, "owner@test.com");
    const db = ctx.firestore();
    await assertFails(
      deleteDoc(doc(db, `office-hours/${ENV}/usage-samples/sample-owner`)),
    );
  });

  it("denies unauthenticated setDoc on demo-env doc", async () => {
    const ctx = unauthenticatedContext(env);
    const db = ctx.firestore();
    await assertFails(
      setDoc(doc(db, `office-hours/demo/usage-samples/sample-demo`), {
        memberEmails: ["demo@example.com"],
      }),
    );
  });

  it("allows owner list query on test-env collection", async () => {
    const ctx = authenticatedContext(env, "owner@test.com");
    const db = ctx.firestore();
    await assertSucceeds(
      getDocs(
        query(
          collection(db, `office-hours/${ENV}/usage-samples`),
          where("memberEmails", "array-contains", "owner@test.com"),
        ),
      ),
    );
  });

  it("denies non-member list query for another member's docs", async () => {
    const ctx = authenticatedContext(env, "stranger@test.com");
    const db = ctx.firestore();
    await assertFails(
      getDocs(
        query(
          collection(db, `office-hours/${ENV}/usage-samples`),
          where("memberEmails", "array-contains", "owner@test.com"),
        ),
      ),
    );
  });

  // "Rules are not filters": a list query is allowed when its where-clause
  // provably satisfies the rule. A non-member filtering to their own membership
  // is allowed and simply returns the empty subset they are entitled to.
  it("allows non-member list query filtered to own (empty) membership", async () => {
    const ctx = authenticatedContext(env, "stranger@test.com");
    const db = ctx.firestore();
    await assertSucceeds(
      getDocs(
        query(
          collection(db, `office-hours/${ENV}/usage-samples`),
          where("memberEmails", "array-contains", "stranger@test.com"),
        ),
      ),
    );
  });

  it("denies unauthenticated list query on test-env collection", async () => {
    const ctx = unauthenticatedContext(env);
    const db = ctx.firestore();
    await assertFails(
      getDocs(
        query(
          collection(db, `office-hours/${ENV}/usage-samples`),
          where("memberEmails", "array-contains", "owner@test.com"),
        ),
      ),
    );
  });

  it("denies unauthenticated list query on demo-env collection", async () => {
    const ctx = unauthenticatedContext(env);
    const db = ctx.firestore();
    await assertFails(
      getDocs(collection(db, `office-hours/demo/usage-samples`)),
    );
  });

  it("denies authenticated setDoc on demo-env doc", async () => {
    const ctx = authenticatedContext(env, "demo@example.com");
    const db = ctx.firestore();
    await assertFails(
      setDoc(doc(db, `office-hours/demo/usage-samples/sample-demo`), {
        memberEmails: ["demo@example.com"],
      }),
    );
  });

  it("denies authenticated updateDoc on demo-env doc", async () => {
    const ctx = authenticatedContext(env, "demo@example.com");
    const db = ctx.firestore();
    await assertFails(
      updateDoc(doc(db, `office-hours/demo/usage-samples/sample-demo`), {
        activeWorkers: 2,
      }),
    );
  });

  it("denies authenticated deleteDoc on demo-env doc", async () => {
    const ctx = authenticatedContext(env, "demo@example.com");
    const db = ctx.firestore();
    await assertFails(
      deleteDoc(doc(db, `office-hours/demo/usage-samples/sample-demo`)),
    );
  });
});
