import { createBencCrypto, isEncrypted } from "@commons-systems/crypto";
export { SALT_LEN, IV_LEN, PBKDF2_ITERATIONS, KEY_LEN } from "@commons-systems/crypto";
export { isEncrypted };

export class SnapshotValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SnapshotValidationError";
  }
}

const { decrypt } = createBencCrypto({
  validationError: (m) => new SnapshotValidationError(m),
});
export { decrypt };
