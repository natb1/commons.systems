import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { deleteNamespace } from "../src/delete-namespace.js";

const namespace = process.env.FIRESTORE_NAMESPACE;
if (!namespace) {
  console.error("FIRESTORE_NAMESPACE env var is required");
  process.exit(1);
}

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;

if (emulatorHost) {
  // When using the emulator, initialize without credentials
  initializeApp({ projectId: "commons-systems" });
} else {
  // Production: use application default credentials or service account
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (serviceAccountPath) {
    const serviceAccount = (
      await import(serviceAccountPath, { with: { type: "json" } })
    ).default as ServiceAccount;
    initializeApp({ credential: cert(serviceAccount) });
  } else {
    initializeApp({ projectId: "commons-systems" });
  }
}

const db = getFirestore();

console.log(`Deleting Firestore namespace "${namespace}"...`);
if (emulatorHost) {
  console.log(`Using emulator at ${emulatorHost}`);
}

await deleteNamespace(db, namespace);
console.log("Namespace deleted.");
