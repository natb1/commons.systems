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

describe("audio groups", () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    env = await getTestEnv();
  });

  setupCleanup();

  beforeEach(async () => {
    await adminSetDoc(env, `audio/${ENV}/groups/group1`, {
      members: ["member@test.com"],
    });
  });

  it("allows group member to read", async () => {
    const ctx = authenticatedContext(env, "member@test.com");
    const db = ctx.firestore();
    await assertSucceeds(
      getDoc(doc(db, `audio/${ENV}/groups/group1`)),
    );
  });

  it("denies non-member read", async () => {
    const ctx = authenticatedContext(env, "stranger@test.com");
    const db = ctx.firestore();
    await assertFails(getDoc(doc(db, `audio/${ENV}/groups/group1`)));
  });

  it("denies unauthenticated read", async () => {
    const ctx = unauthenticatedContext(env);
    const db = ctx.firestore();
    await assertFails(getDoc(doc(db, `audio/${ENV}/groups/group1`)));
  });

  it("denies write", async () => {
    const ctx = authenticatedContext(env, "member@test.com");
    const db = ctx.firestore();
    await assertFails(
      setDoc(doc(db, `audio/${ENV}/groups/group1`), { members: [] }),
    );
  });
});

describe("audio media", () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    env = await getTestEnv();
  });

  setupCleanup();

  beforeEach(async () => {
    await adminSetDoc(env, `audio/${ENV}/media/public1`, {
      publicDomain: true,
      title: "Public Audiobook",
      memberEmails: ["member@test.com"],
    });
    await adminSetDoc(env, `audio/${ENV}/media/private1`, {
      publicDomain: false,
      title: "Private Audiobook",
      memberEmails: ["member@test.com"],
    });
  });

  it("allows unauthenticated read of public domain media", async () => {
    const ctx = unauthenticatedContext(env);
    const db = ctx.firestore();
    await assertSucceeds(
      getDoc(doc(db, `audio/${ENV}/media/public1`)),
    );
  });

  it("allows member read of private media", async () => {
    const ctx = authenticatedContext(env, "member@test.com");
    const db = ctx.firestore();
    await assertSucceeds(
      getDoc(doc(db, `audio/${ENV}/media/private1`)),
    );
  });

  it("denies non-member read of private media", async () => {
    const ctx = authenticatedContext(env, "stranger@test.com");
    const db = ctx.firestore();
    await assertFails(
      getDoc(doc(db, `audio/${ENV}/media/private1`)),
    );
  });

  it("denies unauthenticated read of private media", async () => {
    const ctx = unauthenticatedContext(env);
    const db = ctx.firestore();
    await assertFails(
      getDoc(doc(db, `audio/${ENV}/media/private1`)),
    );
  });

  it("denies write", async () => {
    const ctx = authenticatedContext(env, "member@test.com");
    const db = ctx.firestore();
    await assertFails(
      setDoc(doc(db, `audio/${ENV}/media/new1`), {
        publicDomain: true,
        title: "New",
        memberEmails: [],
      }),
    );
  });
});
