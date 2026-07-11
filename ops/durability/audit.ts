//
// Durability audit instrument (tactic-durability-audit-instrument, serving
// strategy-durable-owned-data). Reads an owner-editable manifest of owned-data
// classes and reports, per class, whether it meets the strategy threshold:
// "no owned-data class has a single copy, a restore has been rehearsed within
// the review cycle, and the household can read the archive."
//
// This script covers the copy-redundancy and readability half (copy counts,
// freshness, verify hooks). The rehearsal half is an office-hours step
// (tactic-durability-restore-rehearsal) driven by ops/durability/RESTORE.md.
//
// Run: node --import tsx/esm ops/durability/audit.ts --manifest <path>
//      [--decrypt-verify] [--budget-etl <path-to-budget-etl-binary>]
//
// Exit 0 only when every class passes; nonzero otherwise. An unreadable or
// invalid manifest is a fatal error (clear errors over fallbacks —
// .claude/rules/code-style.md).

import { execFileSync } from "node:child_process";
import { openSync, readSync, closeSync, readFileSync, statSync, readdirSync } from "node:fs";
import { join } from "node:path";

// The 4 BENC magic bytes ("BENC"), duplicated from
// packages/crypto-core/src/crypto-core.ts:8 (ops/ is not a workspace package,
// so we copy 4 bytes rather than add a package dependency).
const BENC_MAGIC = Buffer.from([0x42, 0x45, 0x4e, 0x43]);

type VerifyKind = "benc-magic" | "git" | "exists";

interface CopyEntry {
  path: string;
  off_machine: boolean;
}

interface ClassEntry {
  id: string;
  description: string;
  min_copies?: number;
  verify: VerifyKind;
  copies: CopyEntry[];
}

interface CopyResult {
  path: string;
  offMachine: boolean;
  exists: boolean;
  fileCount: number;
  newestMtime: Date | null;
  verifyOk: boolean;
  note: string;
}

interface Args {
  manifest: string;
  decryptVerify: boolean;
  budgetEtl: string | null;
}

function fatal(message: string): never {
  process.stderr.write(`durability audit: ${message}\n`);
  process.exit(2);
}

// Extract a message from an unknown catch binding without an `as` cast.
function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function parseArgs(argv: string[]): Args {
  let manifest: string | null = null;
  let decryptVerify = false;
  let budgetEtl: string | null = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--manifest") {
      manifest = argv[++i] ?? fatal("--manifest requires a path argument");
    } else if (a === "--decrypt-verify") {
      decryptVerify = true;
    } else if (a === "--budget-etl") {
      budgetEtl = argv[++i] ?? fatal("--budget-etl requires a path argument");
    } else {
      fatal(`unknown argument: ${a}`);
    }
  }
  if (manifest === null) fatal("--manifest <path> is required");
  return { manifest, decryptVerify, budgetEtl };
}

