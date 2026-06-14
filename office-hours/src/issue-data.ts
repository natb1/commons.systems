import { collection, getDocs, query, where, type Firestore } from "firebase/firestore";
import type { User } from "firebase/auth";
import { nsCollectionPath, type Namespace } from "@commons-systems/firestoreutil/namespace";
import seedSamples from "virtual:office-hours-issue-seed-data";
import { toIssueSample, type IssueSample } from "./issue-samples.js";

export function getDemoIssueSamples(): IssueSample[] {
  return seedSamples.map((s) => ({
    sampledAt: s.sampledAt,
    openHelpWanted: s.openHelpWanted,
    openOther: s.openOther,
    groupId: s.groupId,
  }));
}

export async function getOwnerIssueSamples(
  db: Firestore,
  namespace: Namespace,
  user: User,
): Promise<IssueSample[]> {
  if (!user.email) return [];
  const path = nsCollectionPath(namespace, "issue-samples");
  const q = query(collection(db, path), where("memberEmails", "array-contains", user.email));
  const snapshot = await getDocs(q);
  const samples: IssueSample[] = [];
  for (const d of snapshot.docs) {
    const sample = toIssueSample(d.id, d.data());
    if (sample) samples.push(sample);
  }
  return samples;
}
