import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
  type RulesTestContext,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach } from "vitest";
import { doc, setDoc, setLogLevel } from "firebase/firestore";

// Suppress Firestore client-side warnings about permission-denied (expected in tests)
setLogLevel("error");

const repoRoot = resolve(import.meta.dirname, "../..");

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
 * No afterAll cleanup needed — emulators:exec tears down the emulator process.
 */
export function setupCleanup(): void {
  afterEach(async () => {
    const env = await getTestEnv();
    await env.clearFirestore();
    await env.clearStorage();
  });
}
