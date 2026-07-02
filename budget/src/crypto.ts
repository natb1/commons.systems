import { UploadValidationError } from "./upload.js";
import { createBencCrypto, isEncrypted } from "@commons-systems/crypto";
export { SALT_LEN, IV_LEN, PBKDF2_ITERATIONS, KEY_LEN } from "@commons-systems/crypto";
export { isEncrypted };
const { encrypt, decrypt } = createBencCrypto({
  validationError: (m) => new UploadValidationError(m),
});
export { encrypt, decrypt };
