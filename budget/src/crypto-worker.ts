// Handles encrypt/decrypt in a Web Worker to avoid blocking the main thread.
// PBKDF2 with 600k iterations takes 200-500ms.

const MAGIC = new Uint8Array([0x42, 0x45, 0x4e, 0x43]); // "BENC"
const SALT_LEN = 16;
const IV_LEN = 12;
const HEADER_LEN = MAGIC.length + SALT_LEN + IV_LEN; // 32
const PBKDF2_ITERATIONS = 600000;

async function deriveKey(password: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const keyMaterial = await self.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return self.crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function doEncrypt(plaintext: string, password: string): Promise<ArrayBuffer> {
  const salt = self.crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const iv = self.crypto.getRandomValues(new Uint8Array(IV_LEN));
  const key = await deriveKey(password, salt);
  const ciphertext = await self.crypto.subtle.encrypt(
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

async function doDecrypt(data: ArrayBuffer, password: string): Promise<string> {
  const bytes = new Uint8Array(data);
  const salt = bytes.slice(MAGIC.length, MAGIC.length + SALT_LEN);
  const iv = bytes.slice(MAGIC.length + SALT_LEN, HEADER_LEN);
  const ciphertext = bytes.slice(HEADER_LEN);

  const key = await deriveKey(password, salt);
  const plaintext = await self.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext,
  );
  return new TextDecoder().decode(plaintext);
}

self.onmessage = async (e: MessageEvent) => {
  const { id, type, password } = e.data;
  try {
    if (type === "encrypt") {
      const result = await doEncrypt(e.data.plaintext, password);
      self.postMessage({ id, type: "result", data: result }, [result]);
    } else if (type === "decrypt") {
      const result = await doDecrypt(e.data.data, password);
      self.postMessage({ id, type: "result", data: result });
    }
  } catch (err) {
    const isOperation = err instanceof Error && err.name === "OperationError";
    self.postMessage({
      id,
      type: "error",
      message: err instanceof Error ? err.message : String(err),
      isValidation: isOperation,
    });
  }
};
