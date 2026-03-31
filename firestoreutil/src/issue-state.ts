import type { Firestore } from "firebase-admin/firestore";

export type IssueNumber = number & { readonly __brand: unique symbol };

export function validateIssueNumber(n: number): IssueNumber {
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(
      `issue number must be a positive integer (got ${String(n)})`,
    );
  }
  return n as IssueNumber;
}

const COLLECTION = "claude-workflow";

export async function readIssueState(
  db: Firestore,
  issueNumber: IssueNumber,
): Promise<Record<string, unknown> | null> {
  const snapshot = await db.doc(`${COLLECTION}/${issueNumber}`).get();
  if (!snapshot.exists) {
    return null;
  }
  return snapshot.data() as Record<string, unknown>;
}

export async function writeIssueState(
  db: Firestore,
  issueNumber: IssueNumber,
  state: Record<string, unknown>,
): Promise<void> {
  await db.doc(`${COLLECTION}/${issueNumber}`).set(state);
}
