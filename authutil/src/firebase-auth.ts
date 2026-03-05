import {
  getAuth,
  GithubAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import { setupAuthEmulator } from "./emulator-auth.js";

export interface FirebaseAuthOptions {
  emulatorHost?: string;
}

function firebaseAuthMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  switch (code) {
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/operation-not-allowed":
      return "GitHub sign-in is not enabled. Please contact support.";
    case "auth/user-disabled":
      return "Your account has been disabled. Please contact support.";
    case "auth/account-exists-with-different-credential":
      return "An account with this email already exists using a different sign-in method.";
    default:
      if (code) console.warn("Unhandled Firebase auth error code:", code);
      return "";
  }
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

export function createFirebaseAuth(app: FirebaseApp, options?: FirebaseAuthOptions): {
  auth: Auth;
  signIn(): void;
  signOut(): Promise<void>;
  onAuthStateChanged: typeof onAuthStateChanged;
} {
  const auth = getAuth(app);

  if (options?.emulatorHost) {
    setupAuthEmulator(auth, options.emulatorHost);
  }

  getRedirectResult(auth).catch((error) => {
    console.error("Auth redirect error:", error);
    const message = firebaseAuthMessage(error) || "Sign-in could not be completed. Please try again.";
    showAuthError(message);
  });

  const provider = new GithubAuthProvider();

  function handleSignInError(error: unknown): void {
    console.error("Sign-in redirect failed:", error);
    const message = firebaseAuthMessage(error) || "Sign-in failed. Please try again.";
    showAuthError(message);
  }

  function signIn(): void {
    try {
      signInWithRedirect(auth, provider).catch(handleSignInError);
    } catch (error) {
      handleSignInError(error);
    }
  }

  function signOut(): Promise<void> {
    return firebaseSignOut(auth).catch((error) => {
      console.error("Sign-out failed:", error);
      showAuthError("Sign-out failed. Please try again.");
    });
  }

  return { auth, signIn, signOut, onAuthStateChanged };
}
