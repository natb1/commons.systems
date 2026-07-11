import { classifyError } from "@commons-systems/errorutil/classify";
import { logError } from "@commons-systems/errorutil/log";
import {
  MAGIC, SALT_LEN, IV_LEN, HEADER_LEN, PBKDF2_ITERATIONS, KEY_LEN,
  encryptData, decryptData,
} from "./crypto-core.js";

export { SALT_LEN, IV_LEN, HEADER_LEN, PBKDF2_ITERATIONS, KEY_LEN };

export function isEncrypted(data: ArrayBuffer): boolean {
  if (data.byteLength < MAGIC.length) return false;
  const header = new Uint8Array(data, 0, MAGIC.length);
  return header.every((b, i) => b === MAGIC[i]);
}

export interface BencCrypto {
  encrypt(plaintext: string, password: string): Promise<ArrayBuffer>;
  decrypt(data: ArrayBuffer, password: string): Promise<string>;
}

// Factory: each app that calls createBencCrypto gets its OWN single worker.
// The validationError injection lets the caller supply its own error type
// (e.g. budget's UploadValidationError) without this package depending on it.
export function createBencCrypto(opts: { validationError: (message: string) => Error }): BencCrypto {
  const { validationError } = opts;

  // Worker delegation: PBKDF2 with 600k iterations is computationally expensive
  // (hundreds of ms on typical desktop hardware), so encrypt/decrypt run in a Web
  // Worker to avoid blocking the main thread. Falls back to direct crypto.subtle
  // in environments without Workers (e.g., unit tests, Node.js).

  let worker: Worker | null = null;
  let msgId = 0;
  const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

  function getWorker(): Worker | null {
    if (worker) return worker;
    if (typeof Worker === "undefined") return null;
    try {
      worker = new Worker(new URL("./crypto-worker.ts", import.meta.url), { type: "module" });
      worker.onmessage = (e: MessageEvent) => {
        const { id, type, data, message, isValidation } = e.data;
        const p = pending.get(id);
        if (!p) { logError(new Error("crypto worker response for unknown id"), { operation: "crypto-worker", id }); return; }
        pending.delete(id);
        if (type === "result") {
          p.resolve(data);
        } else {
          const err = isValidation
            ? validationError("Wrong password or corrupted file.")
            : new Error(message);
          p.reject(err);
        }
      };
      worker.onerror = (e: ErrorEvent) => {
        for (const [, p] of pending) {
          p.reject(new Error(e.message || "Worker error"));
        }
        pending.clear();
        // Terminate the worker before dropping the reference so the PBKDF2
        // thread is reclaimed; nulling alone leaks it.
        worker?.terminate();
        worker = null;
      };
      return worker;
    } catch (err) {
      // Silent degradation: fall back to main-thread crypto if worker init fails.
      logError(err, { operation: "crypto-worker-init" });
      return null;
    }
  }

  function postToWorker<T>(msg: Record<string, unknown>): Promise<T> {
    const w = getWorker();
    if (!w) throw new Error("crypto worker unavailable");
    const id = msgId++;
    return new Promise<T>((resolve, reject) => {
      pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
      const msgData = msg.data;
      if (msgData instanceof ArrayBuffer) {
        w.postMessage({ ...msg, id }, [msgData]);
      } else {
        w.postMessage({ ...msg, id });
      }
    });
  }

  async function encrypt(plaintext: string, password: string): Promise<ArrayBuffer> {
    if (!password) throw new Error("Password must not be empty for encryption.");
    if (getWorker()) {
      return postToWorker<ArrayBuffer>({ type: "encrypt", plaintext, password });
    }
    return encryptData(crypto.subtle, (a) => crypto.getRandomValues(a), plaintext, password);
  }

  async function decrypt(data: ArrayBuffer, password: string): Promise<string> {
    if (data.byteLength < HEADER_LEN || !isEncrypted(data)) {
      throw validationError("File is not in BENC encrypted format.");
    }
    if (getWorker()) {
      return postToWorker<string>({ type: "decrypt", data, password });
    }
    try {
      return await decryptData(crypto.subtle, data, password);
    } catch (err) {
      if (classifyError(err) === "programmer") throw err;
      if (err instanceof Error && err.name === "OperationError") {
        throw validationError("Wrong password or corrupted file.");
      }
      throw err;
    }
  }

  return { encrypt, decrypt };
}
