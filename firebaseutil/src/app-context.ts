import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, connectFirestoreEmulator } from "firebase/firestore";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  getToken,
} from "firebase/app-check";
import type { FirebaseApp } from "firebase/app";
import type { Firestore } from "firebase/firestore";
import type { AppCheck } from "firebase/app-check";
import type { FirebaseStorage } from "firebase/storage";
import type { User } from "firebase/auth";
import { classifyError } from "@commons-systems/errorutil/classify";
import { logError, registerErrorSink } from "@commons-systems/errorutil/log";
import { createDeferredAppAuth } from "@commons-systems/authutil/deferred-app-auth";
import { firebaseConfig } from "./config.js";
import {
  validateNamespace,
  type Namespace,
} from "@commons-systems/firestoreutil/namespace";
import { initAnalyticsSafe } from "@commons-systems/analyticsutil";
import { createFirestoreErrorSink, type ErrorSinkOptions } from "./error-sink.js";

export interface AppContextBase {
  app: FirebaseApp;
  db: Firestore;
  NAMESPACE: Namespace;
  trackPageView: (path: string) => void;
  getAppCheckHeaders?: () => Promise<Record<string, string>>;
  initAppCheck?: () => Promise<void>;
}

export interface AppContextWithStorage extends AppContextBase {
  storage: FirebaseStorage;
  STORAGE_NAMESPACE: Namespace;
}

export interface AppContextWithAuth extends AppContextBase {
  signIn(): Promise<void>;
  signOut(): Promise<void>;
  onAuthStateChanged(cb: (user: User | null) => void): Promise<() => void>;
}

export interface AppContextWithStorageAndAuth extends AppContextWithStorage {
  signIn(): Promise<void>;
  signOut(): Promise<void>;
  onAuthStateChanged(cb: (user: User | null) => void): Promise<() => void>;
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
  recaptchaSiteKey?: string;
  /** Defer App Check initialization until `initAppCheck()` is called. When true
   *  with `recaptchaSiteKey`, `getAppCheckHeaders` returns `{}` until init completes
   *  and `initAppCheck` is returned on the context. When true without
   *  `recaptchaSiteKey`, App Check is permanently disabled: `getAppCheckHeaders`
   *  always returns `{}` and `initAppCheck` is undefined. */
  deferAppCheck?: boolean;
  storageModule?: StorageModule;
  /** Optional; error logs omit user info when not provided.
   *  Mutually exclusive with `enableAuth`. */
  getCurrentUser?: ErrorSinkOptions["getCurrentUser"];
  /** Wire in the shared deferred-auth shim (`createDeferredAppAuth`). When
   *  true, the returned context exposes `signIn`/`signOut`/`onAuthStateChanged`
   *  and the error sink uses the shim's `getCurrentUser` for user info.
   *  Mutually exclusive with `getCurrentUser`. */
  enableAuth?: boolean;
}

/**
 * Create a Firebase app context with Firestore, analytics, optional AppCheck, and optional Storage.
 *
 * Env vars:
 * - `VITE_FIRESTORE_NAMESPACE` — required in dev/preview (throws if missing); defaults to `{appName}/prod` in production
 * - `VITE_FIRESTORE_EMULATOR_HOST` — connects Firestore emulator when set (hostname:port)
 * - `VITE_GA_MEASUREMENT_ID` — activates page-view tracking when set; returns a no-op tracker otherwise
 * - `VITE_STORAGE_EMULATOR_HOST` — connects Storage emulator when set and `storageModule` is provided (hostname:port)
 * - `VITE_APP_CHECK_DEBUG_TOKEN` — allows AppCheck to work in non-browser environments (CI, local dev)
 *   by setting `self.FIREBASE_APPCHECK_DEBUG_TOKEN`; requires `recaptchaSiteKey` and no emulator
 *
 * Pass `options.storageModule` (`firebase/storage`) to include Storage in the context. Accepting it as a parameter
 * keeps `firebase/storage` out of non-storage app bundles without requiring a dynamic import.
 */
