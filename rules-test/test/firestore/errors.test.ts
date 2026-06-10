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
    extras: null,
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
        const noMessage = validErrorDoc();
        delete (noMessage as Record<string, unknown>).message;
        await assertFails(
          setDoc(doc(db, `${appName}/${ENV}/errors/err3`), noMessage),
        );
      });

      it("denies create missing required operation field", async () => {
        const ctx = unauthenticatedContext(env);
        const db = ctx.firestore();
        const noOp = validErrorDoc();
        delete (noOp as Record<string, unknown>).operation;
        await assertFails(
          setDoc(doc(db, `${appName}/${ENV}/errors/err4`), noOp),
        );
      });

      it("denies create missing required timestamp field", async () => {
        const ctx = unauthenticatedContext(env);
        const db = ctx.firestore();
        const noTs = validErrorDoc();
        delete (noTs as Record<string, unknown>).timestamp;
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

  // ---------------------------------------------------------------------------
  // Env allowlist tests (budget only, to bound runtime)
  // ---------------------------------------------------------------------------
  describe("budget errors — env allowlist", () => {
    it("denies fabricated env", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, "budget/zzz/errors/err1"), validErrorDoc()),
      );
    });

    it("denies qa- with empty suffix (trailing dash, no chars)", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, "budget/qa-/errors/err1"), validErrorDoc()),
      );
    });

    it("denies preview-pr- with no number", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, "budget/preview-pr-/errors/err1"), validErrorDoc()),
      );
    });

    it("denies preview-pr-abc (non-numeric suffix)", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, "budget/preview-pr-abc/errors/err1"), validErrorDoc()),
      );
    });

    it("allows demo env", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertSucceeds(
        setDoc(doc(db, "budget/demo/errors/err1"), validErrorDoc()),
      );
    });

    it("allows preview-pr-42 env", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertSucceeds(
        setDoc(doc(db, "budget/preview-pr-42/errors/err1"), validErrorDoc()),
      );
    });

    it("allows qa-<id> env", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertSucceeds(
        setDoc(doc(db, "budget/qa-1296-foo/errors/err1"), validErrorDoc()),
      );
    });

    it("allows emulator-<id> env", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertSucceeds(
        setDoc(doc(db, "budget/emulator-abc/errors/err1"), validErrorDoc()),
      );
    });

    it("allows bare qa env", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertSucceeds(
        setDoc(doc(db, "budget/qa/errors/err1"), validErrorDoc()),
      );
    });

    it("allows bare emulator env", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertSucceeds(
        setDoc(doc(db, "budget/emulator/errors/err1"), validErrorDoc()),
      );
    });

    it("allows prod env", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertSucceeds(
        setDoc(doc(db, "budget/prod/errors/err1"), validErrorDoc()),
      );
    });

    it("denies emulator- with empty suffix (trailing dash, no chars)", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, "budget/emulator-/errors/err1"), validErrorDoc()),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Schema / shape tests (budget only, to bound runtime)
  // ---------------------------------------------------------------------------
  describe("budget errors — schema enforcement", () => {
    it("denies unexpected extra top-level key (hasOnly)", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `budget/${ENV}/errors/err1`), { ...validErrorDoc(), bogus: "x" }),
      );
    });

    it("denies oversized message (10001 chars)", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `budget/${ENV}/errors/err1`), { ...validErrorDoc(), message: "x".repeat(10001) }),
      );
    });

    it("denies oversized operation (201 chars)", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `budget/${ENV}/errors/err1`), { ...validErrorDoc(), operation: "x".repeat(201) }),
      );
    });

    it("denies oversized stack (50001 chars)", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `budget/${ENV}/errors/err1`), { ...validErrorDoc(), stack: "x".repeat(50001) }),
      );
    });

    it("denies oversized extras (10001 chars)", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `budget/${ENV}/errors/err1`), { ...validErrorDoc(), extras: "x".repeat(10001) }),
      );
    });

    it("denies oversized url (2001 chars)", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `budget/${ENV}/errors/err1`), { ...validErrorDoc(), url: "x".repeat(2001) }),
      );
    });

    it("denies oversized userAgent (501 chars)", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `budget/${ENV}/errors/err1`), { ...validErrorDoc(), userAgent: "x".repeat(501) }),
      );
    });

    it("denies oversized uid (129 chars)", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `budget/${ENV}/errors/err1`), { ...validErrorDoc(), uid: "x".repeat(129) }),
      );
    });

    it("denies oversized email (321 chars)", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `budget/${ENV}/errors/err1`), { ...validErrorDoc(), email: "x".repeat(321) }),
      );
    });

    it("denies oversized code (201 chars)", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `budget/${ENV}/errors/err1`), { ...validErrorDoc(), code: "x".repeat(201) }),
      );
    });

    it("denies oversized kind (33 chars)", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `budget/${ENV}/errors/err1`), { ...validErrorDoc(), kind: "x".repeat(33) }),
      );
    });

    it("denies non-string optional field kind (number)", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `budget/${ENV}/errors/err1`), { ...validErrorDoc(), kind: 123 }),
      );
    });

    it("denies non-string optional field url (number)", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `budget/${ENV}/errors/err1`), { ...validErrorDoc(), url: 5 }),
      );
    });

    it("denies non-string optional field extras (number)", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertFails(
        setDoc(doc(db, `budget/${ENV}/errors/err1`), { ...validErrorDoc(), extras: 5 }),
      );
    });

    it("allows all optional fields set to null", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertSucceeds(
        setDoc(doc(db, `budget/${ENV}/errors/err1`), {
          message: "Test error",
          operation: "test-op",
          timestamp: Timestamp.now(),
          kind: null,
          stack: null,
          code: null,
          userAgent: null,
          url: null,
          uid: null,
          email: null,
          extras: null,
        }),
      );
    });

    it("allows valid populated extras string", async () => {
      const ctx = unauthenticatedContext(env);
      const db = ctx.firestore();
      await assertSucceeds(
        setDoc(doc(db, `budget/${ENV}/errors/err1`), {
          ...validErrorDoc(),
          extras: '{"txnId":"abc123","postId":42}',
        }),
      );
    });
  });
});
