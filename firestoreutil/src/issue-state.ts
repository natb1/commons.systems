import type { Firestore } from "firebase-admin/firestore";

const COLLECTION = "claude-workflow";

export async function readIssueState(
  db: Firestore,
  issueNumber: number,
): Promise<Record<string, unknown> | null> {
  const snapshot = await db.doc(`${COLLECTION}/${issueNumber}`).get();
  if (!snapshot.exists) {
    return null;
  }
  return snapshot.data() as Record<string, unknown>;
}

export async function writeIssueState(
  db: Firestore,
  issueNumber: number,
  state: Record<string, unknown>,
): Promise<void> {
  await db.doc(`${COLLECTION}/${issueNumber}`).set(state);
}
