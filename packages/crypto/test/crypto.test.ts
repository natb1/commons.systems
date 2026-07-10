import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { encryptData, decryptData, SALT_LEN, IV_LEN, PBKDF2_ITERATIONS, KEY_LEN } from "@commons-systems/crypto-core";
import { createBencCrypto, isEncrypted } from "@commons-systems/crypto";

// Test-local injected error type — stands in for the app's own validation error
// (e.g. budget's UploadValidationError) to prove the factory routes through it.
class TestValidationError extends Error {}

const makeCrypto = () =>
  createBencCrypto({ validationError: (message) => new TestValidationError(message) });

describe("crypto-core round-trip", () => {
  it("encryptData then decryptData preserves the plaintext", async () => {
    const original = '{"hello":"world"}';
    const password = "test-password-123";

    const encrypted = await encryptData(
      crypto.subtle,
      (a) => crypto.getRandomValues(a),
      original,
      password,
    );
    const decrypted = await decryptData(crypto.subtle, encrypted, password);

    expect(decrypted).toBe(original);
  });
});

describe("format constants", () => {
  it("match the shared BENC format", () => {
    expect(SALT_LEN).toBe(16);
    expect(IV_LEN).toBe(12);
    expect(PBKDF2_ITERATIONS).toBe(600000);
    expect(KEY_LEN).toBe(32);
  });
});

describe("isEncrypted", () => {
  it("returns true for a valid BENC header", async () => {
    const encrypted = await encryptData(
      crypto.subtle,
      (a) => crypto.getRandomValues(a),
      "test",
      "password",
    );
    expect(isEncrypted(encrypted)).toBe(true);
  });

  it("returns false for random / non-BENC bytes", () => {
    const random = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]);
    expect(isEncrypted(random.buffer)).toBe(false);
  });
});

describe("createBencCrypto factory", () => {
  it("round-trips a string through encrypt then decrypt", async () => {
    const { encrypt, decrypt } = makeCrypto();
    const original = '{"a":1}';
    const password = "correct-horse";

    const encrypted = await encrypt(original, password);
    expect(await decrypt(encrypted, password)).toBe(original);
  });

  it("throws when encrypting with an empty password", async () => {
    const { encrypt } = makeCrypto();
    await expect(encrypt("data", "")).rejects.toThrow("Password must not be empty");
  });

  it("throws the injected validation error on non-BENC input to decrypt", async () => {
    const { decrypt } = makeCrypto();
    const plaintext = new TextEncoder().encode('{"key":"value"}');

    await expect(decrypt(plaintext.buffer, "password")).rejects.toThrow(TestValidationError);
    await expect(decrypt(plaintext.buffer, "password")).rejects.toThrow(
      "File is not in BENC encrypted format",
    );
  });

  it("throws the injected validation error on a wrong password", async () => {
    const { encrypt, decrypt } = makeCrypto();
    const encrypted = await encrypt("secret data", "correct-password");

    await expect(decrypt(encrypted, "wrong-password")).rejects.toThrow(TestValidationError);
    await expect(decrypt(encrypted, "wrong-password")).rejects.toThrow(
      "Wrong password or corrupted file",
    );
  });
});

// The buffer-transfer footgun only exists on the Web Worker path: postToWorker
// posts the input buffer to the worker, and a real Worker's structured-clone
// transfer DETACHES it in the caller's realm. The default vitest (node) env has
// no Worker, so the factory tests above take the main-thread fallback and never
// exercise transfer. Here we install a stub Worker that faithfully emulates
// transfer via structuredClone({ transfer }) — which really detaches the listed
// buffers in Node — so the regression test genuinely guards the clone-before-
// transfer fix in crypto.ts. Without the clone, this stub would detach the
// caller's buffer and the retry would throw the misleading "not in BENC format".
interface CryptoWorkerRequest {
  id: number;
  type: string;
  password: string;
  plaintext?: string;
  data?: ArrayBuffer;
}

interface CryptoWorkerResponse {
  id: number;
  type: "result" | "error";
  data?: unknown;
  message?: string;
  isValidation?: boolean;
}

describe("createBencCrypto worker path (buffer transfer)", () => {
  let originalWorker: unknown;

  // Runtime-only stand-in for the global Worker; installed via Reflect so it
  // need not structurally satisfy the DOM Worker constructor type.
  class StubCryptoWorker {
    onmessage: ((e: { data: CryptoWorkerResponse }) => void) | null = null;

    postMessage(message: CryptoWorkerRequest, transfer: ArrayBuffer[] = []): void {
      // Faithful transfer emulation: the worker receives a structured clone, and
      // every buffer in `transfer` is detached in this (the caller's) realm.
      const received = structuredClone(message, { transfer });
      const { id, type, password } = received;
      void (async () => {
        try {
          if (type === "encrypt") {
            if (received.plaintext === undefined) throw new Error("stub worker: missing plaintext");
            const result = await encryptData(
              crypto.subtle,
              (a) => crypto.getRandomValues(a),
              received.plaintext,
              password,
            );
            this.onmessage?.({ data: { id, type: "result", data: result } });
          } else if (type === "decrypt") {
            if (received.data === undefined) throw new Error("stub worker: missing data");
            const result = await decryptData(crypto.subtle, received.data, password);
            this.onmessage?.({ data: { id, type: "result", data: result } });
          } else {
            this.onmessage?.({
              data: { id, type: "error", message: `Unknown message type: ${type}`, isValidation: false },
            });
          }
        } catch (err) {
          const isOperation = err instanceof Error && err.name === "OperationError";
          this.onmessage?.({
            data: {
              id,
              type: "error",
              message: err instanceof Error ? err.message : String(err),
              isValidation: isOperation,
            },
          });
        }
      })();
    }

    terminate(): void {}
  }

  beforeEach(() => {
    originalWorker = Reflect.get(globalThis, "Worker");
    Reflect.set(globalThis, "Worker", StubCryptoWorker);
  });

  afterEach(() => {
    Reflect.set(globalThis, "Worker", originalWorker);
  });

  it("round-trips through the worker path when Worker is defined", async () => {
    const { encrypt, decrypt } = makeCrypto();
    const encrypted = await encrypt("hello worker", "pw");
    expect(await decrypt(encrypted, "pw")).toBe("hello worker");
  });

  it("does not detach the caller's buffer, so a retry after a wrong password succeeds", async () => {
    const { encrypt, decrypt } = makeCrypto();
    const encrypted = await encrypt("secret data", "correct-password");

    // Wrong password: the worker transfers a CLONE, so `encrypted` stays intact.
    await expect(decrypt(encrypted, "wrong-password")).rejects.toThrow(TestValidationError);
    expect(encrypted.byteLength).toBeGreaterThan(0);

    // Retrying on the SAME buffer must decrypt — NOT throw "not in BENC format".
    expect(await decrypt(encrypted, "correct-password")).toBe("secret data");
  });
});
