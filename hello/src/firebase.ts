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
  connectFirestoreEmulator(db, parts[0], parseInt(parts[1], 10));
}

export const NAMESPACE =
  (import.meta.env.VITE_FIRESTORE_NAMESPACE as string) || "hello-prod";

export { db, app };