export function createAppContext(
  appName: string,
  appId: string,
  options: AppContextOptions & {
    storageModule: StorageModule;
    enableAuth: true;
  },
): AppContextWithStorageAndAuth;
export function createAppContext(
  appName: string,
  appId: string,
  options: AppContextOptions & { enableAuth: true },
): AppContextWithAuth;
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
): AppContextBase | AppContextWithStorage | AppContextWithAuth | AppContextWithStorageAndAuth {
  if (options?.enableAuth && options.getCurrentUser) {
    throw new Error(
      "createAppContext: enableAuth and getCurrentUser are mutually exclusive",
    );
  }

  const app = initializeApp({
    ...firebaseConfig,
    appId,
    ...(import.meta.env.VITE_GA_MEASUREMENT_ID && {
      measurementId: import.meta.env.VITE_GA_MEASUREMENT_ID,
    }),
  });

  const firestoreEmulatorHost = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST;

  if (options?.recaptchaSiteKey === "") {
    throw new Error(
      "recaptchaSiteKey must not be empty — configure it in Firebase Console > App Check",
    );
  }

  const shouldSkipAppCheck = !options?.recaptchaSiteKey || !!firestoreEmulatorHost;

  function doInitAppCheck(): AppCheck | undefined {
    if (shouldSkipAppCheck) return undefined;
    const debugToken = import.meta.env.VITE_APP_CHECK_DEBUG_TOKEN;
    if (debugToken) {
      (self as unknown as Record<string, unknown>).FIREBASE_APPCHECK_DEBUG_TOKEN =
        debugToken;
    }
    try {
      return initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(options!.recaptchaSiteKey!),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (err) {
      if (classifyError(err) === "programmer") throw err;
      // Ad-blockers and CSP policies can block reCAPTCHA scripts, causing initializeAppCheck
      // to throw. Graceful degradation is intentional: the app loads without AppCheck, and
      // server-side enforcement rejects requests without valid AppCheck tokens with 401.
      logError(err, { operation: "appcheck-init" });
      return undefined;
    }
  }

  let resolvedAppCheck: AppCheck | undefined;
  let initAppCheck: (() => Promise<void>) | undefined;

  if (options?.deferAppCheck && options.recaptchaSiteKey) {
    // Deferred mode: getAppCheckHeaders is always a function (returns {} until
    // initAppCheck() is called), so callers that capture the reference at module
    // init time get a working function that upgrades in place.
    let initialized = false;
    initAppCheck = async () => {
      if (initialized) return;
      initialized = true;
      resolvedAppCheck = doInitAppCheck();
    };
  } else {
    resolvedAppCheck = doInitAppCheck();
  }

  // Dedup concurrent getToken calls via shared promise; cache failures with a cooldown.
  let tokenPromise: Promise<Record<string, string>> | null = null;
  let tokenFailedAt = 0;
  const TOKEN_RETRY_DELAY_MS = 5 * 60 * 1000;

  const getAppCheckHeaders =
    resolvedAppCheck || options?.deferAppCheck
      ? async (): Promise<Record<string, string>> => {
          if (!resolvedAppCheck) return {};
          if (tokenFailedAt > 0 && Date.now() - tokenFailedAt < TOKEN_RETRY_DELAY_MS) {
            return {};
          }
          if (tokenPromise) return tokenPromise;
          const pending: Promise<Record<string, string>> = (async () => {
            try {
              const { token } = await getToken(resolvedAppCheck!);
              tokenFailedAt = 0;
              return { "X-Firebase-AppCheck": token };
            } catch (err) {
              if (classifyError(err) === "programmer") throw err;
              tokenFailedAt = Date.now();
              logError(err, { operation: "appcheck-token" });
              return {} as Record<string, string>;
            } finally {
              tokenPromise = null;
            }
          })();
          tokenPromise = pending;
          return pending;
        }
      : undefined;

  // Persistent local cache (IndexedDB) is skipped for the emulator — it destroys
  // Playwright's execution context during navigation, breaking acceptance tests.
  // The emulator itself tolerates persistence, but there is no benefit when data
  // resets between emulator sessions.
  const firestoreSettings = firestoreEmulatorHost
    ? {}
    : { localCache: persistentLocalCache({}) };
  const db = initializeFirestore(app, firestoreSettings);

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

  const deferredAuth = options?.enableAuth ? createDeferredAppAuth(app) : undefined;
  const errorSinkGetCurrentUser = deferredAuth
    ? deferredAuth.getCurrentUser
    : options?.getCurrentUser;

  // Errors logged before this point (e.g., appcheck-init) go to console only.
  registerErrorSink(
    createFirestoreErrorSink({
      db,
      namespace: NAMESPACE,
      getCurrentUser: errorSinkGetCurrentUser,
    }),
  );

  const trackPageView = initAnalyticsSafe(app);

  const authMethods = deferredAuth
    ? {
        signIn: deferredAuth.signIn,
        signOut: deferredAuth.signOut,
        onAuthStateChanged: deferredAuth.onAuthStateChanged,
      }
    : {};

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

    return { app, db, NAMESPACE, trackPageView, getAppCheckHeaders, initAppCheck, storage, STORAGE_NAMESPACE, ...authMethods };
  }

  return { app, db, NAMESPACE, trackPageView, getAppCheckHeaders, initAppCheck, ...authMethods };
}
