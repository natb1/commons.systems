import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { firebaseConfig } from "@commons-systems/firebaseutil/config";
import { validateNamespace } from "@commons-systems/firestoreutil/namespace";
import { initAnalytics } from "@commons-systems/analyticsutil";

function parseEmulatorHost(envVar: string, value: string): { hostname: string; port: number } {
  const url = new URL(`http://${value}`);
  const port = Number(url.port);
  if (!(port > 0)) {
    throw new Error(`Invalid emulator port in ${envVar}: "${value}"`);
  }
  return { hostname: url.hostname, port };
}

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as
  | string
  | undefined;
const app = initializeApp(
  measurementId ? { ...firebaseConfig, measurementId } : firebaseConfig,
);
const db = getFirestore(app);

const firestoreEmulatorHost = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST;
if (firestoreEmulatorHost) {
  const { hostname, port } = parseEmulatorHost("VITE_FIRESTORE_EMULATOR_HOST", firestoreEmulatorHost);
  connectFirestoreEmulator(db, hostname, port);
}

const storage = getStorage(app);

const storageEmulatorHost = import.meta.env.VITE_STORAGE_EMULATOR_HOST;
if (storageEmulatorHost) {
  const { hostname, port } = parseEmulatorHost("VITE_STORAGE_EMULATOR_HOST", storageEmulatorHost);
  connectStorageEmulator(storage, hostname, port);
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

// Storage paths are shared across environments — large media binaries are not
// duplicated per preview branch. All environments read from prod storage.
export const STORAGE_NAMESPACE = "print/prod";

export const trackPageView = initAnalytics(app);

export { db, storage, app };
