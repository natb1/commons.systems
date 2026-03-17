import {
  getAuth,
  GithubAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
} from "firebase/auth";
import type { FirebaseApp } from "firebase/app";
import type { Auth, NextOrObserver, Unsubscribe, User } from "firebase/auth";
import { setupAuthEmulator } from "./emulator-auth.js";

export interface FirebaseAuthOptions {
  emulatorHost?: string;
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/network-request-failed": "Network error. Check your connection and try again.",
  "auth/operation-not-allowed": "GitHub sign-in is not enabled. Please contact support.",
  "auth/user-disabled": "Your account has been disabled. Please contact support.",
  "auth/account-exists-with-different-credential":
    "An account with this email already exists using a different sign-in method.",
};

function firebaseAuthMessage(error: unknown, fallback: string): string {
  const code = (error as { code?: string })?.code;
  if (code) {
    const message = AUTH_ERROR_MESSAGES[code];
    if (message) return message;
    console.warn("Unhandled Firebase auth error code:", code);
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
 */
export function createFirebaseAuth(app: FirebaseApp, options?: FirebaseAuthOptions): {
  auth: Auth;
  signIn(): void;
  signOut(): Promise<void>;
  onAuthStateChanged: (nextOrObserver: NextOrObserver<User | null>) => Unsubscribe;
} {
  const auth = getAuth(app);

  if (options?.emulatorHost) {
    setupAuthEmulator(auth, options.emulatorHost);
  }

  getRedirectResult(auth).catch((error) => {
    if ((error as { code?: string })?.code === "auth/popup-closed-by-user") return;
    console.error("Auth redirect error:", error);
    showAuthError(firebaseAuthMessage(error, "Sign-in could not be completed. Please try again."));
  });

  const provider = new GithubAuthProvider();

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
    auth,
    signIn,
    signOut,
    onAuthStateChanged: (nextOrObserver) =>
      fbOnAuthStateChanged(auth, nextOrObserver),
  };
}