function loadManifest(path: string): ClassEntry[] {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch (err) {
    fatal(`cannot read manifest ${path}: ${errMsg(err)}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    fatal(`manifest ${path} is not valid JSON: ${errMsg(err)}`);
  }
  if (!Array.isArray(parsed)) {
    fatal(`manifest ${path} must be a JSON array of class entries`);
  }
  parsed.forEach((entry, i) => validateClass(entry, i, path));
  return parsed as ClassEntry[]; // type-safety-ok: narrowed by validateClass on every element above
}

function validateClass(entry: unknown, index: number, path: string): void {
  const where = `manifest ${path} entry ${index}`;
  if (typeof entry !== "object" || entry === null) fatal(`${where} is not an object`);
  const e = entry as Record<string, unknown>; // type-safety-ok: untrusted JSON manifest edge; guarded object above
  if (typeof e.id !== "string" || e.id.length === 0) fatal(`${where} missing string "id"`);
  if (typeof e.description !== "string") fatal(`${where} (${e.id}) missing string "description"`);
  if (e.verify !== "benc-magic" && e.verify !== "git" && e.verify !== "exists") {
    fatal(`${where} (${e.id}) "verify" must be one of benc-magic|git|exists`);
  }
  if (e.min_copies !== undefined && (typeof e.min_copies !== "number" || e.min_copies < 1)) {
    fatal(`${where} (${e.id}) "min_copies" must be a positive number`);
  }
  if (!Array.isArray(e.copies) || e.copies.length === 0) {
    fatal(`${where} (${e.id}) "copies" must be a non-empty array`);
  }
  e.copies.forEach((c, j) => {
    if (typeof c !== "object" || c === null) fatal(`${where} (${e.id}) copy ${j} is not an object`);
    const cc = c as Record<string, unknown>; // type-safety-ok: untrusted JSON manifest edge; guarded object above
    if (typeof cc.path !== "string" || cc.path.length === 0) {
      fatal(`${where} (${e.id}) copy ${j} missing string "path"`);
    }
    if (typeof cc.off_machine !== "boolean") {
      fatal(`${where} (${e.id}) copy ${j} missing boolean "off_machine"`);
    }
  });
}

// Directories never counted as owned data — build/VCS bookkeeping that would
// otherwise explode the walk (a monorepo checkout hides ~100k files under
// node_modules). Skipping them keeps the filesystem walk bounded to real
// owned content; git-verify classes get their stats from git, not this walk.
const SKIP_DIRS = new Set([".git", "node_modules", ".direnv"]);

// Recursively collect regular files under a path (or the path itself if a file).
function collectFiles(path: string): string[] {
  const st = statSync(path);
  if (!st.isDirectory()) return [path];
  const out: string[] = [];
  for (const name of readdirSync(path)) {
    if (SKIP_DIRS.has(name)) continue;
    const child = join(path, name);
    let cst;
    try {
      cst = statSync(child);
    } catch {
      continue;
    }
    if (cst.isDirectory()) out.push(...collectFiles(child));
    else out.push(child);
  }
  return out;
}

function newestMtime(files: string[]): Date | null {
  let newest: number | null = null;
  for (const f of files) {
    try {
      const m = statSync(f).mtimeMs;
      if (newest === null || m > newest) newest = m;
    } catch {
      // ignore unreadable entries in the freshness scan
    }
  }
  return newest === null ? null : new Date(newest);
}

function startsWithBencMagic(file: string): boolean {
  const buf = Buffer.alloc(4);
  const fd = openSync(file, "r");
  try {
    const n = readSync(fd, buf, 0, 4, 0);
    return n === 4 && buf.equals(BENC_MAGIC);
  } finally {
    closeSync(fd);
  }
}

// Encrypted-snapshot file extensions in real use: `.benc` (the browser FSA
// export/local-file flow, budget/src/local-file.ts:41) and `.enc.json` (the
// automated budget-etl snapshotDir/current convention that actually populates
// the shared-drive archive — .claude/skills/budget/SKILL.md, "encrypted
// (`.enc.json`)"). Both carry the same BENC magic header; matching only
// `.benc` would report the real archive as empty.
function isEncryptedSnapshotFile(name: string): boolean {
  return name.endsWith(".benc") || name.endsWith(".enc.json");
}

function verifyBencMagic(path: string): { ok: boolean; note: string } {
  const bencFiles = collectFiles(path).filter((f) => isEncryptedSnapshotFile(f));
  if (bencFiles.length === 0) return { ok: false, note: "no .benc/.enc.json files found" };
  const bad: string[] = [];
  for (const f of bencFiles) {
    try {
      if (!startsWithBencMagic(f)) bad.push(f);
    } catch (err) {
      bad.push(`${f} (${errMsg(err)})`);
    }
  }
  if (bad.length > 0) return { ok: false, note: `bad BENC magic: ${bad.join(", ")}` };
  return { ok: true, note: `${bencFiles.length} encrypted snapshot file(s) valid` };
}

function verifyGit(path: string): { ok: boolean; note: string } {
  try {
    const inside = execFileSync("git", ["-C", path, "rev-parse", "--is-inside-work-tree"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (inside !== "true") return { ok: false, note: "not a git work tree" };
  } catch {
    return { ok: false, note: "not a git work tree" };
  }
  try {
    const url = execFileSync("git", ["-C", path, "remote", "get-url", "origin"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return { ok: true, note: `origin ${url}` };
  } catch {
    return { ok: false, note: "no origin remote" };
  }
}

function runVerify(kind: VerifyKind, path: string): { ok: boolean; note: string } {
  switch (kind) {
    case "benc-magic":
      return verifyBencMagic(path);
    case "git":
      return verifyGit(path);
    case "exists":
      return { ok: true, note: "present" };
  }
}

// File count + freshness for a git work tree, derived from git rather than a
// filesystem walk: a repo checkout nests other checkouts (e.g. this monorepo's
// .claude/worktrees/*), so walking it is both unbounded and meaningless. Count
// is tracked files; freshness is the last commit date. Returns null count on a
// non-repo (verifyGit reports that as the FAIL).
function gitStats(path: string): { fileCount: number; newestMtime: Date | null } {
  let fileCount = 0;
  let newestMtime: Date | null = null;
  try {
    const listed = execFileSync("git", ["-C", path, "ls-files"], {
      encoding: "utf8",
      maxBuffer: 256 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    });
    fileCount = listed.length === 0 ? 0 : listed.trimEnd().split("\n").length;
  } catch {
    fileCount = 0;
  }
  try {
    const iso = execFileSync("git", ["-C", path, "log", "-1", "--format=%cI"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (iso.length > 0) newestMtime = new Date(iso);
  } catch {
    newestMtime = null;
  }
  return { fileCount, newestMtime };
}

function auditCopy(copy: CopyEntry, verify: VerifyKind): CopyResult {
  let exists = true;
  try {
    statSync(copy.path);
  } catch {
    exists = false;
  }
  if (!exists) {
    return {
      path: copy.path,
      offMachine: copy.off_machine,
      exists: false,
      fileCount: 0,
      newestMtime: null,
      verifyOk: false,
      note: "path not found",
    };
  }
  const v = runVerify(verify, copy.path);
  // git work trees get bounded stats from git; other classes walk the tree
  // (bounded by SKIP_DIRS, which drops node_modules/.git/.direnv).
  const stats =
    verify === "git"
      ? gitStats(copy.path)
      : (() => {
          const files = collectFiles(copy.path);
          return { fileCount: files.length, newestMtime: newestMtime(files) };
        })();
  return {
    path: copy.path,
    offMachine: copy.off_machine,
    exists: true,
    fileCount: stats.fileCount,
    newestMtime: stats.newestMtime,
    verifyOk: v.ok,
    note: v.note,
  };
}

// Newest existing encrypted snapshot file across a class's copies (for
// --decrypt-verify).
function newestBencFile(results: CopyResult[]): string | null {
  let newest: { file: string; mtime: number } | null = null;
  for (const r of results) {
    if (!r.exists) continue;
    for (const f of collectFiles(r.path).filter((x) => isEncryptedSnapshotFile(x))) {
      try {
        const m = statSync(f).mtimeMs;
        if (newest === null || m > newest.mtime) newest = { file: f, mtime: m };
      } catch {
        // ignore
      }
    }
  }
  return newest?.file ?? null;
}

function decryptVerify(
  cls: ClassEntry,
  results: CopyResult[],
  budgetEtl: string | null,
): { ok: boolean; skipped: boolean; note: string } {
  if (budgetEtl === null) {
    return { ok: false, skipped: true, note: "SKIPPED (no --budget-etl binary supplied)" };
  }
  const file = newestBencFile(results);
  if (file === null) {
    return { ok: false, skipped: true, note: "SKIPPED (no .benc file to decrypt)" };
  }
  try {
    // budget-etl dump [--keychain <name>] <path>; empty keychain falls back to
    // BUDGET_ETL_PASSWORD (projects/budget-etl/internal/password).
    const out = execFileSync(budgetEtl, ["dump", file], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    JSON.parse(out);
    return { ok: true, skipped: false, note: `decrypted ${file}, output is valid JSON` };
  } catch (err) {
    return { ok: false, skipped: false, note: `decrypt failed for ${file}: ${errMsg(err)}` };
  }
}

function fmtMtime(d: Date | null): string {
  return d === null ? "—" : d.toISOString().slice(0, 19).replace("T", " ");
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const classes = loadManifest(args.manifest);

  const lines: string[] = [];
  lines.push("# Durability audit");
  lines.push("");
  lines.push(`Manifest: \`${args.manifest}\``);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");

  let allPass = true;

  for (const cls of classes) {
    const minCopies = cls.min_copies ?? 2;
    const results = cls.copies.map((c) => auditCopy(c, cls.verify));

    const foundCount = results.filter((r) => r.exists).length;
    // For a git work tree the off-machine copy is the origin remote (e.g.
    // GitHub), which the `git` verify proves by finding an `origin` remote — so
    // a passing git copy supplies the off-machine redundancy on its own, no
    // second filesystem path required. Every other class needs a copy the owner
    // explicitly marked off_machine.
    const hasOffMachine = results.some(
      (r) => r.exists && (r.offMachine || (cls.verify === "git" && r.verifyOk)),
    );
    const allVerifyOk = results.every((r) => !r.exists || r.verifyOk);

    let decrypt: { ok: boolean; skipped: boolean; note: string } | null = null;
    if (args.decryptVerify && cls.verify === "benc-magic") {
      decrypt = decryptVerify(cls, results, args.budgetEtl);
    }

    const pass =
      foundCount >= minCopies &&
      hasOffMachine &&
      allVerifyOk &&
      (decrypt === null || decrypt.ok || decrypt.skipped);
    if (!pass) allPass = false;

    lines.push(`## ${cls.id} — ${pass ? "PASS" : "FAIL"}`);
    lines.push("");
    lines.push(cls.description);
    lines.push("");
    lines.push(`Requires ≥ ${minCopies} copies, ≥ 1 off-machine, verify \`${cls.verify}\`.`);
    lines.push("");
    lines.push("| copy | off-machine | exists | files | newest | verify |");
    lines.push("| --- | --- | --- | --- | --- | --- |");
    for (const r of results) {
      const verifyCell = !r.exists ? "—" : r.verifyOk ? `ok (${r.note})` : `FAIL (${r.note})`;
      lines.push(
        `| \`${r.path}\` | ${r.offMachine ? "yes" : "no"} | ${r.exists ? "yes" : "**no**"} | ${
          r.exists ? r.fileCount : "—"
        } | ${fmtMtime(r.newestMtime)} | ${verifyCell} |`,
      );
    }
    lines.push("");
    const reasons: string[] = [];
    if (foundCount < minCopies) reasons.push(`only ${foundCount}/${minCopies} copies found`);
    if (!hasOffMachine) reasons.push("no off-machine copy present");
    if (!allVerifyOk) reasons.push("a verify hook failed");
    if (decrypt !== null) {
      lines.push(`Decrypt-verify: ${decrypt.note}`);
      lines.push("");
      if (!decrypt.ok && !decrypt.skipped) reasons.push("decrypt-verify failed");
    }
    if (reasons.length > 0) lines.push(`FAIL: ${reasons.join("; ")}.`);
    else lines.push("PASS: redundant, off-machine, and readable.");
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push(`## Overall: ${allPass ? "PASS" : "FAIL"}`);
  lines.push("");
  lines.push(
    allPass
      ? "Every owned-data class meets the copy-redundancy and readability threshold. The restore rehearsal (office-hours) completes the strategy reading."
      : "One or more owned-data classes fail the threshold. See the per-class FAIL lines above.",
  );
  lines.push("");

  process.stdout.write(lines.join("\n"));
  process.exit(allPass ? 0 : 1);
}

main();
