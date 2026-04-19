import type { Firestore } from "firebase-admin/firestore";

export interface IssueState {
  version: number;
  step: number;
  step_label?: string;
  phase?: string;
  active_skills?: string[];
  wiggum_step?: number;
  wiggum_step_label?: string;
  phase_signal?: "complete"; // dispatcher termination signal (dispatch/bin/phase-complete)
  [key: string]: unknown;
}

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
): Promise<IssueState | null> {
  const snapshot = await db.doc(`${COLLECTION}/${issueNumber}`).get();
  if (!snapshot.exists) {
    return null;
  }
  return snapshot.data() as IssueState;
}

export async function writeIssueState(
  db: Firestore,
  issueNumber: IssueNumber,
  state: IssueState,
): Promise<void> {
  await db.doc(`${COLLECTION}/${issueNumber}`).set(state);
}
