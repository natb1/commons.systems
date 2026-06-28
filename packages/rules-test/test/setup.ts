import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
  type RulesTestContext,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { doc, getDoc, setDoc, setLogLevel, getDocs, collection, query, where } from "firebase/firestore";

// Suppress Firestore client-side warnings about permission-denied (expected in tests)
setLogLevel("error");

const repoRoot = resolve(import.meta.dirname, "../../..");

let testEnv: RulesTestEnvironment;

export async function getTestEnv(): Promise<RulesTestEnvironment> {
  if (!testEnv) {
    testEnv = await initializeTestEnvironment({
      projectId: "demo-commons-rules-test",
      firestore: {
        host: "127.0.0.1",
        port: 8080,
        rules: readFileSync(resolve(repoRoot, "firestore.rules"), "utf8"),
      },
      storage: {
        host: "127.0.0.1",
        port: 9199,
        rules: readFileSync(resolve(repoRoot, "storage.rules"), "utf8"),
      },
    });
  }
  return testEnv;
}

export function authenticatedContext(
  env: RulesTestEnvironment,
  email: string,
  uid?: string,
): RulesTestContext {
  return env.authenticatedContext(uid ?? email.replace("@", "_"), {
    email,
  });
}

export function unauthenticatedContext(
  env: RulesTestEnvironment,
): RulesTestContext {
  return env.unauthenticatedContext();
}

/** Write a document bypassing security rules (for test setup). */
export async function adminSetDoc(
  env: RulesTestEnvironment,
  path: string,
  data: Record<string, unknown>,
): Promise<void> {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, path), data);
  });
}

/** Upload a file to storage with metadata, bypassing security rules. */
export async function adminUploadStorage(
  env: RulesTestEnvironment,
  path: string,
  metadata: Record<string, string>,
): Promise<void> {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const storage = ctx.storage();
    const ref = storage.ref(path);
    await ref.put(new Uint8Array([0]), { customMetadata: metadata });
  });
}

/**
 * Register afterEach to clear emulator data between tests.
 * No afterAll cleanup needed — the emulator process lifecycle is managed
 * externally (emulators:exec in CI, manual start in dev).
 */
export function setupCleanup(): void {
  afterEach(async () => {
    const env = await getTestEnv();
    await Promise.all([env.clearFirestore(), env.clearStorage()]);
  });
}

/**
 * Shared describe block for `{app}/{env}/groups/{groupId}` collections.
 * Tests member-only read access and write-denied rules.
 */
export function describeGroupsCollection(appName: string): void {
  const ENV = "test";

  describe(`${appName} groups`, () => {
    let env: RulesTestEnvironment;

    beforeAll(async () => {
      env = await getTestEnv();
    });

    setupCleanup();

    beforeEach(async () => {
      await adminSetDoc(env, `${appName}/${ENV}/groups/group1`, {
        members: ["member@test.com"],
      });
    });

    it("allows group member to read", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        getDoc(doc(db, `${appName}/${ENV}/groups/group1`)),
      );
    });

    it("denies non-member read", async () => {
      const ctx = authenticatedContext(env, "stranger@test.com");
      const db = ctx.firestore();
      await assertFails(
        getDoc(doc(db, `${appName}/${ENV}/groups/group1`)),
      );
    });

    it("denies unauthenticated read", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertFails(
        getDoc(doc(db, `${appName}/${ENV}/groups/group1`)),
      );
    });

    it("denies write", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `${appName}/${ENV}/groups/group1`), { members: [] }),
      );
    });
  });
}

/**
 * Shared describe block for `{app}/{env}/media/{docId}` collections.
 * Tests public-domain read, member-only private read, and write-denied rules.
 */
export function describeMediaCollection(appName: string): void {
  const ENV = "test";

  describe(`${appName} media`, () => {
    let env: RulesTestEnvironment;

    beforeAll(async () => {
      env = await getTestEnv();
    });

    setupCleanup();

    beforeEach(async () => {
      await adminSetDoc(env, `${appName}/${ENV}/media/public1`, {
        publicDomain: true,
        title: "Public Book",
        memberEmails: ["member@test.com"],
      });
      await adminSetDoc(env, `${appName}/${ENV}/media/private1`, {
        publicDomain: false,
        title: "Private Book",
        memberEmails: ["member@test.com"],
      });
    });

    it("allows unauthenticated read of public domain media", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertSucceeds(
        getDoc(doc(db, `${appName}/${ENV}/media/public1`)),
      );
    });

    it("allows member read of private media", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertSucceeds(
        getDoc(doc(db, `${appName}/${ENV}/media/private1`)),
      );
    });

    it("denies non-member read of private media", async () => {
      const ctx = authenticatedContext(env, "stranger@test.com");
      const db = ctx.firestore();
      await assertFails(
        getDoc(doc(db, `${appName}/${ENV}/media/private1`)),
      );
    });

    it("denies unauthenticated read of private media", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertFails(
        getDoc(doc(db, `${appName}/${ENV}/media/private1`)),
      );
    });

    it("denies write", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `${appName}/${ENV}/media/new1`), {
          publicDomain: true,
          title: "New",
          memberEmails: [],
        }),
      );
    });
  });
}

/**
 * Shared describe block for `{collectionPath}` budget collections.
 * Tests the member-only list-query rule contract: a member can list with a
 * self-targeting `memberEmails array-contains` filter, while unfiltered,
 * unauthenticated, and other-member-targeting list queries are denied.
 */
export function describeListQueries(
  collectionPath: string,
  seedDoc: Record<string, unknown>,
): void {
  describe(`${collectionPath} list queries`, () => {
    let env: RulesTestEnvironment;

    beforeAll(async () => {
      env = await getTestEnv();
    });

    setupCleanup();

    beforeEach(async () => {
      await adminSetDoc(env, `${collectionPath}/existing1`, seedDoc);
    });

    it("allows member list query", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      const snap = await assertSucceeds(
        getDocs(
          query(
            collection(db, collectionPath),
            where("memberEmails", "array-contains", "member@test.com"),
          ),
        ),
      );
      expect(snap.empty).toBe(false);
    });

    it("denies unfiltered member list query", async () => {
      const ctx = authenticatedContext(env, "member@test.com");
      const db = ctx.firestore();
      await assertFails(getDocs(collection(db, collectionPath)));
    });

    // A non-member cannot list another member's docs: filtering for an email
    // they are not in is denied, because the matching docs carry a memberEmails
    // the requester is absent from. (A self-targeted array-contains filter is
    // always rule-compliant and returns an empty set, so it is not a denial
    // case.)
    it("denies authenticated non-member list query for another member's docs", async () => {
      const ctx = authenticatedContext(env, "stranger@test.com");
      const db = ctx.firestore();
      await assertFails(
        getDocs(
          query(
            collection(db, collectionPath),
            where("memberEmails", "array-contains", "member@test.com"),
          ),
        ),
      );
    });

    it("denies unauthenticated list query", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertFails(
        getDocs(
          query(
            collection(db, collectionPath),
            where("memberEmails", "array-contains", "member@test.com"),
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
            collection(db, collectionPath),
            where("memberEmails", "array-contains", "stranger@test.com"),
          ),
        ),
      );
      expect(snap.empty).toBe(true);
    });
  });
}
