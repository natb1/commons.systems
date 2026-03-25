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
  projectId: "commons-systems",
  apiKey: requireEnv("VITE_FIREBASE_API_KEY"),
  authDomain:
    // Preview channel hostnames contain "--" (e.g., "pr-42--site.web.app") and must
    // use the default firebaseapp.com domain since auth cookies are scoped to the project.
    typeof location !== "undefined" && !location.hostname.includes("--")
      ? location.hostname
      : "commons-systems.firebaseapp.com",
  storageBucket: "commons-systems.firebasestorage.app",
} satisfies FirebaseOptions;

/** reCAPTCHA Enterprise site key for Firebase AppCheck (shared across all apps in this project). */
export const RECAPTCHA_SITE_KEY = requireEnv("VITE_RECAPTCHA_SITE_KEY");
