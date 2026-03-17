import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import type { FirebaseApp } from "firebase/app";
import type { Firestore } from "firebase/firestore";
import type { FirebaseStorage } from "firebase/storage";
import { firebaseConfig } from "./config.js";
import {
  validateNamespace,
  type Namespace,
} from "@commons-systems/firestoreutil/namespace";
import { initAnalyticsSafe } from "@commons-systems/analyticsutil";

export interface AppContextBase {
  app: FirebaseApp;
  db: Firestore;
  NAMESPACE: Namespace;
  trackPageView: (path: string) => void;
}

export interface AppContextWithStorage extends AppContextBase {
  storage: FirebaseStorage;
  STORAGE_NAMESPACE: Namespace;
}

function parseEmulatorHost(
  envVar: string,
  value: string,
): { hostname: string; port: number } {
  let url: URL;
  try {
    url = new URL(`http://${value}`);
  } catch {
    throw new Error(
      `Invalid emulator host in ${envVar}: "${value}" (expected hostname:port)`,
    );
  }
  const port = Number(url.port);
  if (!(port > 0)) {
    throw new Error(`Invalid emulator port in ${envVar}: "${value}"`);
  }
  return { hostname: url.hostname, port };
}

/**
 * Initialize a Firebase app with Firestore, analytics, and optional Storage.
 *
 * Env vars:
 * - `VITE_FIRESTORE_NAMESPACE` — required in dev/preview (throws if missing); defaults to `{appName}/prod` in production
 * - `VITE_FIRESTORE_EMULATOR_HOST` — connects Firestore emulator when set (hostname:port)
 * - `VITE_GA_MEASUREMENT_ID` — enables Google Analytics when set
 * - `VITE_STORAGE_EMULATOR_HOST` — connects Storage emulator when set and `opts.storage` is true (hostname:port)
 */
export function createAppContext(
  appName: string,
  appId: string,
  opts: { storage: true },
): Promise<AppContextWithStorage>;
export function createAppContext(
  appName: string,
  appId: string,
  opts?: { storage?: boolean },
): AppContextBase;
export function createAppContext(
  appName: string,
  appId: string,
  opts?: { storage?: boolean },
): AppContextBase | Promise<AppContextWithStorage> {
  const app = initializeApp({
    ...firebaseConfig,
    appId,
    ...(import.meta.env.VITE_GA_MEASUREMENT_ID && {
      measurementId: import.meta.env.VITE_GA_MEASUREMENT_ID,
    }),
  });

  const db = getFirestore(app);

  const firestoreEmulatorHost = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST;
  if (firestoreEmulatorHost) {
    const { hostname, port } = parseEmulatorHost(
      "VITE_FIRESTORE_EMULATOR_HOST",
      firestoreEmulatorHost,
    );
    connectFirestoreEmulator(db, hostname, port);
  }

  const envNamespace = import.meta.env.VITE_FIRESTORE_NAMESPACE as string;
  if (!envNamespace && import.meta.env.MODE !== "production") {
    throw new Error(
      "VITE_FIRESTORE_NAMESPACE is required in dev/preview mode. " +
        "Set it in your .env or build command to avoid writing to production data.",
    );
  }
  const NAMESPACE = validateNamespace(envNamespace || `${appName}/prod`);

  const trackPageView = initAnalyticsSafe(app);

  if (opts?.storage) {
    return (async () => {
      const { getStorage, connectStorageEmulator } = await import(
        "firebase/storage"
      );
      const storage = getStorage(app);

      const storageEmulatorHost = import.meta.env.VITE_STORAGE_EMULATOR_HOST;
      if (storageEmulatorHost) {
        const { hostname, port } = parseEmulatorHost(
          "VITE_STORAGE_EMULATOR_HOST",
          storageEmulatorHost,
        );
        connectStorageEmulator(storage, hostname, port);
      }

      // Storage paths always use prod — media binaries are not duplicated per preview branch.
      const STORAGE_NAMESPACE = validateNamespace(`${appName}/prod`);

      return { app, db, NAMESPACE, trackPageView, storage, STORAGE_NAMESPACE };
    })();
  }

  return { app, db, NAMESPACE, trackPageView };
}
