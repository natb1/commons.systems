import { collection, getDocs, query, where, type Firestore } from "firebase/firestore";
import type { User } from "firebase/auth";
import { nsCollectionPath, type Namespace } from "@commons-systems/firestoreutil/namespace";
import seedAggregates from "virtual:office-hours-audit-aggregate-seed-data";
import { toAuditAggregate, type AuditAggregate } from "./audit-aggregates.js";

export function getDemoAuditAggregates(): AuditAggregate[] {
  return seedAggregates.map((a) => ({
    computedAt: a.computedAt,
    windowDays: a.windowDays,
    groupId: a.groupId,
    phaseSpend: a.phaseSpend,
    cacheRead: a.cacheRead,
    cacheCreation: a.cacheCreation,
  }));
}

export async function getOwnerAuditAggregates(
  db: Firestore,
  namespace: Namespace,
  user: User,
): Promise<AuditAggregate[]> {
  if (!user.email) return [];
  const path = nsCollectionPath(namespace, "audit-aggregates");
  const q = query(collection(db, path), where("memberEmails", "array-contains", user.email));
  const snapshot = await getDocs(q);
  const aggregates: AuditAggregate[] = [];
  for (const d of snapshot.docs) {
    const aggregate = toAuditAggregate(d.id, d.data());
    if (aggregate) aggregates.push(aggregate);
  }
  return aggregates;
}
