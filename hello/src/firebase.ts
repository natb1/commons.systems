import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const app = initializeApp({ projectId: "commons-systems" });
const db = getFirestore(app);

const emulatorHost = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST;
if (emulatorHost) {
  const [host, portStr] = emulatorHost.split(":");
  connectFirestoreEmulator(db, host, parseInt(portStr, 10));
}

export const NAMESPACE =
  (import.meta.env.VITE_FIRESTORE_NAMESPACE as string) || "prod";

export { db };
