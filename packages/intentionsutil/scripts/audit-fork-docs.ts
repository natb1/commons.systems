// Audit the public artifacts to produce the machine-verifiable half of the
// `strategy-open-source-as-gift` signal reading. It enumerates the public
// artifacts — the whole-repo fork surface (`repo`, documented by the root
// `README.md`) plus one artifact per Firebase hosting target read from
// `.firebaserc` — machine-checks the presence half of the threshold (fork
// documentation exists per artifact), and prints the sufficiency attestation
// checklist only the owner can complete.
//
// Report-only: it does NOT write `reading`/`gap` onto any node. The owner review
// at office-hours consumes this report, completes the attestation checklist, and
// stamps `reading`/`gap` on `intentions/strategy-open-source-as-gift.md`.
//
// Deliberately NOT registered in `read-sensors.ts`'s default registry: although
// this census is local-first/no-network, that registry auto-writes `reading`/`gap`,
// and this sensor's sufficiency half is owner judgment — report-only mirrors the
// `audit-publishing.ts` precedent. Run from the repo root:
//   node --import tsx/esm packages/intentionsutil/scripts/audit-fork-docs.ts
//
// Exit 0 when every artifact's README is present and non-empty; exit 1 when any
// is missing (the missing list is the gap evidence). An unreadable or unparseable
// `.firebaserc`, zero or multiple project entries under `targets`, an empty
// hosting map, or a hosting target whose same-named source directory does not
// exist is a FATAL error (clear errors over fallbacks) — a broken enumeration
// means the instrument cannot produce an honest reading.

import { readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** Narrow an unknown thrown value to a message string without a type cast. */
function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Type guard: a non-null, non-array object indexable by string. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// --- IO contract -----------------------------------------------------------
// A tiny injected fs facade so the pure core never touches the real tree. All
// paths are repo-root-relative. `readText` returns `null` for a missing file.
export interface FsFacade {
  readText(path: string): string | null;
  isDir(path: string): boolean;
}

// --- Result shapes ---------------------------------------------------------
export interface Artifact {
  name: string;
  readme: string;
}
export interface ArtifactResult {
  name: string;
  readme: string;
  /** True when the README file exists and is non-empty. */
  present: boolean;
}
export interface AuditSummary {
  artifacts: ArtifactResult[];
  /** True when every artifact's README is present. */
  allPresent: boolean;
  /** Process exit code: 0 when allPresent, else 1. */
  exitCode: number;
}

// --- Enumeration -----------------------------------------------------------

/**
 * Enumerate the public artifacts. Always includes the `repo` artifact
 * (whole-repo fork surface, root `README.md`); then parses `.firebaserc` and
 * appends one artifact per hosting target. Throws a fatal error when the
 * enumeration cannot be produced honestly: unreadable or unparseable
 * `.firebaserc`, zero or multiple project entries under `targets`, an empty
 * hosting map, or a hosting target whose same-named source directory is absent.
 */
export function enumerateArtifacts(fs: FsFacade): Artifact[] {
  const artifacts: Artifact[] = [{ name: "repo", readme: "README.md" }];

  const raw = fs.readText(".firebaserc");
  if (raw === null) {
    throw new Error(
      "audit-fork-docs: cannot read .firebaserc — enumeration requires it",
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `audit-fork-docs: could not parse .firebaserc — invalid JSON: ${errMessage(err)}`,
    );
  }

  const targets = isRecord(parsed) ? parsed.targets : undefined;
  if (!isRecord(targets)) {
    throw new Error(
      "audit-fork-docs: .firebaserc has no `targets` object — cannot enumerate hosting targets",
    );
  }

  // Fork-friendly: a fork changes the Firebase project id, so do not hardcode
  // `commons-systems`. Require exactly one project entry under `targets`.
  const projectKeys = Object.keys(targets);
  if (projectKeys.length !== 1) {
    throw new Error(
      `audit-fork-docs: expected exactly one project under .firebaserc \`targets\`, found ${projectKeys.length} (${projectKeys.join(", ") || "none"})`,
    );
  }

  const project = targets[projectKeys[0]];
  const hosting = isRecord(project) ? project.hosting : undefined;
  if (!isRecord(hosting)) {
    throw new Error(
      `audit-fork-docs: .firebaserc project \`${projectKeys[0]}\` has no \`hosting\` map`,
    );
  }

  const targetNames = Object.keys(hosting);
  if (targetNames.length === 0) {
    throw new Error(
      `audit-fork-docs: .firebaserc project \`${projectKeys[0]}\` has an empty \`hosting\` map — nothing to enumerate`,
    );
  }

  for (const name of targetNames) {
    if (!fs.isDir(name)) {
      throw new Error(
        `audit-fork-docs: hosting target \`${name}\` has no same-named source directory — cannot enumerate its fork docs`,
      );
    }
    artifacts.push({ name, readme: `${name}/README.md` });
  }

  return artifacts;
}

// --- Core audit ------------------------------------------------------------

/**
 * Enumerate the public artifacts and machine-check the presence half of the
 * threshold: each artifact's README exists and is non-empty. Pure except for the
 * injected fs facade. A missing README is a per-artifact finding (recorded, does
 * not abort); a broken enumeration throws (see `enumerateArtifacts`).
 */
export function auditForkDocs(fs: FsFacade): AuditSummary {
  const artifacts = enumerateArtifacts(fs);
  const results: ArtifactResult[] = [];
  let allPresent = true;

  for (const artifact of artifacts) {
    const content = fs.readText(artifact.readme);
    const present = content !== null && content.trim().length > 0;
    if (!present) allPresent = false;
    results.push({ name: artifact.name, readme: artifact.readme, present });
  }

  return { artifacts: results, allPresent, exitCode: allPresent ? 0 : 1 };
}

// --- Report ----------------------------------------------------------------

/** Escape the characters that would break a markdown table cell. */
function cell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ").trim();
}

