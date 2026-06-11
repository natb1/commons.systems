import "missing.css";
import type { User } from "firebase/auth";

import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import { logError } from "@commons-systems/errorutil/log";
import { deferAppCheckInit } from "@commons-systems/firebaseutil/defer-appcheck";

import { renderReminderList } from "./office-hours.js";
import { getDemoReminders, getOwnerReminders } from "./data.js";
import type { Reminder } from "./reminders.js";
import { renderCapacityBand, selectLatestSample } from "./capacity-band.js";
import { getDemoSamples, getOwnerSamples } from "./usage-data.js";
import type { UsageSample } from "./usage-samples.js";
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

function render(samples: UsageSample[], reminders: Reminder[]): void {
  app!.replaceChildren();
  app!.appendChild(renderCapacityBand(selectLatestSample(samples), new Date()));
  app!.appendChild(renderReminderList(reminders, new Date()));
}

function updateAuthButton(user: User | null): void {
  authToggle!.textContent = user ? "Sign out" : "Sign in";
}

// Paint the demo tier immediately so the view is meaningful before auth resolves.
render(getDemoSamples(), getDemoReminders());

async function refresh(): Promise<void> {
  const refreshUser = currentUser;
  if (refreshUser === null) {
    render(getDemoSamples(), getDemoReminders());
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
    // A signed-in non-owner's queries return empty (rules deny the real data) —
    // fall back to the demo tier per band.
    render(
      samples.length > 0 ? samples : getDemoSamples(),
      reminders.length > 0 ? reminders : getDemoReminders(),
    );
  } catch (error) {
    // Intentional silent degradation — show the demo tier rather than an error.
    // A non-owner's read is "permission-denied"; logError classifies it.
    if (!deferProgrammerError(error)) {
      logError(error, { operation: "load-owner-data" });
    }
    render(getDemoSamples(), getDemoReminders());
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
