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
  console.warn(
    "VITE_FIRESTORE_NAMESPACE not set — using default production namespace. " +
      "This is expected in production builds but may indicate misconfiguration in dev/preview.",
  );
}
export const NAMESPACE = envNamespace || "hello-prod";

export { db, app };
