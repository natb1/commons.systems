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

describe("storage audio media", () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    env = await getTestEnv();
  });

  setupCleanup();

  beforeEach(async () => {
    await adminUploadStorage(
      env,
      `audio/${ENV}/media/public-audiobook.mp3`,
      {
        publicDomain: "true",
        member_0: "member@test.com",
      },
    );
    await adminUploadStorage(
      env,
      `audio/${ENV}/media/private-audiobook.mp3`,
      {
        publicDomain: "false",
        member_0: "member@test.com",
        member_1: "other@test.com",
      },
    );
  });

  describe("public domain files", () => {
    it("allows unauthenticated read", async () => {
      const ctx = unauthenticatedContext(env);
      const storage = ctx.storage();
      const ref = storage.ref(`audio/${ENV}/media/public-audiobook.mp3`);
      await assertSucceeds(ref.getDownloadURL());
    });

    it("allows authenticated read", async () => {
      const ctx = authenticatedContext(env, "anyone@test.com");
      const storage = ctx.storage();
      const ref = storage.ref(`audio/${ENV}/media/public-audiobook.mp3`);
      await assertSucceeds(ref.getDownloadURL());
    });
  });

  describe("private files - member access", () => {
    it("allows member_0 to read", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const storage = ctx.storage();
      const ref = storage.ref(
        `audio/${ENV}/media/private-audiobook.mp3`,
      );
      await assertSucceeds(ref.getDownloadURL());
    });

    it("allows member_1 to read", async () => {
      const ctx = authenticatedContext(env, "other@test.com");
      const storage = ctx.storage();
      const ref = storage.ref(
        `audio/${ENV}/media/private-audiobook.mp3`,
      );
      await assertSucceeds(ref.getDownloadURL());
    });

    it("denies non-member read", async () => {
      const ctx = authenticatedContext(env, "stranger@test.com");
      const storage = ctx.storage();
      const ref = storage.ref(
        `audio/${ENV}/media/private-audiobook.mp3`,
      );
      await assertFails(ref.getDownloadURL());
    });

    it("denies unauthenticated read of private file", async () => {
      const ctx = unauthenticatedContext(env);
      const storage = ctx.storage();
      const ref = storage.ref(
        `audio/${ENV}/media/private-audiobook.mp3`,
      );
      await assertFails(ref.getDownloadURL());
    });
  });

  describe("write denied", () => {
    it("denies authenticated write", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const storage = ctx.storage();
      const ref = storage.ref(`audio/${ENV}/media/new-file.mp3`);
      await assertFails(ref.put(new Uint8Array([1, 2, 3])));
    });
  });
});
