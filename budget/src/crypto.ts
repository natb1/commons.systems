import { classifyError } from "@commons-systems/errorutil/classify";
import { logError } from "@commons-systems/errorutil/log";
import { UploadValidationError } from "./upload.js";
import {
  MAGIC, SALT_LEN, IV_LEN, HEADER_LEN, PBKDF2_ITERATIONS, KEY_LEN,
  encryptData, decryptData,
} from "./crypto-core.js";

export { SALT_LEN, IV_LEN, PBKDF2_ITERATIONS, KEY_LEN };

export function isEncrypted(data: ArrayBuffer): boolean {
  if (data.byteLength < MAGIC.length) return false;
  const header = new Uint8Array(data, 0, MAGIC.length);
  return header.every((b, i) => b === MAGIC[i]);
}

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
          ? new UploadValidationError("Wrong password or corrupted file.")
          : new Error(message);
        p.reject(err);
      }
    };
    worker.onerror = (e: ErrorEvent) => {
      for (const [, p] of pending) {
        p.reject(new Error(e.message || "Worker error"));
      }
      pending.clear();
      worker = null;
    };
    return worker;
  } catch (err) {
    logError(err, { operation: "crypto-worker-init" });
    return null;
  }
}

function postToWorker(msg: Record<string, unknown>): Promise<unknown> {
  const w = getWorker();
  if (!w) throw new Error("crypto worker unavailable");
  const id = msgId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    if (msg.data instanceof ArrayBuffer) {
      w.postMessage({ ...msg, id }, [msg.data as ArrayBuffer]);
    } else {
      w.postMessage({ ...msg, id });
    }
  });
}

export async function encrypt(plaintext: string, password: string): Promise<ArrayBuffer> {
  if (!password) throw new Error("Password must not be empty for encryption.");
  if (getWorker()) {
    return postToWorker({ type: "encrypt", plaintext, password }) as Promise<ArrayBuffer>;
  }
  return encryptData(crypto.subtle, (a) => crypto.getRandomValues(a), plaintext, password);
}

export async function decrypt(data: ArrayBuffer, password: string): Promise<string> {
  if (data.byteLength < HEADER_LEN || !isEncrypted(data)) {
    throw new UploadValidationError("File is not in BENC encrypted format.");
  }
  if (getWorker()) {
    return postToWorker({ type: "decrypt", data, password }) as Promise<string>;
  }
  try {
    return await decryptData(crypto.subtle, data, password);
  } catch (err) {
    if (classifyError(err) === "programmer") throw err;
    if (err instanceof Error && err.name === "OperationError") {
      throw new UploadValidationError("Wrong password or corrupted file.");
    }
    throw err;
  }
}
