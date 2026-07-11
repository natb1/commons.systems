import type { FirebaseOptions } from "firebase/app";

function requireEnv(name: string): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(
      `${name} is required. Set it in your .env or build command.`,
    );
  }
  return value;
}

export const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "commons-systems",
  apiKey: requireEnv("VITE_FIREBASE_API_KEY"),
  authDomain:
    // Preview channel hostnames contain "--" (e.g., "pr-42--site.web.app") and must
    // use the default firebaseapp.com domain since auth cookies are scoped to the project.
    typeof location !== "undefined" && !location.hostname.includes("--")
      ? location.hostname
      : "commons-systems.firebaseapp.com",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "commons-systems"}.firebasestorage.app`,
} satisfies FirebaseOptions;

/**
 * reCAPTCHA Enterprise site key for Firebase AppCheck (shared across all apps in
 * this project). Exposed as a function rather than a module-scope constant so
 * importing this config does not `requireEnv` the key at load time: an app that
 * never enables App Check can import `firebaseConfig` without throwing. The
 * requirement is deferred to the App Check init site, which calls this on use.
 */
export function getRecaptchaSiteKey(): string {
  return requireEnv("VITE_RECAPTCHA_SITE_KEY");
}
