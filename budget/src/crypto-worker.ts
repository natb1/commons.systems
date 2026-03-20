// Handles encrypt/decrypt in a Web Worker to avoid blocking the main thread.
// PBKDF2 with 600k iterations is computationally expensive.

import { encryptData, decryptData } from "./crypto-core.js";

self.onmessage = async (e: MessageEvent) => {
  const { id, type, password } = e.data;
  try {
    if (type === "encrypt") {
      const result = await encryptData(
        self.crypto.subtle,
        (a) => self.crypto.getRandomValues(a),
        e.data.plaintext,
        password,
      );
      self.postMessage({ id, type: "result", data: result }, { transfer: [result] });
    } else if (type === "decrypt") {
      const result = await decryptData(self.crypto.subtle, e.data.data, password);
      self.postMessage({ id, type: "result", data: result });
    } else {
      self.postMessage({ id, type: "error", message: `Unknown message type: ${type}`, isValidation: false });
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
