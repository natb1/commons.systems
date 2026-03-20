// Shared BENC crypto primitives used by both crypto.ts (main thread) and
// crypto-worker.ts (Web Worker). No main-thread-only dependencies allowed here.
//
// BENC encrypted file format (shared with budget-etl/internal/export/export.go):
//   [magic 4B "BENC"][salt 16B][IV 12B][AES-256-GCM ciphertext + 16B auth tag]
// Key derivation: PBKDF2-HMAC-SHA256, 600k iterations, 256-bit key.

export const MAGIC = new Uint8Array([0x42, 0x45, 0x4e, 0x43]); // "BENC"
export const SALT_LEN = 16;
export const IV_LEN = 12;
export const HEADER_LEN = MAGIC.length + SALT_LEN + IV_LEN;
export const PBKDF2_ITERATIONS = 600000;
export const KEY_LEN = 32;

export async function deriveKey(
  subtleCrypto: SubtleCrypto,
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const keyMaterial = await subtleCrypto.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return subtleCrypto.deriveKey(
    { name: "PBKDF2", salt: salt as Uint8Array<ArrayBuffer>, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptData(
  subtleCrypto: SubtleCrypto,
  getRandomValues: (arr: Uint8Array) => Uint8Array,
  plaintext: string,
  password: string,
): Promise<ArrayBuffer> {
  const salt = getRandomValues(new Uint8Array(SALT_LEN));
  const iv = getRandomValues(new Uint8Array(IV_LEN));
  const key = await deriveKey(subtleCrypto, password, salt);
  const ciphertext = await subtleCrypto.encrypt(
    { name: "AES-GCM", iv: iv as Uint8Array<ArrayBuffer> },
    key,
    new TextEncoder().encode(plaintext),
  );

  const out = new Uint8Array(HEADER_LEN + ciphertext.byteLength);
  out.set(MAGIC, 0);
  out.set(salt, MAGIC.length);
  out.set(iv, MAGIC.length + SALT_LEN);
  out.set(new Uint8Array(ciphertext), HEADER_LEN);
  return out.buffer;
}

export async function decryptData(
  subtleCrypto: SubtleCrypto,
  data: ArrayBuffer,
  password: string,
): Promise<string> {
  const bytes = new Uint8Array(data);
  const salt = bytes.slice(MAGIC.length, MAGIC.length + SALT_LEN);
  const iv = bytes.slice(MAGIC.length + SALT_LEN, HEADER_LEN);
  const ciphertext = bytes.slice(HEADER_LEN);

  const key = await deriveKey(subtleCrypto, password, salt);
  const plaintext = await subtleCrypto.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext,
  );
  return new TextDecoder().decode(plaintext);
}
