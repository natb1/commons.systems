// Participation-log review — the human-readable report an office-hours owner
// reads to attest `strategy-join-existing-practice`'s participation evidence
// and to check whether any logged challenge has reached
// `strategy-external-calibration`.
//
// Run from anywhere (the store dir is resolved relative to this file, not cwd):
//   npx tsx packages/intentionsutil/scripts/participation-review.ts
//
// Report-only: this script never writes `reading`/`gap` onto any node. It only
// reads the live `intentions/` store and prints evidence.
//
// Log-append recipe (for the author, after each participation event):
//   1. Dump the strategy node:
//        npx tsx packages/intentionsutil/scripts/dump-node.ts strategy-join-existing-practice
//   2. Append a `{date, venue, activity, challenge}` entry to
//      `attributes.participation_log` in the resulting JSON (challenge is a
//      string or null).
//   3. Rewrite the node from the edited JSON:
//        npx tsx packages/intentionsutil/scripts/write-node.ts <path-to-edited-json>
//   4. Land it: `packages/intentionsutil/scripts/graph-commit`.
//
// Owner attestation recipe (after reviewing this report):
//   Stamp `reading`/`gap` on `intentions/strategy-join-existing-practice.md`
//   via the same dump-node.ts / write-node.ts / graph-commit sequence above,
//   editing `reading`/`gap` (and, on round completion, `rounds`) instead of
//   `attributes.participation_log`.

import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readNode } from "../src/store.js";
import {
  parseParticipationLog,
  participationSummary,
  challengeState,
} from "../src/participation.js";

/** Narrow an unknown thrown value to a message string without a type cast. */
function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// --- Paths -----------------------------------------------------------------
// The script lives at `packages/intentionsutil/scripts/participation-review.ts`,
// so the repo root is three directories up. Resolve from this file's own
// location, never from cwd.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));
const intentionsDir = join(repoRoot, "intentions");

const STRATEGY_ID = "strategy-join-existing-practice";
const EXTERNAL_ID = "strategy-external-calibration";

export function main(): number {
  const strategyNode = readNode(intentionsDir, STRATEGY_ID);
  const externalNode = readNode(intentionsDir, EXTERNAL_ID);

  const { entries, malformed } = parseParticipationLog(strategyNode);

  const lines: string[] = [];
  lines.push(`# Participation review — ${STRATEGY_ID}`);
  lines.push("");

  if (malformed.length > 0) {
    lines.push("## MALFORMED");
    lines.push("");
    lines.push(
      `attributes.participation_log on ${STRATEGY_ID} has ${malformed.length} defect(s) — ` +
        "the log must be fixed before an honest report can be produced:",
    );
    lines.push("");
    for (const defect of malformed) {
      lines.push(`- ${defect}`);
    }
    lines.push("");
    process.stdout.write(lines.join("\n") + "\n");
    return 1;
  }

  lines.push("## Entries");
  lines.push("");
  if (entries.length === 0) {
    lines.push("(none — no participation recorded yet; the reading is honestly zero)");
  } else {
    lines.push("| Date | Venue | Activity | Challenge |");
    lines.push("| --- | --- | --- | --- |");
    for (const e of entries) {
      lines.push(`| ${e.date} | ${e.venue} | ${e.activity} | ${e.challenge ?? "—"} |`);
    }
  }
  lines.push("");

  const today = new Date().toISOString().slice(0, 10);
  const summary = participationSummary(entries, today);
  lines.push("## Summary");
  lines.push("");
  lines.push(`- count: ${summary.count}`);
  lines.push(`- firstDate: ${summary.firstDate ?? "—"}`);
  lines.push(`- lastDate: ${summary.lastDate ?? "—"}`);
  lines.push(`- distinctVenues: ${summary.distinctVenues}`);
  lines.push(`- last30Days: ${summary.last30Days}`);
  lines.push(`- last90Days: ${summary.last90Days}`);
  lines.push("");

  const challenges = challengeState(entries, externalNode);
  lines.push("## Challenges");
  lines.push("");
  if (challenges.logged.length === 0) {
    lines.push("(none logged)");
  } else {
    lines.push("Logged entries with a challenge:");
    lines.push("");
    for (const e of challenges.logged) {
      lines.push(`- ${e.date} (${e.venue}, ${e.activity}): ${e.challenge}`);
    }
    lines.push("");
    lines.push(
      `ADVISORY — confirm each logged challenge above is recorded on ${EXTERNAL_ID} as a ` +
        `dated clarification. That is what "reaches" ${EXTERNAL_ID} means, per ` +
        `${STRATEGY_ID}'s 2026-07-11 clarification.`,
    );
  }
  lines.push("");
  lines.push(`### ${EXTERNAL_ID} — current reading/gap (verbatim)`);
  lines.push("");
  lines.push(`- reading: ${challenges.externalReading ?? "—"}`);
  lines.push(`- gap: ${challenges.externalGap ?? "—"}`);
  lines.push("");

  lines.push("## Owner attestation");
  lines.push("");
  lines.push(
    `Stamp \`reading\`/\`gap\` on **${STRATEGY_ID}** — this tactic's signal-target ` +
      `node. Do NOT stamp ${EXTERNAL_ID}: its \`reading\`/\`gap\` is quoted verbatim in ` +
      `\`## Challenges\` above only for context, and is not the node this report attests.`,
  );
  lines.push("");
  lines.push(
    `Stamp it on \`intentions/${STRATEGY_ID}.md\` via this dump-node.ts / write-node.ts / ` +
      `graph-commit sequence (identical to this script's header recipe, but editing ` +
      `\`reading\`/\`gap\` — and, on round completion, \`rounds\` — instead of ` +
      `\`attributes.participation_log\`):`,
  );
  lines.push("");
  lines.push(
    `  1. Dump the strategy node:\n` +
      `       npx tsx packages/intentionsutil/scripts/dump-node.ts ${STRATEGY_ID}`,
  );
  lines.push(
    `  2. In the resulting JSON, set \`reading\`/\`gap\` (and, on round completion, ` +
      `\`rounds\`) on ${STRATEGY_ID} — NOT on ${EXTERNAL_ID}.`,
  );
  lines.push(
    `  3. Rewrite the node from the edited JSON:\n` +
      `       npx tsx packages/intentionsutil/scripts/write-node.ts <path-to-edited-json>`,
  );
  lines.push(
    `  4. Land it: \`packages/intentionsutil/scripts/graph-commit\`.`,
  );
  lines.push("");
  lines.push(
    `Round completion's \`rounds\` stamp on ${STRATEGY_ID} — see \`tactic-join-indieweb\`'s ` +
      `parked recommendation for that node's role.`,
  );
  lines.push("");

  process.stdout.write(lines.join("\n") + "\n");
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exit(main());
  } catch (err) {
    process.stderr.write(`${errMessage(err)}\n`);
    process.exit(1);
  }
}
