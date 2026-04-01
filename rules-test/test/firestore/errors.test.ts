import { describe, it, beforeAll } from "vitest";
import { assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, deleteDoc, updateDoc, Timestamp } from "firebase/firestore";
import {
  getTestEnv,
  authenticatedContext,
  unauthenticatedContext,
  adminSetDoc,
  setupCleanup,
} from "../setup.js";

const ENV = "test";

const KNOWN_APPS = ["budget", "landing", "fellspiral", "print", "audio"];

function validErrorDoc() {
  return {
    message: "Test error",
    operation: "test-op",
    timestamp: Timestamp.now(),
    kind: "unknown",
    stack: null,
    code: null,
    userAgent: "test-agent",
    url: "http://localhost",
    uid: null,
    email: null,
  };
}

describe("error logs", () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    env = await getTestEnv();
  });

  setupCleanup();

  for (const appName of KNOWN_APPS) {
    describe(`${appName} errors`, () => {
      it("allows unauthenticated create with valid fields", async () => {
        const ctx = unauthenticatedContext(env);
        const db = ctx.firestore();
        await assertSucceeds(
          setDoc(doc(db, `${appName}/${ENV}/errors/err1`), validErrorDoc()),
        );
      });

      it("allows authenticated create with valid fields", async () => {
        const ctx = authenticatedContext(env, "user@test.com");
        const db = ctx.firestore();
        await assertSucceeds(
          setDoc(doc(db, `${appName}/${ENV}/errors/err2`), validErrorDoc()),
        );
      });

      it("denies create missing required message field", async () => {
        const ctx = unauthenticatedContext(env);
        const db = ctx.firestore();
        const { message: _, ...noMessage } = validErrorDoc();
        await assertFails(
          setDoc(doc(db, `${appName}/${ENV}/errors/err3`), noMessage),
        );
      });

      it("denies create missing required operation field", async () => {
        const ctx = unauthenticatedContext(env);
        const db = ctx.firestore();
        const { operation: _, ...noOp } = validErrorDoc();
        await assertFails(
          setDoc(doc(db, `${appName}/${ENV}/errors/err4`), noOp),
        );
      });

      it("denies create missing required timestamp field", async () => {
        const ctx = unauthenticatedContext(env);
        const db = ctx.firestore();
        const { timestamp: _, ...noTs } = validErrorDoc();
        await assertFails(
          setDoc(doc(db, `${appName}/${ENV}/errors/err5`), noTs),
        );
      });

      it("denies create with non-string message", async () => {
        const ctx = unauthenticatedContext(env);
        const db = ctx.firestore();
        await assertFails(
          setDoc(doc(db, `${appName}/${ENV}/errors/err6`), { ...validErrorDoc(), message: 123 }),
        );
      });

      it("denies create with non-string operation", async () => {
        const ctx = unauthenticatedContext(env);
        const db = ctx.firestore();
        await assertFails(
          setDoc(doc(db, `${appName}/${ENV}/errors/err7`), { ...validErrorDoc(), operation: 456 }),
        );
      });

      it("denies read", async () => {
        const ctx = authenticatedContext(env, "user@test.com");
        const db = ctx.firestore();
        await adminSetDoc(env, `${appName}/${ENV}/errors/existing`, validErrorDoc());
        await assertFails(
          getDoc(doc(db, `${appName}/${ENV}/errors/existing`)),
        );
      });

      it("denies update", async () => {
        const ctx = authenticatedContext(env, "user@test.com");
        const db = ctx.firestore();
        await adminSetDoc(env, `${appName}/${ENV}/errors/existing2`, validErrorDoc());
        await assertFails(
          updateDoc(doc(db, `${appName}/${ENV}/errors/existing2`), { message: "updated" }),
        );
      });

      it("denies delete", async () => {
        const ctx = authenticatedContext(env, "user@test.com");
        const db = ctx.firestore();
        await adminSetDoc(env, `${appName}/${ENV}/errors/existing3`, validErrorDoc());
        await assertFails(
          deleteDoc(doc(db, `${appName}/${ENV}/errors/existing3`)),
        );
      });
    });
  }

  it("denies create to unknown app name", async () => {
    const ctx = unauthenticatedContext(env);
    const db = ctx.firestore();
    await assertFails(
      setDoc(doc(db, `unknownapp/${ENV}/errors/err1`), validErrorDoc()),
    );
  });
});
