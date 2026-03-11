import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { firebaseConfig } from "@commons-systems/firebaseutil/config";
import { validateNamespace } from "@commons-systems/firestoreutil/namespace";
import { initAnalytics } from "@commons-systems/analyticsutil";

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as
  | string
  | undefined;
const app = initializeApp(
  measurementId ? { ...firebaseConfig, measurementId } : firebaseConfig,
);
const db = getFirestore(app);

const emulatorHost = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST;
if (emulatorHost) {
  const url = new URL(`http://${emulatorHost}`);
  const port = Number(url.port);
  if (!(port > 0)) {
    throw new Error(
      `Invalid emulator port in VITE_FIRESTORE_EMULATOR_HOST: "${emulatorHost}"`,
    );
  }
  connectFirestoreEmulator(db, url.hostname, port);
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

export const trackPageView = initAnalytics(app);

export { db, app };