/** Render the audit summary as a markdown report (stdout). */
export function formatReport(summary: AuditSummary): string {
  const lines: string[] = [];
  lines.push("# Fork-doc census — strategy-open-source-as-gift");
  lines.push("");
  lines.push("Public artifacts and whether each carries fork documentation.");
  lines.push("");
  lines.push("| Artifact | README | present |");
  lines.push("| --- | --- | --- |");
  for (const a of summary.artifacts) {
    lines.push(`| ${cell(a.name)} | ${cell(a.readme)} | ${a.present ? "yes" : "no"} |`);
  }
  lines.push("");

  lines.push("## Attestation checklist (owner)");
  lines.push("");
  lines.push(
    "The machine check above confirms only that documentation *exists*. Whether it",
  );
  lines.push(
    "is *sufficient for a shallow fork to stand alone* is owner judgment — complete",
  );
  lines.push("one line per artifact:");
  lines.push("");
  for (const a of summary.artifacts) {
    lines.push(
      `- [ ] ${a.name}: documentation sufficient for a shallow fork to stand alone? (scope incl. @commons-systems/* deps / architecture & data flow / build & run from a fresh clone / deployment & required services / dependency inlining-or-replacement guidance / CC-BY-SA share-alike terms)`,
    );
  }
  lines.push("");
  lines.push(
    "Result lands via the owner: stamp `reading`/`gap` on `intentions/strategy-open-source-as-gift.md` (write-node.ts + graph-commit).",
  );
  lines.push("");

  return lines.join("\n");
}

// --- Main ------------------------------------------------------------------
// The script lives at `packages/intentionsutil/scripts/audit-fork-docs.ts`, so
// the repo root is three directories up. Resolve from this file's own location,
// never from cwd.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(dirname(scriptDir)));

/** fs facade wired to `node:fs`, resolving repo-root-relative paths. */
const nodeFs: FsFacade = {
  readText(path) {
    try {
      return readFileSync(join(repoRoot, path), "utf8");
    } catch {
      return null;
    }
  },
  isDir(path) {
    try {
      return statSync(join(repoRoot, path)).isDirectory();
    } catch {
      return false;
    }
  },
};

export function main(): number {
  const summary = auditForkDocs(nodeFs);
  process.stdout.write(formatReport(summary));
  return summary.exitCode;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exit(main());
  } catch (err) {
    process.stderr.write(`${errMessage(err)}\n`);
    process.exit(1);
  }
}
