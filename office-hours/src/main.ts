import "missing.css";
import "./style/theme.css";
import type { User } from "firebase/auth";

import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import { logError } from "@commons-systems/errorutil/log";
import "@commons-systems/components/footer";
import { deferAppCheckInit } from "@commons-systems/firebaseutil/defer-appcheck";

import { createAppController } from "./app-controller.js";
import { getOwnerReminders, getOwnerQueueMetrics } from "./data.js";
import { getOwnerSamples } from "./usage-data.js";
import { getOwnerIssueSamples } from "./issue-data.js";
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

// Owns the live view plus its single 60s tick timer; each paint re-renders and
// restarts the timer (clearing any prior interval — see createAppController).
const controller = createAppController(app!);

// Paint the demo tier immediately so the view is meaningful before auth resolves.
controller.paint({ tier: "demo" }, new Date());

async function refresh(): Promise<void> {
  const refreshUser = currentUser;
  if (refreshUser === null) {
    controller.paint({ tier: "demo" }, new Date());
    return;
  }
  try {
    const [samples, reminders, queueMetrics, issueSamples] = await Promise.all([
      getOwnerSamples(db, NAMESPACE, refreshUser),
      getOwnerReminders(db, NAMESPACE, refreshUser),
      getOwnerQueueMetrics(db, NAMESPACE, refreshUser),
      getOwnerIssueSamples(db, NAMESPACE, refreshUser),
    ]);
    // Auth may have changed while the Firestore calls were in flight — skip the
    // render so the in-flight result does not clobber the already-updated view.
    if (currentUser !== refreshUser) return;
    controller.paint({ tier: "owner", samples, reminders, queueMetrics, issueSamples }, new Date());
  } catch (error) {
    // Auth may have changed while the Firestore calls were in flight — skip the
    // render so the in-flight error does not clobber the already-updated view.
    if (currentUser !== refreshUser) return;
    // Load failed — render an explicit error state rather than masking it as
    // demo data. A non-owner's read is "permission-denied"; logError classifies it.
    if (!deferProgrammerError(error)) {
      logError(error, { operation: "load-owner-data" });
    }
    controller.paint({ tier: "error" }, new Date());
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
