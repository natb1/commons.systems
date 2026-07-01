import type { Firestore } from "firebase/firestore";
import type { User } from "firebase/auth";
import { nsCollectionPath, type Namespace } from "@commons-systems/firestoreutil/namespace";
import { boundedQuery } from "@commons-systems/firestoreutil/bounded-query";
import seedSamples from "virtual:office-hours-issue-seed-data";
import { toIssueSample, type IssueSample } from "./issue-samples.js";

// issue-samples grows ~24 docs/day (one per hourly sampleDispatchQueueMetrics
// run) and is re-scanned on every dashboard auto-refresh. Cap the read to a
// bounded, non-growing set so it can never repeat the #2683 read spike. The cap
// is generous (≈80 days of backlog history) since this collection grows slowly.
// Uses the existing issue-samples (memberEmails CONTAINS + sampledAt DESC)
// composite index in firestore.indexes.json.
const ISSUE_SAMPLE_LIMIT = 2000;

export function getDemoIssueSamples(): IssueSample[] {
  return seedSamples.map((s) => ({
    sampledAt: s.sampledAt,
    openSecurity: s.openSecurity,
    openBug: s.openBug,
    openEnhancement: s.openEnhancement,
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
  const bounded = boundedQuery(db, path)
    .where("memberEmails", "array-contains", user.email)
    .orderBy("sampledAt", "desc")
    .limit(ISSUE_SAMPLE_LIMIT);
  const snapshot = await bounded.getDocs();
  const samples: IssueSample[] = [];
  for (const d of snapshot.docs) {
    const sample = toIssueSample(d.id, d.data());
    if (sample) samples.push(sample);
  }
  // Query returns DESC (newest first); reverse to ascending time order for charting.
  samples.reverse();
  return samples;
}
