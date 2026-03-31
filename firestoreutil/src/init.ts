import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Initialize Firebase Admin SDK and return a Firestore instance.
 *
 * Auth strategy (checked in order):
 * 1. FIRESTORE_EMULATOR_HOST set -> emulator mode, no credentials
 * 2. GOOGLE_APPLICATION_CREDENTIALS set -> service account JSON file
 * 3. Neither set -> Application Default Credentials (gcloud auth application-default login)
 */
export async function initFirebaseAdmin(): Promise<Firestore> {
  const projectId = process.env.FIREBASE_PROJECT_ID ?? "commons-systems";
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;

  if (emulatorHost) {
    initializeApp({ projectId });
  } else {
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (serviceAccountPath) {
      const serviceAccount = (
        await import(serviceAccountPath, { with: { type: "json" } })
      ).default as ServiceAccount;
      initializeApp({ credential: cert(serviceAccount) });
    } else {
      initializeApp({ projectId });
    }
  }

  return getFirestore();
}
