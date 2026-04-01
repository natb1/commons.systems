import { initFirebaseAdmin } from "../src/init.js";
import { deleteNamespace } from "../src/delete-namespace.js";
import { validateNamespace } from "../src/namespace.js";

const namespace = process.env.FIRESTORE_NAMESPACE;
if (!namespace) {
  console.error("FIRESTORE_NAMESPACE env var is required");
  process.exit(1);
}

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
const db = await initFirebaseAdmin();

console.log(`Deleting Firestore namespace "${namespace}"...`);
if (emulatorHost) {
  console.log(`Using emulator at ${emulatorHost}`);
}

const validatedNamespace = validateNamespace(namespace);
await deleteNamespace(db, validatedNamespace);
console.log("Namespace deleted.");
