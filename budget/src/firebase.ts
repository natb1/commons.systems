import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { firebaseConfig } from "@commons-systems/firebaseutil/config";
import { validateNamespace } from "@commons-systems/firestoreutil/namespace";
import { initAnalyticsSafe, withMeasurementId } from "@commons-systems/analyticsutil";

const app = initializeApp(
  withMeasurementId(firebaseConfig, import.meta.env.VITE_GA_MEASUREMENT_ID),
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

const envNamespace = import.meta.env.VITE_FIRESTORE_NAMESPACE;
if (!envNamespace && import.meta.env.MODE !== "production") {
  throw new Error(
    "VITE_FIRESTORE_NAMESPACE is required in dev/preview mode. " +
      "Set it in your .env or build command to avoid writing to production data.",
  );
}
if (!envNamespace) {
  console.warn("VITE_FIRESTORE_NAMESPACE not set; defaulting to 'budget/prod'");
}
export const NAMESPACE = envNamespace || "budget/prod";
validateNamespace(NAMESPACE);

export const trackPageView = initAnalyticsSafe(app);

export { db, app };
