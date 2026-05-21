// One-shot migration: convert each legacy single-entry `Transaction` into a
// balanced two-leg `JournalEntry` and backfill `Transaction.journalEntryId`.
//
// Run via tsx, e.g.:
//   FIRESTORE_NAMESPACE=budget/test FIRESTORE_EMULATOR_HOST=localhost:8080 \
//     npx tsx budget/scripts/migrate-to-journal-entries.ts
//   FIRESTORE_NAMESPACE=budget/prod npx tsx budget/scripts/migrate-to-journal-entries.ts --prod
//
// This script is self-contained: it imports only from
// `@commons-systems/firestoreutil` and `node:*` builtins. It does NOT import
// from `budget/src/*` — `budget/src/firestore.ts` pulls in the client-SDK
// `firebase.ts`, which has browser side effects unsuitable for a Node script.
//
// Idempotency: the script derives deterministic doc ids from each transaction
// id and skips any transaction whose `journalEntryId` is already set. Re-running
// it produces no duplicate entries or legs — see the comment on the migration
// loop below.
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { initFirebaseAdmin } from "@commons-systems/firestoreutil/init";
import {
  validateNamespace,
  nsCollectionPath,
} from "@commons-systems/firestoreutil/namespace";

// Placeholder counter-account ids. These match doc ids in the seeded reference
// chart of accounts — see `budget/seeds/firestore.ts` (`accountDocs`). Doc id
// shape is `{institution}_{account}`.
const COUNTER_ACCOUNT_EXPENSE = "Budget_Uncategorized Expense";
const COUNTER_ACCOUNT_INCOME = "Budget_Uncategorized Income";
// Transfer pairing across two real accounts is out of scope here — that is
// issue #555. This migration routes the unknown side of a transfer to the
// `Adjustment Suspense` equity account.
const COUNTER_ACCOUNT_TRANSFER = "Budget_Adjustment Suspense";

type CategoryFamily = "income" | "transfer" | "expense";

function classifyCategory(category: string): CategoryFamily {
  if (category.startsWith("Income")) return "income";
  if (category.startsWith("Transfer")) return "transfer";
  return "expense";
}

function counterAccountId(family: CategoryFamily): string {
  switch (family) {
    case "income":
      return COUNTER_ACCOUNT_INCOME;
    case "transfer":
      return COUNTER_ACCOUNT_TRANSFER;
    case "expense":
      return COUNTER_ACCOUNT_EXPENSE;
  }
}

