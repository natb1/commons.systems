import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { firebaseConfig } from "@commons-systems/firebaseutil/config";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const emulatorHost = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST;
if (emulatorHost) {
  const url = new URL(`http://${emulatorHost}`);
  connectFirestoreEmulator(db, url.hostname, Number(url.port));
}

const envNamespace = import.meta.env.VITE_FIRESTORE_NAMESPACE as string;
if (!envNamespace && import.meta.env.MODE !== "production") {
  throw new Error(
    "VITE_FIRESTORE_NAMESPACE is required in dev/preview mode. " +
      "Set it in your .env or build command to avoid writing to production data.",
  );
}
export const NAMESPACE = envNamespace || "landing/prod";

export { db, app };
