import { describe, it, beforeAll, beforeEach } from "vitest";
import { assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import {
  getTestEnv,
  authenticatedContext,
  unauthenticatedContext,
  adminUploadStorage,
  setupCleanup,
} from "../setup.js";

const ENV = "test";

describe("storage print media", () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    env = await getTestEnv();
  });

  setupCleanup();

  beforeEach(async () => {
    await adminUploadStorage(env, `print/${ENV}/media/public-book.epub`, {
      publicDomain: "true",
      member_0: "member@test.com",
    });
    await adminUploadStorage(env, `print/${ENV}/media/private-book.epub`, {
      publicDomain: "false",
      member_0: "member@test.com",
      member_1: "other@test.com",
    });
  });

  describe("public domain files", () => {
    it("allows unauthenticated read", async () => {
      const ctx = unauthenticatedContext(env);
      const storage = ctx.storage();
      const ref = storage.ref(`print/${ENV}/media/public-book.epub`);
      await assertSucceeds(ref.getDownloadURL());
    });

    it("allows authenticated read", async () => {
      const ctx = authenticatedContext(env, "anyone@test.com");
      const storage = ctx.storage();
      const ref = storage.ref(`print/${ENV}/media/public-book.epub`);
      await assertSucceeds(ref.getDownloadURL());
    });
  });

  describe("private files - member access", () => {
    it("allows member_0 to read", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const storage = ctx.storage();
      const ref = storage.ref(`print/${ENV}/media/private-book.epub`);
      await assertSucceeds(ref.getDownloadURL());
    });

    it("allows member_1 to read", async () => {
      const ctx = authenticatedContext(env, "other@test.com");
      const storage = ctx.storage();
      const ref = storage.ref(`print/${ENV}/media/private-book.epub`);
      await assertSucceeds(ref.getDownloadURL());
    });

    it("denies non-member read", async () => {
      const ctx = authenticatedContext(env, "stranger@test.com");
      const storage = ctx.storage();
      const ref = storage.ref(`print/${ENV}/media/private-book.epub`);
      await assertFails(ref.getDownloadURL());
    });

    it("denies unauthenticated read of private file", async () => {
      const ctx = unauthenticatedContext(env);
      const storage = ctx.storage();
      const ref = storage.ref(`print/${ENV}/media/private-book.epub`);
      await assertFails(ref.getDownloadURL());
    });
  });

  describe("member_2 access", () => {
    beforeEach(async () => {
      await adminUploadStorage(
        env,
        `print/${ENV}/media/three-member.epub`,
        {
          publicDomain: "false",
          member_0: "a@test.com",
          member_1: "b@test.com",
          member_2: "c@test.com",
        },
      );
    });

    it("allows member_2 to read", async () => {
      const ctx = authenticatedContext(env, "c@test.com");
      const storage = ctx.storage();
      const ref = storage.ref(`print/${ENV}/media/three-member.epub`);
      await assertSucceeds(ref.getDownloadURL());
    });
  });

  describe("write denied", () => {
    it("denies authenticated write", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const storage = ctx.storage();
      const ref = storage.ref(`print/${ENV}/media/new-file.epub`);
      await assertFails(ref.put(new Uint8Array([1, 2, 3])));
    });

    it("denies unauthenticated write", async () => {
      const ctx = unauthenticatedContext(env);
      const storage = ctx.storage();
      const ref = storage.ref(`print/${ENV}/media/new-file.epub`);
      await assertFails(ref.put(new Uint8Array([1, 2, 3])));
    });
  });
});

describe("storage deny-all catch-all", () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    env = await getTestEnv();
  });

  setupCleanup();

  it("denies read on unknown path", async () => {
    const ctx = authenticatedContext(env, "user@test.com");
    const storage = ctx.storage();
    const ref = storage.ref("unknown/path/file.txt");
    await assertFails(ref.getDownloadURL());
  });

  it("denies write on unknown path", async () => {
    const ctx = authenticatedContext(env, "user@test.com");
    const storage = ctx.storage();
    const ref = storage.ref("unknown/path/file.txt");
    await assertFails(ref.put(new Uint8Array([1])));
  });
});
