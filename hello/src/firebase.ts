import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { firebaseConfig } from "@commons-systems/firebaseutil/config";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const emulatorHost = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST;
if (emulatorHost) {
  const parts = emulatorHost.split(":");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(
      `Invalid VITE_FIRESTORE_EMULATOR_HOST: "${emulatorHost}" (expected "host:port")`,
    );
  }
  const port = parseInt(parts[1], 10);
  if (Number.isNaN(port)) {
    throw new Error(
      `Invalid port in VITE_FIRESTORE_EMULATOR_HOST: "${parts[1]}" is not a number`,
    );
  }
  connectFirestoreEmulator(db, parts[0], port);
}

const envNamespace = import.meta.env.VITE_FIRESTORE_NAMESPACE as string;
if (!envNamespace && import.meta.env.MODE !== "production") {
  throw new Error(
    "VITE_FIRESTORE_NAMESPACE is required in dev/preview mode. " +
      "Set it in your .env or build command to avoid writing to production data.",
  );
}
export const NAMESPACE = envNamespace || "hello-prod";

export { db, app };