async function main(): Promise<void> {
  // --- Read config & gate execution ----------------------------------------
  const namespaceRaw = process.env.FIRESTORE_NAMESPACE;
  if (!namespaceRaw) {
    console.error(
      'FIRESTORE_NAMESPACE env var is required (format "budget/{env}", e.g. "budget/test")',
    );
    process.exit(1);
  }
  const namespace = validateNamespace(namespaceRaw);

  const emulator = !!process.env.FIRESTORE_EMULATOR_HOST;
  const prod = process.argv.includes("--prod");

  if (!emulator && !prod) {
    console.error(
      "Refusing to run: FIRESTORE_EMULATOR_HOST is not set, so this would " +
        "target a non-emulator (production) database. Re-run with --prod to " +
        "confirm a real production run, or set FIRESTORE_EMULATOR_HOST to " +
        "target the dev emulator.",
    );
    process.exit(1);
  }

  if (prod && !emulator) {
    console.warn("");
    console.warn("=".repeat(72));
    console.warn("  PRODUCTION RUN — this will write journal entries and legs");
    console.warn(`  to the non-emulator database for namespace: ${namespace}`);
    console.warn("=".repeat(72));
    console.warn("");
    const rl = createInterface({ input: stdin, output: stdout });
    const answer = await rl.question(
      `Type the exact namespace string "${namespace}" to proceed: `,
    );
    rl.close();
    if (answer !== namespace) {
      console.error("Confirmation did not match. Aborting.");
      process.exit(1);
    }
  }

  console.log(
    `Migrating transactions to journal entries — namespace=${namespace}, ` +
      `mode=${emulator ? "emulator" : "PRODUCTION"}`,
  );

  // --- Connect -------------------------------------------------------------
  const db = await initFirebaseAdmin();

  // --- Migrate -------------------------------------------------------------
  const transactionsPath = nsCollectionPath(namespace, "transactions");
  const journalEntriesPath = nsCollectionPath(namespace, "journal-entries");
  const journalLegsPath = nsCollectionPath(namespace, "journal-legs");

  const snapshot = await db.collection(transactionsPath).get();

  let seen = 0;
  let migrated = 0;
  let skippedAlreadyMigrated = 0;
  let skippedNoTimestamp = 0;

  for (const doc of snapshot.docs) {
    seen += 1;
    const data = doc.data();

    const institution = data.institution as string;
    const account = data.account as string;
    const amount = data.amount as number;
    const category = (data.category as string) ?? "";
    const description = (data.description as string) ?? "";
    // `timestamp` is an Admin Timestamp (or null) — treated as an opaque
    // pass-through value, never constructed or compared here.
    const timestamp = data.timestamp as unknown;
    const note = data.note as string | null | undefined;
    const statementItemId = data.statementItemId as string | null | undefined;
    const groupId = data.groupId as string | null | undefined;
    const memberEmails = data.memberEmails as string[] | undefined;
    const journalEntryId = data.journalEntryId as string | null | undefined;

    // Idempotency skip: a transaction already linked to a journal entry has
    // been migrated by a prior run.
    if (typeof journalEntryId === "string" && journalEntryId.length > 0) {
      skippedAlreadyMigrated += 1;
      continue;
    }

    // A journal entry needs a date. A transaction with no timestamp cannot be
    // migrated — log a warning and skip it.
    if (timestamp === null || timestamp === undefined) {
      console.warn(
        `warn: transaction ${doc.id} has no timestamp — skipping (a journal ` +
          `entry needs a date)`,
      );
      skippedNoTimestamp += 1;
      continue;
    }

    const family = classifyCategory(category);
    // Bank account id matches an `accounts` doc id: `{institution}_{account}`.
    const bankAccountId = `${institution}_${account}`;
    const counterId = counterAccountId(family);

    // Debit/credit direction — one uniform rule for all families. A transaction
    // `amount` is positive for money out and negative for money in. Money in
    // (amount < 0) debits the bank account (an asset increasing); money out
    // credits it. The counter leg mirrors the bank leg exactly, so the entry is
    // always balanced. The family only chooses which counter account is used.
    const m = Math.abs(amount);
    const bankDebit = amount < 0 ? m : 0;
    const bankCredit = amount < 0 ? 0 : m;
    const counterDebit = amount < 0 ? 0 : m;
    const counterCredit = amount < 0 ? m : 0;

    // Deterministic doc ids keyed off the transaction id. This is what makes
    // the script idempotent even if a prior run was interrupted after writing
    // the entry/legs but before backfilling `journalEntryId`: `.set()` with the
    // same id overwrites identically rather than creating a duplicate.
    const entryId = `je-mig-${doc.id}`;
    const bankLegId = `jl-mig-${doc.id}-bank`;
    const counterLegId = `jl-mig-${doc.id}-counter`;

    const entryRef = db.collection(journalEntriesPath).doc(entryId);
    const bankLegRef = db.collection(journalLegsPath).doc(bankLegId);
    const counterLegRef = db.collection(journalLegsPath).doc(counterLegId);
    const txnRef = doc.ref;

    const batch = db.batch();

    batch.set(entryRef, {
      timestamp,
      description,
      note: note ?? null,
      legCount: 2,
      groupId: groupId ?? null,
      memberEmails: memberEmails ?? [],
    });

    batch.set(bankLegRef, {
      entryId,
      accountId: bankAccountId,
      debit: bankDebit,
      credit: bankCredit,
      timestamp,
      cleared: false,
      // statementItemId carried from #455 — set on the bank leg only.
      statementItemId: statementItemId ?? null,
      groupId: groupId ?? null,
      memberEmails: memberEmails ?? [],
    });

    batch.set(counterLegRef, {
      entryId,
      accountId: counterId,
      debit: counterDebit,
      credit: counterCredit,
      timestamp,
      cleared: false,
      groupId: groupId ?? null,
      memberEmails: memberEmails ?? [],
    });

    batch.update(txnRef, { journalEntryId: entryId });

    await batch.commit();
    migrated += 1;
  }

  // --- Report --------------------------------------------------------------
  console.log("");
  console.log("Migration complete.");
  console.log(`  transactions seen:           ${seen}`);
  console.log(`  migrated:                    ${migrated}`);
  console.log(`  skipped (already migrated):  ${skippedAlreadyMigrated}`);
  console.log(`  skipped (no timestamp):      ${skippedNoTimestamp}`);
  process.exit(0);
}

main().catch((err: unknown) => {
  console.error("Migration failed:");
  console.error(err);
  process.exit(1);
});
