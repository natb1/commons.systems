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

describe("fellspiral groups", () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    env = await getTestEnv();
  });

  setupCleanup();

  beforeEach(async () => {
    await adminSetDoc(env, `fellspiral/${ENV}/groups/group1`, {
      members: ["member@test.com"],
    });
  });

  it("allows group member to read", async () => {
    const ctx = authenticatedContext(env, "member@test.com");
    const db = ctx.firestore();
    await assertSucceeds(
      getDoc(doc(db, `fellspiral/${ENV}/groups/group1`)),
    );
  });

  it("denies non-member read", async () => {
    const ctx = authenticatedContext(env, "stranger@test.com");
    const db = ctx.firestore();
    await assertFails(
      getDoc(doc(db, `fellspiral/${ENV}/groups/group1`)),
    );
  });

  it("denies unauthenticated read", async () => {
    const ctx = unauthenticatedContext(env);
    const db = ctx.firestore();
    await assertFails(
      getDoc(doc(db, `fellspiral/${ENV}/groups/group1`)),
    );
  });

  it("denies write", async () => {
    const ctx = authenticatedContext(env, "member@test.com");
    const db = ctx.firestore();
    await assertFails(
      setDoc(doc(db, `fellspiral/${ENV}/groups/group1`), { members: [] }),
    );
  });
});

describe("fellspiral posts", () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    env = await getTestEnv();
  });

  setupCleanup();

  beforeEach(async () => {
    await adminSetDoc(env, `fellspiral/${ENV}/groups/admin`, {
      members: ["admin@test.com"],
    });
    await adminSetDoc(env, `fellspiral/${ENV}/posts/published1`, {
      published: true,
      title: "Public Post",
    });
    await adminSetDoc(env, `fellspiral/${ENV}/posts/draft1`, {
      published: false,
      title: "Draft Post",
    });
  });

  it("allows unauthenticated read of published post", async () => {
    const ctx = unauthenticatedContext(env);
    const db = ctx.firestore();
    await assertSucceeds(
      getDoc(doc(db, `fellspiral/${ENV}/posts/published1`)),
    );
  });

  it("denies unauthenticated read of unpublished post", async () => {
    const ctx = unauthenticatedContext(env);
    const db = ctx.firestore();
    await assertFails(
      getDoc(doc(db, `fellspiral/${ENV}/posts/draft1`)),
    );
  });

  it("allows admin read of unpublished post", async () => {
    const ctx = authenticatedContext(env, "admin@test.com");
    const db = ctx.firestore();
    await assertSucceeds(
      getDoc(doc(db, `fellspiral/${ENV}/posts/draft1`)),
    );
  });

  it("denies non-admin read of unpublished post", async () => {
    const ctx = authenticatedContext(env, "nonadmin@test.com");
    const db = ctx.firestore();
    await assertFails(
      getDoc(doc(db, `fellspiral/${ENV}/posts/draft1`)),
    );
  });

  it("denies write", async () => {
    const ctx = authenticatedContext(env, "admin@test.com");
    const db = ctx.firestore();
    await assertFails(
      setDoc(doc(db, `fellspiral/${ENV}/posts/new1`), {
        published: true,
        title: "New",
      }),
    );
  });
});
