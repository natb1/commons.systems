import { describe, it, expect } from "vitest";

import { isEncrypted, encrypt, decrypt } from "../src/crypto.js";
import { UploadValidationError } from "../src/upload.js";

describe("encrypt/decrypt", () => {
  it("round-trips a string through encrypt then decrypt", async () => {
    const original = '{"hello":"world"}';
    const password = "test-password-123";

    const encrypted = await encrypt(original, password);
    const decrypted = await decrypt(encrypted, password);

    expect(decrypted).toBe(original);
  });

  it("throws when encrypting with empty password", async () => {
    await expect(encrypt("data", "")).rejects.toThrow(
      "Password must not be empty",
    );
  });

  it("throws UploadValidationError when decrypting with wrong password", async () => {
    const encrypted = await encrypt("secret data", "correct-password");

    await expect(decrypt(encrypted, "wrong-password")).rejects.toThrow(
      UploadValidationError,
    );
    await expect(decrypt(encrypted, "wrong-password")).rejects.toThrow(
      "Wrong password or corrupted file",
    );
  });
});

describe("isEncrypted", () => {
  it("returns true for encrypted data (BENC magic bytes)", async () => {
    const encrypted = await encrypt("test", "password");
    expect(isEncrypted(encrypted)).toBe(true);
  });

  it("returns false for plaintext JSON", () => {
    const json = new TextEncoder().encode('{"key":"value"}');
    expect(isEncrypted(json.buffer)).toBe(false);
  });

  it("returns false for data shorter than 4 bytes", () => {
    const short = new Uint8Array([0x42, 0x45]).buffer;
    expect(isEncrypted(short)).toBe(false);
  });
});

describe("decrypt non-encrypted data", () => {
  it("throws UploadValidationError for plaintext input", async () => {
    const plaintext = new TextEncoder().encode('{"key":"value"}');

    await expect(decrypt(plaintext.buffer, "password")).rejects.toThrow(
      UploadValidationError,
    );
  });

  it("throws UploadValidationError for data too short to be encrypted", async () => {
    const short = new Uint8Array([0x01, 0x02]).buffer;

    await expect(decrypt(short, "password")).rejects.toThrow(
      UploadValidationError,
    );
    await expect(decrypt(short, "password")).rejects.toThrow(
      "File is not in BENC encrypted format",
    );
  });
});
