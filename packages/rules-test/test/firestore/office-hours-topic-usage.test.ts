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
const DOC_ID = "group1-2026-06-29";

const SNAPSHOT_DATA = {
  date: "2026-06-29",
  byTopic: {
    dispatch: {
      priceProxyUsd: 1.23,
      input: 1000,
      cacheRead: 50,
      cacheCreation: 20,
      output: 300,
    },
  },
  byType: {
    bug: { priceProxyUsd: 0.5, input: 400, cacheRead: 10, cacheCreation: 5, output: 100 },
    enhancement: { priceProxyUsd: 0, input: 0, cacheRead: 0, cacheCreation: 0, output: 0 },
    none: { priceProxyUsd: 0, input: 0, cacheRead: 0, cacheCreation: 0, output: 0 },
  },
  computedAt: new Date("2026-06-29T00:00:00Z"),
  groupId: "group1",
  memberEmails: ["owner@test.com"],
};

const DEMO_SNAPSHOT_DATA = {
  ...SNAPSHOT_DATA,
  memberEmails: [],
};

describe("office-hours topic usage", () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    env = await getTestEnv();
  });

  setupCleanup();

  beforeEach(async () => {
    await adminSetDoc(
      env,
      `office-hours/${ENV}/topic-usage/${DOC_ID}`,
      SNAPSHOT_DATA,
    );
    await adminSetDoc(
      env,
      `office-hours/demo/topic-usage/${DOC_ID}`,
      DEMO_SNAPSHOT_DATA,
    );
  });

  it("allows group member to read", async () => {
    const ctx = authenticatedContext(env, "owner@test.com");
    const db = ctx.firestore();
    await assertSucceeds(
      getDoc(doc(db, `office-hours/${ENV}/topic-usage/${DOC_ID}`)),
    );
  });

  it("denies non-member authenticated read", async () => {
    const ctx = authenticatedContext(env, "stranger@test.com");
    const db = ctx.firestore();
    await assertFails(
      getDoc(doc(db, `office-hours/${ENV}/topic-usage/${DOC_ID}`)),
    );
  });

  it("denies unauthenticated read of group env", async () => {
    const ctx = unauthenticatedContext(env);
    const db = ctx.firestore();
    await assertFails(
      getDoc(doc(db, `office-hours/${ENV}/topic-usage/${DOC_ID}`)),
    );
  });

  it("allows unauthenticated read of demo env", async () => {
    const ctx = unauthenticatedContext(env);
    const db = ctx.firestore();
    await assertSucceeds(
      getDoc(doc(db, `office-hours/demo/topic-usage/${DOC_ID}`)),
    );
  });

  it("allows authenticated non-member read of demo env", async () => {
    const ctx = authenticatedContext(env, "stranger@test.com");
    const db = ctx.firestore();
    await assertSucceeds(
      getDoc(doc(db, `office-hours/demo/topic-usage/${DOC_ID}`)),
    );
  });

  it("denies member setDoc", async () => {
    const ctx = authenticatedContext(env, "owner@test.com");
    const db = ctx.firestore();
    await assertFails(
      setDoc(doc(db, `office-hours/${ENV}/topic-usage/${DOC_ID}`), {
        memberEmails: ["owner@test.com"],
      }),
    );
  });

  it("denies member updateDoc", async () => {
    const ctx = authenticatedContext(env, "owner@test.com");
    const db = ctx.firestore();
    await assertFails(
      updateDoc(doc(db, `office-hours/${ENV}/topic-usage/${DOC_ID}`), {
        date: "2026-06-30",
      }),
    );
  });

  it("denies member deleteDoc", async () => {
    const ctx = authenticatedContext(env, "owner@test.com");
    const db = ctx.firestore();
    await assertFails(
      deleteDoc(doc(db, `office-hours/${ENV}/topic-usage/${DOC_ID}`)),
    );
  });

  it("denies unauthenticated setDoc", async () => {
    const ctx = unauthenticatedContext(env);
    const db = ctx.firestore();
    await assertFails(
      setDoc(doc(db, `office-hours/${ENV}/topic-usage/${DOC_ID}`), {
        memberEmails: ["owner@test.com"],
      }),
    );
  });

  it("denies setDoc to demo env", async () => {
    const ctx = authenticatedContext(env, "owner@test.com");
    const db = ctx.firestore();
    await assertFails(
      setDoc(doc(db, `office-hours/demo/topic-usage/${DOC_ID}`), {
        memberEmails: [],
      }),
    );
  });
});
