import "missing.css";
import type { User } from "firebase/auth";

import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import { logError } from "@commons-systems/errorutil/log";
import { deferAppCheckInit } from "@commons-systems/firebaseutil/defer-appcheck";

import { renderReminderList } from "./office-hours.js";
import { getDemoReminders, getOwnerReminders } from "./data.js";
import type { Reminder } from "./reminders.js";
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

function render(reminders: Reminder[]): void {
  app!.replaceChildren();
  app!.appendChild(renderReminderList(reminders, new Date()));
}

function updateAuthButton(user: User | null): void {
  authToggle!.textContent = user ? "Sign out" : "Sign in";
}

// Paint the demo tier immediately so the view is meaningful before auth resolves.
render(getDemoReminders());

async function refresh(): Promise<void> {
  if (currentUser === null) {
    render(getDemoReminders());
    return;
  }
  try {
    const owner = await getOwnerReminders(db, NAMESPACE, currentUser);
    // A signed-in non-owner's query returns empty (rules deny the real data) —
    // fall back to the demo tier.
    render(owner.length > 0 ? owner : getDemoReminders());
  } catch (error) {
    // Intentional silent degradation — show the demo tier rather than an error.
    // A non-owner's read is "permission-denied"; logError classifies it.
    if (!deferProgrammerError(error)) {
      logError(error, { operation: "load-owner-reminders" });
    }
    render(getDemoReminders());
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
