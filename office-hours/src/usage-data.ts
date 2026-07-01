import type { Firestore } from "firebase/firestore";
import type { User } from "firebase/auth";
import { nsCollectionPath, type Namespace } from "@commons-systems/firestoreutil/namespace";
import { boundedQuery } from "@commons-systems/firestoreutil/bounded-query";
import seedSamples from "virtual:office-hours-usage-seed-data";
import { toUsageSample, type UsageSample } from "./usage-samples.js";

// usage-samples is written once per dispatch-tick (~every 5 min, ~288 docs/day)
// and grows without bound. The owner getter runs on mount AND on every
// dashboard auto-refresh (Dashboard.tsx REFRESH_INTERVAL_MS), so an unbounded
// scan makes reads scale with the ever-growing collection — the #2683 read
// spike. Cap the read (and the charted history) to the most recent ~7 days.
// Requires the usage-samples (memberEmails CONTAINS + sampledAt DESC) composite
// index in firestore.indexes.json.
const USAGE_SAMPLE_LIMIT = 2000;

export function getDemoSamples(): UsageSample[] {
  return seedSamples.map((s) => ({
    sampledAt: s.sampledAt,
    fiveHourUsedPct: s.fiveHourUsedPct,
    weeklyUsedPct: s.weeklyUsedPct,
    fiveHourResetsAt: s.fiveHourResetsAt,
    weeklyResetsAt: s.weeklyResetsAt,
    activeWorkers: s.activeWorkers,
    targetWorkers: s.targetWorkers,
    groupId: s.groupId,
  }));
}

export async function getOwnerSamples(
  db: Firestore,
  namespace: Namespace,
  user: User,
): Promise<UsageSample[]> {
  if (!user.email) return [];
  const path = nsCollectionPath(namespace, "usage-samples");
  const bounded = boundedQuery(db, path)
    .where("memberEmails", "array-contains", user.email)
    .orderBy("sampledAt", "desc")
    .limit(USAGE_SAMPLE_LIMIT);
  const snapshot = await bounded.getDocs();
  const samples: UsageSample[] = [];
  for (const d of snapshot.docs) {
    const sample = toUsageSample(d.id, d.data());
    if (sample) samples.push(sample);
  }
  // Query returns DESC (newest first); reverse to ascending time order for charting.
  samples.reverse();
  return samples;
}
