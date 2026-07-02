import { describe, it, expect } from "vitest";
import { webcrypto } from "node:crypto";
import {
  encryptData,
  decryptData,
  MAGIC,
  HEADER_LEN,
} from "./crypto-core.js";

// Mirror the typed getRandomValues wrapper from persist.ts
const getRandomValues = (arr: Uint8Array): Uint8Array => {
  webcrypto.getRandomValues(arr as Uint8Array<ArrayBuffer>); // type-safety-ok: narrowing to typed array for the webcrypto API generic parameter (same pattern as persist.ts)
  return arr;
};

const subtle = webcrypto.subtle;

describe("encryptData / decryptData", () => {
  it("round-trips plaintext through encrypt then decrypt", async () => {
    const plaintext = "hello BENC world";
    const password = "test-password-123";
    const encrypted = await encryptData(subtle, getRandomValues, plaintext, password);
    const result = await decryptData(subtle, encrypted, password);
    expect(result).toBe(plaintext);
  });

  it("rejects decryption with the wrong password", async () => {
    const encrypted = await encryptData(subtle, getRandomValues, "secret", "correct-password");
    await expect(decryptData(subtle, encrypted, "wrong-password")).rejects.toThrow();
  });

  it("rejects data that does not start with MAGIC (not a BENC file)", async () => {
    const garbage = new Uint8Array(64).fill(0xff).buffer;
    await expect(decryptData(subtle, garbage, "any-password")).rejects.toThrow("Not a BENC encrypted file");
  });

  it("encrypted output starts with MAGIC bytes and is at least HEADER_LEN bytes", async () => {
    const encrypted = await encryptData(subtle, getRandomValues, "data", "pass");
    const bytes = new Uint8Array(encrypted);
    expect(bytes.length).toBeGreaterThanOrEqual(HEADER_LEN);
    // First 4 bytes must be "BENC"
    const magic = bytes.slice(0, MAGIC.length);
    expect(Array.from(magic)).toEqual(Array.from(MAGIC));
  });

  it("each encryption produces a different ciphertext (random salt/IV)", async () => {
    const plaintext = "same input";
    const password = "same-password";
    const enc1 = await encryptData(subtle, getRandomValues, plaintext, password);
    const enc2 = await encryptData(subtle, getRandomValues, plaintext, password);
    // Buffers should differ (different salt and IV)
    expect(Buffer.from(enc1).equals(Buffer.from(enc2))).toBe(false);
  });
});
