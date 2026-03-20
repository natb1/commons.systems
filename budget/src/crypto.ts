// BENC encrypted file format (shared with budget-etl/internal/export/export.go and budget/e2e/helpers.ts):
//   [magic 4B "BENC"][salt 16B][IV 12B][AES-256-GCM ciphertext + 16B auth tag]
// Key derivation: PBKDF2-HMAC-SHA256, 600k iterations, 256-bit key.
import { UploadValidationError } from "./upload.js";

const MAGIC = new Uint8Array([0x42, 0x45, 0x4e, 0x43]); // "BENC"
const SALT_LEN = 16;
const IV_LEN = 12;
const HEADER_LEN = MAGIC.length + SALT_LEN + IV_LEN; // 32
const PBKDF2_ITERATIONS = 600000;

export function isEncrypted(data: ArrayBuffer): boolean {
  if (data.byteLength < MAGIC.length) return false;
  const header = new Uint8Array(data, 0, MAGIC.length);
  return header.every((b, i) => b === MAGIC[i]);
}

async function deriveKey(password: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encrypt(plaintext: string, password: string): Promise<ArrayBuffer> {
  if (!password) throw new Error("Password must not be empty for encryption.");
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const key = await deriveKey(password, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
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

export async function decrypt(data: ArrayBuffer, password: string): Promise<string> {
  if (data.byteLength < HEADER_LEN) {
    throw new UploadValidationError("File too short to be encrypted.");
  }
  const bytes = new Uint8Array(data);
  const salt = bytes.slice(MAGIC.length, MAGIC.length + SALT_LEN);
  const iv = bytes.slice(MAGIC.length + SALT_LEN, HEADER_LEN);
  const ciphertext = bytes.slice(HEADER_LEN);

  const key = await deriveKey(password, salt);
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext,
    );
    return new TextDecoder().decode(plaintext);
  } catch (err) {
    if (err instanceof TypeError || err instanceof ReferenceError) throw err;
    throw new UploadValidationError("Wrong password or corrupted file.");
  }
}
