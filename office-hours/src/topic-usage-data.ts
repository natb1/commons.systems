import type { Firestore } from "firebase/firestore";
import type { User } from "firebase/auth";
import { nsCollectionPath, type Namespace } from "@commons-systems/firestoreutil/namespace";
import { boundedQuery } from "@commons-systems/firestoreutil/bounded-query";
import { classifyError } from "@commons-systems/errorutil/classify";
import { toTopicUsage, type TopicUsageDoc } from "./topic-usage.js";

export async function getOwnerTopicUsage(
  db: Firestore,
  namespace: Namespace,
  user: User,
): Promise<TopicUsageDoc[]> {
  if (!user.email) return [];
  const path = nsCollectionPath(namespace, "topic-usage");
  const bounded = boundedQuery(db, path)
    .where("memberEmails", "array-contains", user.email)
    .orderBy("date", "desc")
    .limit(21);
  let snap;
  try {
    snap = await bounded.getDocs();
  } catch (err) {
    if (classifyError(err) === "permission-denied") return [];
    // Let failed-precondition (missing composite index) and other errors propagate.
    throw err;
  }
  const docs: TopicUsageDoc[] = [];
  for (const d of snap.docs) {
    const usage = toTopicUsage(d.data());
    if (usage) docs.push(usage);
  }
  // Query returns DESC; reverse to ascending date order for charting.
  docs.reverse();
  return docs;
}

// The demo tier is unauthenticated and the topic-usage list rule requires
// request.auth != null, so there is no demo data source and the panel renders empty.
export function getDemoTopicUsage(): TopicUsageDoc[] {
  return [];
}
