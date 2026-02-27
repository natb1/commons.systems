import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { firebaseConfig } from "@commons-systems/firebaseutil/config";
import { validateNamespace } from "@commons-systems/firestoreutil/namespace";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const firestoreEmulatorHost = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST;
if (firestoreEmulatorHost) {
  const url = new URL(`http://${firestoreEmulatorHost}`);
  const port = Number(url.port);
  if (!(port > 0)) {
    throw new Error(
      `Invalid emulator port in VITE_FIRESTORE_EMULATOR_HOST: "${firestoreEmulatorHost}"`,
    );
  }
  connectFirestoreEmulator(db, url.hostname, port);
}

const storageEmulatorHost = import.meta.env.VITE_STORAGE_EMULATOR_HOST;
if (storageEmulatorHost) {
  const url = new URL(`http://${storageEmulatorHost}`);
  const port = Number(url.port);
  if (!(port > 0)) {
    throw new Error(
      `Invalid emulator port in VITE_STORAGE_EMULATOR_HOST: "${storageEmulatorHost}"`,
    );
  }
  connectStorageEmulator(storage, url.hostname, port);
}

const envNamespace = import.meta.env.VITE_FIRESTORE_NAMESPACE as string;
if (!envNamespace && import.meta.env.MODE !== "production") {
  throw new Error(
    "VITE_FIRESTORE_NAMESPACE is required in dev/preview mode. " +
      "Set it in your .env or build command to avoid writing to production data.",
  );
}
export const NAMESPACE = envNamespace || "print/prod";
validateNamespace(NAMESPACE);

export { db, app, storage };
