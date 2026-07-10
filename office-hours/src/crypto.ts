import { createBencCrypto, isEncrypted } from "@commons-systems/crypto";
export { SALT_LEN, IV_LEN, PBKDF2_ITERATIONS, KEY_LEN } from "@commons-systems/crypto";
export { isEncrypted };

// The snapshot validation error now lives in a zero-dependency module so the
// firebase-admin producer can throw it from decode without loading this file
// (which pulls `@commons-systems/crypto`'s browser Worker). Re-exported here for
// existing importers.
export { SnapshotValidationError } from "./snapshot-error.js";
import { SnapshotValidationError } from "./snapshot-error.js";

const { decrypt } = createBencCrypto({
  validationError: (m) => new SnapshotValidationError(m),
});
export { decrypt };
