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
      publicdomain: "true",
    });
    await adminUploadStorage(env, `print/${ENV}/media/private-book.epub`, {
      publicdomain: "false",
      member_emails: "member@test.com,other@test.com",
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
    it("allows first listed member to read", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const storage = ctx.storage();
      const ref = storage.ref(`print/${ENV}/media/private-book.epub`);
      await assertSucceeds(ref.getDownloadURL());
    });

    it("allows second listed member to read", async () => {
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

  describe(">3 members (cap removed)", () => {
    beforeEach(async () => {
      await adminUploadStorage(
        env,
        `print/${ENV}/media/four-member.epub`,
        {
          publicdomain: "false",
          member_emails: "a@test.com,b@test.com,c@test.com,d@test.com",
        },
      );
    });

    it("allows the 4th listed member to read", async () => {
      const ctx = authenticatedContext(env, "d@test.com");
      const storage = ctx.storage();
      const ref = storage.ref(`print/${ENV}/media/four-member.epub`);
      await assertSucceeds(ref.getDownloadURL());
    });

    it("denies a non-listed email", async () => {
      const ctx = authenticatedContext(env, "e@test.com");
      const storage = ctx.storage();
      const ref = storage.ref(`print/${ENV}/media/four-member.epub`);
      await assertFails(ref.getDownloadURL());
    });
  });

  describe("legacy member_0/1/2 fallback", () => {
    beforeEach(async () => {
      await adminUploadStorage(
        env,
        `print/${ENV}/media/legacy.epub`,
        {
          publicdomain: "false",
          member_0: "legacy0@test.com",
          member_1: "legacy1@test.com",
          member_2: "legacy2@test.com",
        },
      );
    });

    it("allows a listed legacy member to read", async () => {
      const ctx = authenticatedContext(env, "legacy0@test.com");
      const storage = ctx.storage();
      const ref = storage.ref(`print/${ENV}/media/legacy.epub`);
      await assertSucceeds(ref.getDownloadURL());
    });

    it("denies a non-listed email on a legacy object", async () => {
      const ctx = authenticatedContext(env, "stranger@test.com");
      const storage = ctx.storage();
      const ref = storage.ref(`print/${ENV}/media/legacy.epub`);
      await assertFails(ref.getDownloadURL());
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
