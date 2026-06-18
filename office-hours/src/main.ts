import "missing.css";
import type { User } from "firebase/auth";

import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import { logError } from "@commons-systems/errorutil/log";
import { deferAppCheckInit } from "@commons-systems/firebaseutil/defer-appcheck";
import { createAuthTierController } from "@commons-systems/firebaseutil/auth-tier-controller";

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
import type { UsageSample } from "./usage-samples.js";
import type { Reminder } from "./reminders.js";
import type { QueueMetricsSnapshot } from "./queue-metrics.js";
import type { IssueSample } from "./issue-samples.js";

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

type OwnerData = {
  samples: UsageSample[];
  reminders: Reminder[];
  queueMetrics: QueueMetricsSnapshot | null;
  issueSamples: IssueSample[];
};

// Paints the demo tier immediately (synchronous in constructor), then
// transitions to owner/error as auth identities arrive via handleAuthChange.
const auth = createAuthTierController<User, OwnerData>({
  load: async (user) => {
    try {
      const [samples, reminders, queueMetrics, issueSamples] = await Promise.all([
        getOwnerSamples(db, NAMESPACE, user),
        getOwnerReminders(db, NAMESPACE, user),
        getOwnerQueueMetrics(db, NAMESPACE, user),
        getOwnerIssueSamples(db, NAMESPACE, user),
      ]);
      return { samples, reminders, queueMetrics, issueSamples };
    } catch (error) {
      // Load failed — render an explicit error state rather than masking it as
      // demo data. A non-owner's read is "permission-denied"; logError classifies it.
      if (!deferProgrammerError(error)) {
        logError(error, { operation: "load-owner-data" });
      }
      throw error; // controller → error tier
    }
  },
  render: (t) =>
    controller.paint(
      t.tier === "owner" ? { tier: "owner", ...t.data } : { tier: t.tier },
      new Date(),
    ),
});

authToggle.addEventListener("click", () => {
  if (currentUser) void signOut();
  else void signIn();
});

onAuthStateChanged((user) => {
  if (user?.uid === currentUser?.uid) return;
  currentUser = user;
  updateAuthButton(user);
  auth.handleAuthChange(user);
}).catch((err) => {
  if (deferProgrammerError(err)) return;
  logError(err, { operation: "auth-init" });
});

deferAppCheckInit(initAppCheck);

trackPageView("/");
