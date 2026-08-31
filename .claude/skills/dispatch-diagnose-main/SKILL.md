---
name: dispatch-diagnose-main
description: Diagnose origin/main's failing CI when a red main is detected; runs as a spawned bg job that enumerates failing checks, fetches logs, and records the redacted likely-cause summary as a find-or-create tactic-main-red-<shortsha> graph node serving strategy-main-health.
---

# Dispatch: Diagnose Main

Runs as its own `claude --bg` job (session name `diagnose-main`) spawned when
the `main-health` sensor reads red — `origin/main` itself is failing CI, so no
new work is safe to start. The diagnosis is recorded as a find-or-create graph
tactic node `tactic-main-red-<shortsha>` (one per red episode, keyed on the
broken HEAD's short SHA). That node `serves` and `validates`
`strategy-main-health`, so it inherits the strategy's rank and becomes a
durable, dispatchable fix item that outlives this job's transcript. It is born
a draft (`phase: null`) — a diagnosis, not yet a plan; a later
`/align-tactics tactic-main-red-<shortsha>` finalizes it into an actual fix
plan. This job holds no dispatch lock. The skill does **not** run the sweep,
create a worktree, branch, PR, or invoke any phase skill, and it never files or
edits a GitHub issue.

Takes `<sha>` as its single argument — the broken `origin/main` HEAD commit.

Run `gh` commands with `dangerouslyDisableSandbox: true` — see
`.claude/rules/sandbox.md`. The graph-write step's `write-node.ts` /
`dump-node.ts` fences and its `graph-commit` call (Step 3) need it too — but
**not** for the npm-cache reason this note used to give. That rationale was
measured and refuted on this host and no longer appears in
`.claude/rules/sandbox.md`, and `node --import tsx/esm` needs no override of its
own. The still-valid reasons are two:

- Every Step 3 fence reads or writes under `$CLAUDE_JOB_DIR/tmp`, a path outside
  `.claude/settings.json`'s `sandbox.filesystem.allowWrite`; measured, a write
  under that root returns `Read-only file system`.
- `graph-commit` is one of `.claude/rules/sandbox.md`'s named pre-emptive
  exceptions: its internal rebase meets the read-only `.claude/` carve-outs,
  aborts, and **reverts the uncommitted node edit**, so the override must be set
  on the *first* attempt — a retry has nothing left to retry on.

## 1. Enumerate failing checks

Aggregate the two GitHub views of `origin/main`'s CI:

```bash
gh run list --branch main
gh api repos/{owner}/{repo}/commits/<sha>/check-runs
```

Both calls need `dangerouslyDisableSandbox: true`.

## 2. Fetch evidence for each failing check

- For a failing **workflow run**, fetch its logs:
  ```bash
  gh run view <databaseId> --log-failed
  ```
- For a failing **CodeQL check-run** (which has no workflow-run id), surface
  its `details_url` from the check-runs response.

## 3. Record the diagnosis as a graph tactic node

Compose the likely cause from the logs and check-run details. This prose is the
node **body**.

### Redaction rule (applies to the body text)

Record the broken HEAD `<sha>` as prose (e.g. `origin/main HEAD <sha>`); keep it
a bare reference and never place a closing keyword next to a `#N`. This applies
to log-sourced text too: if a failing check, step, or test name carries a
closing keyword followed by a `#N` (e.g. a test named `closes #5 regression`),
GitHub would read it as a directive and auto-close that unrelated issue if the
text ever reached an issue/PR/commit — neutralize it (drop the `#`, or reword)
before it reaches the body. See `.claude/rules/issue-references.md` for the full
keyword set (close/closes/closed, fix/fixes/fixed, resolve/resolves/resolved).

Include only the failing check/step name and a high-level error category
(e.g. "test assertion failed", "lint error", "type error"). Do not reproduce
raw log lines, environment-variable values, file paths beyond the immediate
failing module, or any string that looks like a token, credential, or other
secret — even if GitHub Actions has already partially masked it. The
`--log-failed` output may inadvertently surface CI internals; the body is for
the user, not a copy of the log.

Write the redacted body to a temp file under `$CLAUDE_JOB_DIR/tmp` (call it
`$body_file`). Never interpolate the diagnosis inline into a shell command —
log-sourced text may carry shell metacharacters.

### Compute the node id

```bash
shortsha=$(git rev-parse --short=8 <red-sha>)   # 8 hex chars, GitHub's UI convention
id="tactic-main-red-$shortsha"
```

### Find-or-create (idempotent per episode)

Classify the node's current state. Mirror the `node --import tsx/esm -e '...'`
store-import idiom `reconcile-graph-merged` uses (it imports from
`./packages/intentionsutil/src/store.js` and calls `listNodes`/`readNode`); run
it from the repo root with `dangerouslyDisableSandbox: true`:

```bash
state=$(node --import tsx/esm -e '
  const { readNode } = await import("./packages/intentionsutil/src/store.js");
  try {
    const n = readNode("./intentions", process.argv[1]);
    // done, or parked in office_hours, is a since-resolved node — treat as closed.
    process.stdout.write((n.phase === "done" || n.office_hours !== null) ? "closed\n" : "open\n");
  } catch {
    process.stdout.write("absent\n");   // readNode throws when the file is absent
  }
' "$id")
```

`readNode` reads only the YAML frontmatter, so this classification never touches
the body.

Three cases:

#### Case "absent" — first detection for this SHA (also handles "closed")

A brand-new node id — nothing to compare-and-swap against, so no `--base`. Treat
the vanishingly-unlikely `"closed"` result (a stale 8-hex-prefix collision with
a since-resolved episode) the same as absent: mint a new node rather than
touching a closed one. (If minting collides with an on-disk file, that is a true
same-episode re-detection — fall through to the "open" edit path instead.)

Build the full node JSON to a temp file and land it via `write-node.ts --file`
(the single validation gate; see its header comment for `--file` usage) then
`graph-commit` (see its header comment: positional node ids, `-m <message>`).
The complete required JSON shape for the draft tactic node — every field the
schema (`packages/intentionsutil/src/schema.ts`) validates for a tactic, with
its correct default, so nothing is left to guess at runtime:

```json
{
  "id": "tactic-main-red-<shortsha>",
  "kind": "tactic",
  "statement": "origin/main red at <shortsha>: <top failing check name(s)>",
  "owner": "ai",
  "status": "raw",
  "parent": null,
  "serves": ["strategy-main-health"],
  "recovers": [],
  "rationale": "Auto-created by dispatch-diagnose-main on a failing main-health sensor read.",
  "reading": null,
  "clarifications": [],
  "tooling_goals": [],
  "success_signal": {
    "observable": "origin/main HEAD check-run conclusions at <sha>",
    "sensor": "main-health",
    "threshold": "green: every check on the current origin/main HEAD concludes success (or neutral/skipped)",
    "is_proxy": false
  },
  "attention": null,
  "phase": null,
  "execution": null,
  "validates": ["strategy-main-health"],
  "blocked_by": [],
  "office_hours": null,
  "pace_exempt": true,
  "rounds": null,
  "attributes": {}
}
```

Field notes (do not paraphrase the two verbatim strings):

- `success_signal.sensor` (`"main-health"`) and `success_signal.threshold` MUST
  match the `main-health` sensor registered in `read-sensors.ts` verbatim —
  they are the `MAIN_HEALTH_SENSOR_NAME` constant and the green-branch return
  string of `mainHealthSensor`. A drift here makes `deriveGap` never see the
  node as green.
- `phase: null` + `execution: null` + `status: "raw"` is the draft shape (a
  diagnosis, no plan yet) — the same shape as any born-park draft tactic in
  `intentions/` (e.g. a `phase: null`, `status: raw` node).
- `serves` / `validates` both point at `strategy-main-health`: the node
  inherits rank purely through the `serves` edge.
- `attention: null` — no machine-authored boost; rank is inherited, not
  injected.
- `pace_exempt: true` — a red-main fix must not be pace-gated.

Then land it, splicing the redacted body in (`write-node.ts` gives a brand-new
file the generated `# <statement>` placeholder body, so the diagnosis prose must
replace that placeholder before commit — bodies are durable and preserved on
every later rewrite, so this is a one-time splice):

```bash
node_file="intentions/$id.md"
printf '%s' "$node_json" > "$CLAUDE_JOB_DIR/tmp/$id.json"
node --import tsx/esm packages/intentionsutil/scripts/write-node.ts --dir intentions \
  --file "$CLAUDE_JOB_DIR/tmp/$id.json"
# Replace the placeholder body (everything after the closing frontmatter fence)
# with the redacted diagnosis prose.
{ awk '{print} /^---$/{c++; if(c==2) exit}' "$node_file"; cat "$body_file"; } > "$node_file.tmp"
mv "$node_file.tmp" "$node_file"
packages/intentionsutil/scripts/graph-commit -m "graph: diagnose main red at $shortsha" "$id"
```

#### Case "open" — re-detection during the same episode

The node already exists and is still open (`phase` not `"done"`,
`office_hours` null). Re-run Steps 1-2 to refresh the diagnosis. Overwrite the
body ONLY if the freshly-redacted text differs from the on-disk body — skip the
commit entirely when they match, so a re-detection tick that finds the same
cause does not churn a no-op commit.

Because this is a pre-existing node, use the `dump-node.ts` + `graph-commit
--base` compare-and-swap path (see `dump-node.ts`'s header: it writes
`<id>.json` and a `base-manifest.txt` of `<id>=<blobsha>` lines, and prints the
manifest path for `graph-commit --base`). Only the body changes here (the
frontmatter is unchanged), and `write-node.ts` would only re-preserve the
existing body — so splice the new body directly, then land with `--base`:

```bash
# Capture the base manifest (CAS token) against the node as currently on origin/main.
manifest=$(node --import tsx/esm packages/intentionsutil/scripts/dump-node.ts --dir intentions \
  --out-dir "$CLAUDE_JOB_DIR/tmp/base" "$id")
# Compare fresh redacted body against the on-disk body; only rewrite + commit on a diff.
node_file="intentions/$id.md"
ondisk_body="$CLAUDE_JOB_DIR/tmp/$id.ondisk-body"
awk 'p; /^---$/{c++; if(c==2) p=1}' "$node_file" > "$ondisk_body"
if ! cmp -s "$body_file" "$ondisk_body"; then
  { awk '{print} /^---$/{c++; if(c==2) exit}' "$node_file"; cat "$body_file"; } > "$node_file.tmp"
  mv "$node_file.tmp" "$node_file"
  packages/intentionsutil/scripts/graph-commit --base "$manifest" \
    -m "graph: refresh main-red diagnosis at $shortsha" "$id"
fi
```

### What NOT to do

- No `gh issue list/create/edit`, no `gh label create dispatch:main-broken`, no
  `dispatch:main-broken` label at all — the gh-issue latch is gone.
- No code path in this skill may call any `has_issues`-flipping command.
- Do not close, transition, or complete the node. When `origin/main` goes green,
  `dispatch-select-tick`'s graph-lane check (a separate unit, not part of this
  skill) completes the `tactic-main-red-<shortsha>` node — re-arming for the
  next episode. This skill writes or refreshes the node and stops; it creates no
  worktree, branch, or PR.
