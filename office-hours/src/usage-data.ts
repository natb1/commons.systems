import { collection, getDocs, query, where, type Firestore } from "firebase/firestore";
import type { User } from "firebase/auth";
import { nsCollectionPath, type Namespace } from "@commons-systems/firestoreutil/namespace";
import seedSamples from "virtual:office-hours-usage-seed-data";
import { toUsageSample, type UsageSample } from "./usage-samples.js";

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
    memberEmails: s.memberEmails,
  }));
}

export async function getOwnerSamples(
  db: Firestore,
  namespace: Namespace,
  user: User,
): Promise<UsageSample[]> {
  if (!user.email) return [];
  const path = nsCollectionPath(namespace, "usage-samples");
  const q = query(collection(db, path), where("memberEmails", "array-contains", user.email));
  const snapshot = await getDocs(q);
  const samples: UsageSample[] = [];
  for (const d of snapshot.docs) {
    const sample = toUsageSample(d.id, d.data());
    if (sample) samples.push(sample);
  }
  return samples;
}
