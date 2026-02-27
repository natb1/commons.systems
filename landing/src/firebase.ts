import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { firebaseConfig } from "@commons-systems/firebaseutil/config";
import { validateNamespace } from "@commons-systems/firestoreutil/namespace";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const emulatorHost = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST;
if (emulatorHost) {
  const url = new URL(`http://${emulatorHost}`);
  const port = Number(url.port);
  if (port > 0) {
    connectFirestoreEmulator(db, url.hostname, port);
  }
}

const envNamespace = import.meta.env.VITE_FIRESTORE_NAMESPACE as string;
if (!envNamespace && import.meta.env.MODE !== "production") {
  throw new Error(
    "VITE_FIRESTORE_NAMESPACE is required in dev/preview mode. " +
      "Set it in your .env or build command to avoid writing to production data.",
  );
}
export const NAMESPACE = envNamespace || "landing/prod";
validateNamespace(NAMESPACE);

export { db, app };
