---
id: tactic-benc-format-versioning
kind: tactic
statement: Add a format-version byte to the BENC header and a cross-language
  (Go+TS) test-vector suite
owner: ai
status: codified
parent: null
rationale: "Surfaced at the 2026-07-07 /align-strategy interview: the BENC
  header (magic/salt/IV only) carries no version or KDF-params field, so a
  future parameter change silently breaks TypeScript-Go round-trips of encrypted
  financial snapshots; and the Go/TS snapshot-schema validators are
  hand-mirrored with only a golden fixture guarding drift. Drift note, finalized
  2026-07-11 /align-tactics round: the draft planned one coordinated format
  epoch with tactic-crypto-core-consolidate, but that consolidation landed (PR
  2836) without a header change - this tactic is now its own format epoch, with
  exactly one TS core (packages/crypto-core) and one Go implementation
  (projects/budget-etl/internal/export) to change. Adds a version-discriminating
  header plus shared cross-language test vectors both implementations must
  decrypt."
reading: null
gap: null
serves:
  - strategy-durable-owned-data
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution:
  branch: tactic-benc-format-versioning
  pr: null
  attempts: {}
  markers: []
  strategy_fingerprint: 68a324156abf9b4ee033c0578a9e3fcd0753a38fa70be3c3a21e996eca0525f5
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Add a format-version byte to the BENC header and a cross-language (Go+TS) test-vector suite

## Context

BENC files are `[magic "BENC" 4B][salt 16B][IV 12B][AES-256-GCM ciphertext +
16B tag]`, key via PBKDF2-HMAC-SHA256 at 600,000 iterations — implemented
twice, byte-for-byte: `packages/crypto-core/src/crypto-core.ts:4-12` (TS,
WebCrypto) and `projects/budget-etl/internal/export/export.go:18-31` (Go).
Two recorded hazards (`strategy-durable-owned-data` clarification 2): the
header carries no format-version/KDF-params field, so a future parameter
change silently breaks TS↔Go round-trips of encrypted financial snapshots;
and the Go/TS snapshot validators are hand-mirrored with only a fixture
guarding drift.

Drift note (finalized 2026-07-11): the draft planned one coordinated format
epoch with `tactic-crypto-core-consolidate`; that consolidation landed
(PR 2836) without a header change, so this tactic is now its own format
epoch — with exactly one TS core and one Go implementation to change.

**Design (greenfield):** a version-discriminating magic plus a compiled-in
table of fixed parameter sets — not self-describing KDF params (an
attacker-writable iteration count invites DoS-by-huge-count parsing risk; at
individual scale a table both implementations compile in is enough, and the
vector suite catches table drift). Legacy files carry a *random salt byte* at
offset 4, so a version byte inserted after `"BENC"` cannot be discriminated
from legacy data; the version therefore rides the magic itself:

- magic `"BENC"` → format v1: parameters exactly as today (implicit).
- magic `"BNC2"` → `[magic 4B][version 1B = 0x02][salt 16B][IV 12B][ct+tag]`;
  the table maps `0x02` → the same PBKDF2-SHA256/600k/salt16/iv12 set (the
  epoch buys the discriminator, not new crypto).
- Unknown magic or unknown version byte → a clear error naming what was found
  ("BENC file from a newer format — update this tool"), never a fallback.

Both implementations read v1+v2 and write v2. A pre-change deployed budget
app cannot read v2 files; that is a rollout-window risk only (app and CLI
ship from this repo) and the QA step below closes it.

## Unit 1 — cross-language test-vector suite (locks current v1 behavior)

**Recommended model:** sonnet

**Scope:** create `packages/crypto-core/testdata/benc-vectors/` as the single
canonical vector home: `plaintext.json` (small known payload),
`password.txt` (fixture password — test-only, committable), `v1-ts.benc`
(generated once via the TS `encryptJSON`), `v1-go.benc` (generated once via
Go `EncryptJSON`), and a `README.md` stating the regeneration commands and
that BOTH suites must consume these same files. Add decode cases on each
side: `packages/crypto-core/src/crypto-core.test.ts` decrypts both fixtures
to the known plaintext; `projects/budget-etl/internal/export/export_test.go`
mirrors it (reach the shared dir by relative path
`../../../../packages/crypto-core/testdata/benc-vectors` — Go tests run from
the package dir in a full checkout, which is how CI runs them,
`.github/workflows/unit-tests.yml:305`). Out of scope: any header change.

## Unit 2 — v2 versioned header in both implementations

**Recommended model:** opus

**Dependencies:** Unit 1 (vectors first, so the format change is made against
locked v1 behavior).

**Scope:**

- `packages/crypto-core/src/crypto-core.ts`: add the `"BNC2"` magic, version
  byte `0x02`, and a version→params table; `encryptJSON` writes v2;
  decrypt dispatches on magic (`BENC` → v1 params/offsets, `BNC2` → read
  version byte, table lookup, unknown → descriptive throw). Header-length
  handling becomes per-version. Update the format comment block (lines 4-6).
- `projects/budget-etl/internal/export/export.go`: mirror exactly —
  `IsEncrypted` accepts both magics (`:33-35`), `decryptJSON` (`:84`)
  dispatches, `EncryptJSON` writes v2, format comment (`:18-22`) updated.
- Extend the vector suite: commit `v2-ts.benc` + `v2-go.benc`; both language
  suites decode all four vectors; add unknown-version and truncated-header
  error cases in both languages.
- Downstream check only (no code change expected): `budget/src/crypto.ts:6`
  and `budget/src/crypto-worker.ts:4` consume `@commons-systems/crypto-core`
  exports; confirm they compile against any signature additions.

Out of scope: KDF parameter changes (v2 params are identical to v1);
unifying the hand-mirrored Go/TS snapshot JSON validators (the second
clarification-2 hazard) — the shared `plaintext.json` vector is the interim
golden guard; unification is future work if drift recurs.

## Reuse

- TS primitives: `packages/crypto-core/src/crypto-core.ts` (`deriveKey:15`,
  existing encrypt/decrypt, `MAGIC/SALT_LEN/IV_LEN/HEADER_LEN:8-12`).
- Go primitives: `projects/budget-etl/internal/export/export.go`
  (`deriveKey:38`, `newGCM:42`, `decryptJSON:84`).
- Existing tests to extend: `packages/crypto-core/src/crypto-core.test.ts`,
  `projects/budget-etl/internal/export/export_test.go`.

## Verification

```verify
npx vitest run --project packages/crypto-core --root . || exit 1
go test -C projects/budget-etl ./internal/export/
```

Manual (QA phase): export a fresh snapshot from the deployed budget app and
confirm `budget-etl dump` reads it (v2 through prod); open an existing v1
`.benc` from the archive in the app (legacy read still works). The archive's
Drive copies stay v1 until the owner next exports — the audit instrument's
`benc-magic` check (`tactic-durability-audit-instrument`) must accept both
magics once this lands; if that tactic lands first, extend its magic list
here.
