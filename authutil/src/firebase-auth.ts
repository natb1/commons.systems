import {
  getAuth,
  GithubAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
} from "firebase/auth";
import type { FirebaseApp } from "firebase/app";
import type { User } from "firebase/auth";
import { setupAuthEmulator } from "./emulator-auth.js";

export interface FirebaseAuthOptions {
  emulatorHost?: string;
}

/** Public auth API returned by {@link createFirebaseAuth} and createAppAuth. */
export interface AppAuth {
  signIn(): void;
  signOut(): Promise<void>;
  onAuthStateChanged: (callback: (user: User | null) => void) => () => void;
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/network-request-failed": "Network error. Check your connection and try again.",
  "auth/operation-not-allowed": "GitHub sign-in is not enabled. Please contact support.",
  "auth/user-disabled": "Your account has been disabled. Please contact support.",
  "auth/account-exists-with-different-credential":
    "An account with this email already exists using a different sign-in method.",
};

function isAuthError(error: unknown): error is { code: string } {
  return typeof error === "object" && error !== null && "code" in error &&
    typeof (error as { code: unknown }).code === "string";
}

function firebaseAuthMessage(error: unknown, fallback: string): string {
  if (isAuthError(error)) {
    const message = AUTH_ERROR_MESSAGES[error.code];
    if (message) return message;
    console.warn("Unhandled Firebase auth error code:", error.code);
  }
  return fallback;
}

function showAuthError(message: string): void {
  const existing = document.querySelector(".auth-toast");
  if (existing) existing.remove();
  const el = document.createElement("div");
  el.className = "auth-toast";
  el.setAttribute("role", "alert");

  const text = document.createElement("span");
  text.textContent = message;
  el.appendChild(text);

  const btn = document.createElement("button");
  btn.textContent = "\u00d7";
  btn.setAttribute("aria-label", "Dismiss error");
  el.appendChild(btn);

  document.body.prepend(el);
  const timer = setTimeout(() => el.remove(), 15000);
  btn.addEventListener("click", () => {
    clearTimeout(timer);
    el.remove();
  });
}

/**
 * Creates a Firebase auth instance configured with GitHub sign-in.
 * Immediately calls getRedirectResult to handle the OAuth callback on
 * page load (user returning from GitHub OAuth or emulator picker).
 * Auth errors display a dismissible toast rather than throwing, to
 * prevent unhandled rejections from blocking app initialization.
 * The auth/popup-closed-by-user error is intentionally dismissed without
 * showing a toast, since it indicates normal user cancellation.
 */
export function createFirebaseAuth(app: FirebaseApp, options?: FirebaseAuthOptions): AppAuth {
  const auth = getAuth(app);

  if (options?.emulatorHost) {
    setupAuthEmulator(auth, options.emulatorHost);
  }

  getRedirectResult(auth).catch((error) => {
    if (isAuthError(error) && error.code === "auth/popup-closed-by-user") {
      console.debug("Auth redirect cancelled by user");
      return;
    }
    console.error("Auth redirect error:", error);
    showAuthError(firebaseAuthMessage(error, "Sign-in could not be completed. Please try again."));
  });

  const provider = new GithubAuthProvider();
  provider.addScope("user:email");

  function signIn(): void {
    signInWithRedirect(auth, provider).catch((error) => {
      console.error("Sign-in redirect failed:", error);
      showAuthError(firebaseAuthMessage(error, "Sign-in failed. Please try again."));
    });
  }

  function signOut(): Promise<void> {
    return firebaseSignOut(auth).catch((error) => {
      console.error("Sign-out failed:", error);
      showAuthError("Sign-out failed. Please try again.");
      throw error;
    });
  }

  return {
    signIn,
    signOut,
    onAuthStateChanged: (nextOrObserver) =>
      fbOnAuthStateChanged(auth, nextOrObserver),
  };
}
