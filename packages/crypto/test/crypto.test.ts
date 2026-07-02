import { describe, it, expect } from "vitest";

import { encryptData, decryptData, SALT_LEN, IV_LEN, PBKDF2_ITERATIONS, KEY_LEN } from "@commons-systems/crypto/core";
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
