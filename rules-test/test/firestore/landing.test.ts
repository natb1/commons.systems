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

describe("landing groups", () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    env = await getTestEnv();
  });

  setupCleanup();

  beforeEach(async () => {
    await adminSetDoc(env, `landing/${ENV}/groups/group1`, {
      members: ["member@test.com", "other@test.com"],
    });
  });

  it("allows group member to read", async () => {
    const ctx = authenticatedContext(env, "member@test.com");
    const db = ctx.firestore();
    await assertSucceeds(getDoc(doc(db, `landing/${ENV}/groups/group1`)));
  });

  it("denies non-member read", async () => {
    const ctx = authenticatedContext(env, "stranger@test.com");
    const db = ctx.firestore();
    await assertFails(getDoc(doc(db, `landing/${ENV}/groups/group1`)));
  });

  it("denies unauthenticated read", async () => {
    const ctx = unauthenticatedContext(env);
    const db = ctx.firestore();
    await assertFails(getDoc(doc(db, `landing/${ENV}/groups/group1`)));
  });

  it("denies write", async () => {
    const ctx = authenticatedContext(env, "member@test.com");
    const db = ctx.firestore();
    await assertFails(
      setDoc(doc(db, `landing/${ENV}/groups/group1`), { members: [] }),
    );
  });
});

describe("landing posts", () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    env = await getTestEnv();
  });

  setupCleanup();

  beforeEach(async () => {
    await adminSetDoc(env, `landing/${ENV}/groups/admin`, {
      members: ["admin@test.com"],
    });
    await adminSetDoc(env, `landing/${ENV}/posts/published1`, {
      published: true,
      title: "Public Post",
      publishedAt: "2024-01-01",
    });
    await adminSetDoc(env, `landing/${ENV}/posts/draft1`, {
      published: false,
      title: "Draft Post",
    });
  });

  it("allows unauthenticated read of published post", async () => {
    const ctx = unauthenticatedContext(env);
    const db = ctx.firestore();
    await assertSucceeds(
      getDoc(doc(db, `landing/${ENV}/posts/published1`)),
    );
  });

  it("allows authenticated read of published post", async () => {
    const ctx = authenticatedContext(env, "anyone@test.com");
    const db = ctx.firestore();
    await assertSucceeds(
      getDoc(doc(db, `landing/${ENV}/posts/published1`)),
    );
  });

  it("denies unauthenticated read of unpublished post", async () => {
    const ctx = unauthenticatedContext(env);
    const db = ctx.firestore();
    await assertFails(getDoc(doc(db, `landing/${ENV}/posts/draft1`)));
  });

  it("denies non-admin read of unpublished post", async () => {
    const ctx = authenticatedContext(env, "nonadmin@test.com");
    const db = ctx.firestore();
    await assertFails(getDoc(doc(db, `landing/${ENV}/posts/draft1`)));
  });

  it("allows admin read of unpublished post", async () => {
    const ctx = authenticatedContext(env, "admin@test.com");
    const db = ctx.firestore();
    await assertSucceeds(getDoc(doc(db, `landing/${ENV}/posts/draft1`)));
  });

  it("denies write", async () => {
    const ctx = authenticatedContext(env, "admin@test.com");
    const db = ctx.firestore();
    await assertFails(
      setDoc(doc(db, `landing/${ENV}/posts/new1`), {
        published: true,
        title: "New Post",
      }),
    );
  });
});
