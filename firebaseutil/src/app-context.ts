import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  getToken,
} from "firebase/app-check";
import type { FirebaseApp } from "firebase/app";
import type { Firestore } from "firebase/firestore";
import type { AppCheck } from "firebase/app-check";
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
  } catch (error) {
    throw new Error(
      `Invalid emulator host in ${envVar}: "${value}" (expected hostname:port)`,
      { cause: error },
    );
  }
  const port = Number(url.port);
  if (!(port > 0)) {
    throw new Error(`Invalid emulator port in ${envVar}: "${value}"`);
  }
  return { hostname: url.hostname, port };
}

export interface StorageModule {
  getStorage: (app: FirebaseApp) => FirebaseStorage;
  connectStorageEmulator: (
    storage: FirebaseStorage,
    host: string,
    port: number,
  ) => void;
}

export interface AppContextOptions {
  recaptchaSiteKey: string;
  storageModule?: StorageModule;
}

let appCheckInstance: AppCheck | null = null;

/**
 * Returns a function that fetches an AppCheck token and returns it as an
 * `X-Firebase-AppCheck` header, or `undefined` when AppCheck is not initialized.
 */
export function getAppCheckToken():
  | (() => Promise<Record<string, string>>)
  | undefined {
  if (!appCheckInstance) return undefined;
  const instance = appCheckInstance;
  return async () => {
    const { token } = await getToken(instance);
    return { "X-Firebase-AppCheck": token };
  };
}

/**
 * Initialize a Firebase app with Firestore, analytics, optional AppCheck, and optional Storage.
 *
 * Env vars:
 * - `VITE_FIRESTORE_NAMESPACE` — required in dev/preview (throws if missing); defaults to `{appName}/prod` in production
 * - `VITE_FIRESTORE_EMULATOR_HOST` — connects Firestore emulator when set (hostname:port)
 * - `VITE_GA_MEASUREMENT_ID` — activates page-view tracking when set; returns a no-op tracker otherwise
 * - `VITE_STORAGE_EMULATOR_HOST` — connects Storage emulator when set and `storageModule` is provided (hostname:port)
 * - `VITE_APP_CHECK_DEBUG_TOKEN` — sets `self.FIREBASE_APPCHECK_DEBUG_TOKEN` for debug environments
 *
 * Pass `options.storageModule` (`firebase/storage`) to include Storage in the context. Accepting it as a parameter
 * keeps `firebase/storage` out of non-storage app bundles without requiring a dynamic import.
 */
export function createAppContext(
  appName: string,
  appId: string,
  options: AppContextOptions & { storageModule: StorageModule },
): AppContextWithStorage;
export function createAppContext(
  appName: string,
  appId: string,
  options?: AppContextOptions,
): AppContextBase;
export function createAppContext(
  appName: string,
  appId: string,
  options?: AppContextOptions,
): AppContextBase | AppContextWithStorage {
  const app = initializeApp({
    ...firebaseConfig,
    appId,
    ...(import.meta.env.VITE_GA_MEASUREMENT_ID && {
      measurementId: import.meta.env.VITE_GA_MEASUREMENT_ID,
    }),
  });

  const firestoreEmulatorHost = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST;

  if (options?.recaptchaSiteKey && !firestoreEmulatorHost) {
    const debugToken = import.meta.env.VITE_APP_CHECK_DEBUG_TOKEN;
    if (debugToken) {
      (self as Record<string, unknown>).FIREBASE_APPCHECK_DEBUG_TOKEN =
        debugToken;
    }
    appCheckInstance = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(options.recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  }

  const db = getFirestore(app);

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

  if (options?.storageModule) {
    const storage = options.storageModule.getStorage(app);

    const storageEmulatorHost = import.meta.env.VITE_STORAGE_EMULATOR_HOST;
    if (storageEmulatorHost) {
      const { hostname, port } = parseEmulatorHost(
        "VITE_STORAGE_EMULATOR_HOST",
        storageEmulatorHost,
      );
      options.storageModule.connectStorageEmulator(storage, hostname, port);
    }

    // Storage paths always use prod — media binaries are not duplicated per preview branch.
    const STORAGE_NAMESPACE = validateNamespace(`${appName}/prod`);

    return { app, db, NAMESPACE, trackPageView, storage, STORAGE_NAMESPACE };
  }

  return { app, db, NAMESPACE, trackPageView };
}
