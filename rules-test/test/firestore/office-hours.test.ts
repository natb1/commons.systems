import { describe, it, beforeAll, beforeEach, expect } from "vitest";
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

  it("allows owner list query on items collection", async () => {
    const ctx = authenticatedContext(env, "owner@test.com");
    const db = ctx.firestore();
    const snap = await assertSucceeds(
      getDocs(
        query(
          collection(db, `office-hours/${ENV}/items`),
          where("memberEmails", "array-contains", "owner@test.com"),
        ),
      ),
    );
    expect(snap.empty).toBe(false);
  });

  it("denies unfiltered owner list query on items collection", async () => {
    const ctx = authenticatedContext(env, "owner@test.com");
    const db = ctx.firestore();
    await assertFails(
      getDocs(collection(db, `office-hours/${ENV}/items`)),
    );
  });

  // A non-member cannot list another member's items: filtering for an email
  // they are not in is denied, because the matching docs carry a memberEmails
  // the requester is absent from. (A self-targeted array-contains filter is
  // always rule-compliant and returns an empty set, so it is not a denial
  // case.)
  it("denies authenticated non-member list query for another member's items", async () => {
    const ctx = authenticatedContext(env, "stranger@test.com");
    const db = ctx.firestore();
    await assertFails(
      getDocs(
        query(
          collection(db, `office-hours/${ENV}/items`),
          where("memberEmails", "array-contains", "owner@test.com"),
        ),
      ),
    );
  });

  it("denies unauthenticated list query on items collection", async () => {
    const ctx = unauthenticatedContext(env);
    const db = ctx.firestore();
    await assertFails(
      getDocs(
        query(
          collection(db, `office-hours/${ENV}/items`),
          where("memberEmails", "array-contains", "owner@test.com"),
        ),
      ),
    );
  });

  // Documents the non-obvious converse of the denial above: a non-member's
  // self-targeted filter is rule-compliant and succeeds, returning an empty
  // set rather than being denied. This guards against re-introducing the
  // false "self-targeted non-member filter is denied" assumption.
  it("allows authenticated non-member self-targeted list query (returns empty)", async () => {
    const ctx = authenticatedContext(env, "stranger@test.com");
    const db = ctx.firestore();
    const snap = await assertSucceeds(
      getDocs(
        query(
          collection(db, `office-hours/${ENV}/items`),
          where("memberEmails", "array-contains", "stranger@test.com"),
        ),
      ),
    );
    expect(snap.empty).toBe(true);
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

  // A non-member cannot list another member's samples: filtering for an email
  // they are not in is denied, because the matching docs carry a memberEmails
  // the requester is absent from. (A self-targeted array-contains filter is
  // always rule-compliant and returns an empty set, so it is not a denial
  // case.)
  it("denies authenticated non-member list query for another member's samples", async () => {
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
