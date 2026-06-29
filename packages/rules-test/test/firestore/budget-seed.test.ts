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

const seedCollections = [
  "seed-transactions",
  "seed-budgets",
  "seed-statements",
  "seed-budget-periods",
  "seed-normalization-rules",
  "seed-rules",
  "seed-weekly-aggregates",
];

describe("budget seed collections", () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    env = await getTestEnv();
  });

  setupCleanup();

  beforeEach(async () => {
    for (const collection of seedCollections) {
      await adminSetDoc(env, `budget/${ENV}/${collection}/doc1`, {
        example: true,
      });
    }
  });

  for (const collection of seedCollections) {
    describe(collection, () => {
      it("allows unauthenticated read", async () => {
        const ctx = unauthenticatedContext(env);
        const db = ctx.firestore();
        await assertSucceeds(
          getDoc(doc(db, `budget/${ENV}/${collection}/doc1`)),
        );
      });

      it("allows authenticated read", async () => {
        const ctx = authenticatedContext(env, "user@test.com");
        const db = ctx.firestore();
        await assertSucceeds(
          getDoc(doc(db, `budget/${ENV}/${collection}/doc1`)),
        );
      });

      it("denies write", async () => {
        const ctx = authenticatedContext(env, "user@test.com");
        const db = ctx.firestore();
        await assertFails(
          setDoc(doc(db, `budget/${ENV}/${collection}/doc1`), { x: 1 }),
        );
      });
    });
  }
});
