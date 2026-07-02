// Core logic for office-hours-sync — dependency-injected, firebase-functions-free.
// The onSchedule wrapper, secrets, and live GitHub fetcher live in office-hours-sync.ts.
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";

export interface ReminderItem {
  kind: "reminder";
  number: number;
  title: string;
  body: string;
  jitKey: string;
  repo: string;
  dueAt: Date | null;
}

export type OfficeHoursItem = ReminderItem;

export interface SyncResult {
  written: number;
  deleted: number;
  skippedNoDate: number;
}

// Matches the marker written by dispatch-jit-engine:
//   <!-- jit-due: 2026-01-01T12:00:00Z -->
// Whitespace tolerance keeps this resilient to incidental editor reformatting.
const JIT_DUE_RE =
  /<!--\s*jit-due:\s*(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)\s*-->/;

export function parseJitDueMarker(body: string): Date | null {
  const match = body.match(JIT_DUE_RE);
  if (!match) return null;
  const date = new Date(match[1]);
  return Number.isNaN(date.getTime()) ? null : date;
}

// A jitKey is the `jit:<key>` label suffix and becomes a Firestore document ID.
// The label name is external input from the scanned repo, so guard it: a key
// containing a slash would make `collection.doc(key)` resolve to a nested path
// outside the items collection, and empty / `.` / `..` keys are invalid IDs.
// Keys the JIT engine emits (e.g. `daily-chore`, `budget-review`) match this.
const JIT_KEY_RE = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

export function isValidJitKey(key: string): boolean {
  return JIT_KEY_RE.test(key);
}

export async function syncOfficeHoursCore(deps: {
  fetchOpenJitIssues: () => Promise<OfficeHoursItem[]>;
  firestore: Firestore;
  namespace: string;
  memberEmails: string[];
}): Promise<SyncResult> {
  const issues = await deps.fetchOpenJitIssues();

  const itemsPath = `${deps.namespace}/items`;
  const itemsCollection = deps.firestore.collection(itemsPath);
  const writer = deps.firestore.bulkWriter();
  const writes: Promise<unknown>[] = [];

  const writtenKeys = new Set<string>();
  let written = 0;
  let skippedNoDate = 0;

  for (const issue of issues) {
    if (!isValidJitKey(issue.jitKey)) {
      console.warn(
        `syncOfficeHours: issue #${issue.number} has invalid jitKey "${issue.jitKey}"; skipping`,
      );
      continue;
    }

    if (!issue.dueAt) {
      skippedNoDate += 1;
      console.warn(
        `syncOfficeHours: issue #${issue.number} has no jit-due marker; skipping`,
      );
      continue;
    }

    const dueAt = Timestamp.fromDate(issue.dueAt);
    const docRef = itemsCollection.doc(issue.jitKey);
    writes.push(
      writer.set(docRef, {
        kind: "reminder",
        title: issue.title,
        dueAt,
        repo: issue.repo,
        issueNumber: issue.number,
        jitKey: issue.jitKey,
        memberEmails: deps.memberEmails,
        updatedAt: FieldValue.serverTimestamp(),
      }),
    );
    writtenKeys.add(issue.jitKey);
    written += 1;
  }

  const existing = await itemsCollection.get();
  let deleted = 0;
  for (const doc of existing.docs) {
    if (!writtenKeys.has(doc.id)) {
      writes.push(writer.delete(doc.ref));
      deleted += 1;
    }
  }

  await writer.close(); // flushes all enqueued writes in ≤500-op chunks
  await Promise.all(writes); // BulkWriter routes per-op failures to the individual op promises, not to close(); this is what re-raises them

  return { written, deleted, skippedNoDate };
}
