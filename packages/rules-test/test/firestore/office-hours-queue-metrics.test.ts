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

const SNAPSHOT_DATA = {
  memberEmails: ["owner@test.com"],
  openHelpWanted: 12,
  closedPerDay: 1.5,
  createdPerDay: 1.0,
  netDrainPerDay: 0.5,
  runwayDays: 24,
  windowDays: 14,
  groupId: "group1",
  computedAt: new Date("2026-06-07T00:00:00Z"),
};

const DEMO_SNAPSHOT_DATA = {
  ...SNAPSHOT_DATA,
  memberEmails: [],
};

describe("office-hours queue metrics", () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    env = await getTestEnv();
  });

  setupCleanup();

  beforeEach(async () => {
    await adminSetDoc(
      env,
      `office-hours/${ENV}/metrics/dispatch-queue`,
      SNAPSHOT_DATA,
    );
    await adminSetDoc(
      env,
      "office-hours/demo/metrics/dispatch-queue",
      DEMO_SNAPSHOT_DATA,
    );
  });

  it("allows group member to read", async () => {
    const ctx = authenticatedContext(env, "owner@test.com");
    const db = ctx.firestore();
    await assertSucceeds(
      getDoc(doc(db, `office-hours/${ENV}/metrics/dispatch-queue`)),
    );
  });

  it("denies non-member authenticated read", async () => {
    const ctx = authenticatedContext(env, "stranger@test.com");
    const db = ctx.firestore();
    await assertFails(
      getDoc(doc(db, `office-hours/${ENV}/metrics/dispatch-queue`)),
    );
  });

  it("denies unauthenticated read of group env", async () => {
    const ctx = unauthenticatedContext(env);
    const db = ctx.firestore();
    await assertFails(
      getDoc(doc(db, `office-hours/${ENV}/metrics/dispatch-queue`)),
    );
  });

  it("allows unauthenticated read of demo env", async () => {
    const ctx = unauthenticatedContext(env);
    const db = ctx.firestore();
    await assertSucceeds(
      getDoc(doc(db, "office-hours/demo/metrics/dispatch-queue")),
    );
  });

  it("allows authenticated non-member read of demo env", async () => {
    const ctx = authenticatedContext(env, "stranger@test.com");
    const db = ctx.firestore();
    await assertSucceeds(
      getDoc(doc(db, "office-hours/demo/metrics/dispatch-queue")),
    );
  });

  it("denies member setDoc", async () => {
    const ctx = authenticatedContext(env, "owner@test.com");
    const db = ctx.firestore();
    await assertFails(
      setDoc(doc(db, `office-hours/${ENV}/metrics/dispatch-queue`), {
        memberEmails: ["owner@test.com"],
      }),
    );
  });

  it("denies member updateDoc", async () => {
    const ctx = authenticatedContext(env, "owner@test.com");
    const db = ctx.firestore();
    await assertFails(
      updateDoc(doc(db, `office-hours/${ENV}/metrics/dispatch-queue`), {
        openHelpWanted: 99,
      }),
    );
  });

  it("denies member deleteDoc", async () => {
    const ctx = authenticatedContext(env, "owner@test.com");
    const db = ctx.firestore();
    await assertFails(
      deleteDoc(doc(db, `office-hours/${ENV}/metrics/dispatch-queue`)),
    );
  });

  it("denies unauthenticated setDoc", async () => {
    const ctx = unauthenticatedContext(env);
    const db = ctx.firestore();
    await assertFails(
      setDoc(doc(db, `office-hours/${ENV}/metrics/dispatch-queue`), {
        memberEmails: ["owner@test.com"],
      }),
    );
  });

  it("denies setDoc to demo env", async () => {
    const ctx = authenticatedContext(env, "owner@test.com");
    const db = ctx.firestore();
    await assertFails(
      setDoc(doc(db, "office-hours/demo/metrics/dispatch-queue"), {
        memberEmails: [],
      }),
    );
  });
});
