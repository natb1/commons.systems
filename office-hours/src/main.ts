import "missing.css";
import type { User } from "firebase/auth";

import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import { logError } from "@commons-systems/errorutil/log";
import { deferAppCheckInit } from "@commons-systems/firebaseutil/defer-appcheck";

import { renderApp } from "./app-view.js";
import { getOwnerReminders } from "./data.js";
import { getOwnerSamples } from "./usage-data.js";
import {
  db,
  NAMESPACE,
  trackPageView,
  initAppCheck,
  signIn,
  signOut,
  onAuthStateChanged,
} from "./firebase.js";

const app = document.querySelector("#app");
if (!app) throw new Error("#app element not found");

const authToggle = document.querySelector("#auth-toggle");
if (!authToggle) throw new Error("#auth-toggle element not found");

let currentUser: User | null = null;

function updateAuthButton(user: User | null): void {
  authToggle!.textContent = user ? "Sign out" : "Sign in";
}

// Paint the demo tier immediately so the view is meaningful before auth resolves.
renderApp(app!, { tier: "demo" }, new Date());

async function refresh(): Promise<void> {
  const refreshUser = currentUser;
  if (refreshUser === null) {
    renderApp(app!, { tier: "demo" }, new Date());
    return;
  }
  try {
    const [samples, reminders] = await Promise.all([
      getOwnerSamples(db, NAMESPACE, refreshUser),
      getOwnerReminders(db, NAMESPACE, refreshUser),
    ]);
    // Auth may have changed while the Firestore calls were in flight — skip the
    // render so the in-flight result does not clobber the already-updated view.
    if (currentUser !== refreshUser) return;
    renderApp(app!, { tier: "owner", samples, reminders }, new Date());
  } catch (error) {
    // Load failed — render an explicit error state rather than masking it as
    // demo data. A non-owner's read is "permission-denied"; logError classifies it.
    if (!deferProgrammerError(error)) {
      logError(error, { operation: "load-owner-data" });
    }
    renderApp(app!, { tier: "error" }, new Date());
  }
}

authToggle.addEventListener("click", () => {
  if (currentUser) void signOut();
  else void signIn();
});

onAuthStateChanged((user) => {
  if (user?.uid === currentUser?.uid) return;
  currentUser = user;
  updateAuthButton(user);
  refresh().catch((err) => {
    if (deferProgrammerError(err)) return;
    logError(err, { operation: "auth-change-refresh" });
  });
}).catch((err) => {
  if (deferProgrammerError(err)) return;
  logError(err, { operation: "auth-init" });
});

deferAppCheckInit(initAppCheck);

trackPageView("/");
