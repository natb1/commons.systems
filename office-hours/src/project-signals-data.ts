import { doc, getDoc, type Firestore } from "firebase/firestore";
import type { User } from "firebase/auth";
import { nsCollectionPath, type Namespace } from "@commons-systems/firestoreutil/namespace";
import { classifyError } from "@commons-systems/errorutil/classify";
import seedProjectSignals from "virtual:office-hours-project-signal-seed-data";
import { parseProjectSignals, type ProjectSignalsSnapshot } from "./project-signals.js";

export function getDemoProjectSignals(): ProjectSignalsSnapshot {
  return {
    computedAt: seedProjectSignals.computedAt,
    groupId: seedProjectSignals.groupId,
    // memberEmails is a denormalized auth field stripped from the public seed
    // bundle (see vite-plugin-project-signal-seed.ts); the demo snapshot carries none.
    memberEmails: [],
    ...(seedProjectSignals.github !== undefined ? { github: seedProjectSignals.github } : {}),
    ...(seedProjectSignals.ga4 !== undefined ? { ga4: seedProjectSignals.ga4 } : {}),
    ...(seedProjectSignals.gsc !== undefined ? { gsc: seedProjectSignals.gsc } : {}),
    ...(seedProjectSignals.psi !== undefined ? { psi: seedProjectSignals.psi } : {}),
  };
}

export async function getOwnerProjectSignals(
  db: Firestore,
  namespace: Namespace,
  user: User,
): Promise<ProjectSignalsSnapshot | null> {
  if (!user.email) return null;
  let snap;
  try {
    snap = await getDoc(doc(db, nsCollectionPath(namespace, "metrics"), "project-signals"));
  } catch (err) {
    if (classifyError(err) === "permission-denied") return null;
    throw err;
  }
  if (!snap.exists()) return null;
  // parseProjectSignals returns null and logs on bad data; null propagates to
  // the panel which shows the empty placeholder.
  return parseProjectSignals(snap.data());
}
