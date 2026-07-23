# Step 3 — Execution lanes and residue collection

This reference carries the full per-lane execution detail and the residue-object
schema for Step 3 of `SKILL.md`. The body holds the plan validation, the routing
table, the record-and-continue semantics, and the three residue-kind names;
everything below is the on-demand detail.

## Residue collection (full schema)

Write per-item results from every lane (PASS/FAIL/SKIP, console errors, network
failures, deferred `needs-human-judgment` items, summary counts) to a single
`tmp/qa-fix-results-<n>.txt` (`<n>` is the Step-0-resolved issue number `<N>`).
**In addition**, accumulate residue into an **in-memory residue list (consumed by
Step 3.5)** — this list becomes the Workflow `args`. Each residue entry is an
object:

```
{ id, title, kind, url_path, expected_outcome, finding, page_text, screenshot_path,
  planned_deferral }
```

- `id` — a stable identifier for the item (the plan item's number/title).
- `kind` — one of exactly **three** values (below). SKIP results are **not**
  residue; only these three kinds are recorded in the list.
- `planned_deferral` — **optional boolean**. Absent or `false` means a normal item.
  Set to `true` when the plan item carried `Flag: planned-deferral — <reason>`.
  The flag is orthogonal to `kind` — it normally rides a `needs-human-judgment`
  item but may in principle ride any kind. When set, put the `<reason>` into the
  item's `finding` so the reason rides into the `needs-main` follow-up body filed
  in Step 3.6, recording why it was deferred.

The three residue kinds:

- **`fail`** — any lane FAIL. `finding` = the FAIL detail plus the
  console/network errors already collected at 3c.9.b. For WALKED FAILs
  (walkthrough lane) also capture `page_text` via `get_page_text` and a
  best-effort `screenshot_path` (see "Screenshot capture" in 3c.9.b). For
  shell-command and single-assertion FAILs, `page_text` may be empty.
- **`needs-human-judgment`** — every plan-triage deferred item (the
  `needs-human-judgment` classification from Step 2; the
  deferred-to-office-hours items noted above). `page_text=''` — it is classified
  by its nature, not by a browser observation. When the plan item carried `Flag:
  planned-deferral`, also set `planned_deferral: true` on this residue entry and
  put the flag's `<reason>` in `finding`.
- **`main-gated-fail`** — a permission-denied smoke FAIL when the
  `firestore_caveat` derived in Step 1 applies. Tag the residue item
  `kind:"main-gated-fail"` instead of `"fail"`.

By the end of Step 3, the in-memory residue list holds one such object per FAIL,
per `needs-human-judgment` deferral, and per main-gated permission-denied smoke
FAIL — and nothing else.

## a. Shell-command lane

For each `script-verifiable` item whose `Command` is a Bash/vitest/file check,
run the `Command` directly via Bash and record **PASS** or **FAIL** from its
result. No browser, no user prompt. Run this lane **first** — shell items are the
cheapest, so running them first records their residue before any browser session
is paid for. A shell FAIL no longer short-circuits the run: it is recorded as
residue and the lanes continue (see "Per-item lane FAIL is record-and-continue"
at the top of Step 3).

## b. Server-start gate

Start the QA server **iff any item needs the browser at all** — i.e. there is
**any** `needs-browser` item **or any `script-verifiable` item whose `Command` is
a single `javascript_tool` assertion**. If no item needs the browser, **skip Step
3b–3c entirely** and continue to Step 4. When the server is needed:

1. **Start the QA server (foreground, returns when ready).** Use a single foreground Bash call with `--detach`; it runs the readiness poll internally and exits 0 with the server still running:
   ```bash
   .claude/skills/dispatch-propagate/scripts/run-qa-server.sh <app-dir> --detach
   ```
   Capture the App URL from its stdout summary block. The QA server seeds public data only — do not re-run it or any seed step with `SEED_TEST_ONLY=true` (see [QA data policy](../SKILL.md#qa-data-policy)).
2. **Pre-QA acceptance check** (a fixed gate after server start, independent of any per-item acceptance-test `Command`):
   ```bash
   .claude/skills/dispatch-propagate/scripts/run-acceptance-tests.sh <app-dir> <url>
   ```
   - **If the check fails** → a failed pre-QA acceptance check is a bug. A bug
     needs an in-session plan-mode fix, which is a user-input blocker. Record
     it, finalize the QA session (post the Step 4 summary including the bug,
     run cleanup Step 5), and escalate per the **Escalation** section.
   - **If the check passes** → continue to Step 3c.

   This pre-QA acceptance check **stays terminal**: only **per-item lane
   FAILs** are record-and-continue (Step 3, three lanes). A broken acceptance
   suite makes the whole subsequent walkthrough noise, so on acceptance-check
   failure finalize and escalate **without** running the per-item lanes (Step
   3c) — the failure short-circuits the lanes.

## c. Browser lanes (single-assertion + walkthrough)

These run against the Chrome extension and share the browser setup below; the
per-item handling differs by `Classification`.

Any `javascript_tool` snippet that uses `await` must be wrapped in an async
IIFE — `(async () => { … })()` — because a top-level `await` raises
`SyntaxError: await is only valid in async functions`.

**Minimize browser payload.** A `computer` `screenshot`/`zoom` returns the
full image into context, so prefer cheaper text/element queries whenever the
check is non-visual:
- Verify an `Expected outcome` with `get_page_text` / `find` whenever the
  check is textual or element-presence.
- Use `find` (≤20 targeted elements) over `get_page_text` when checking for
  a SPECIFIC element or value; reserve `get_page_text` for genuinely
  text-heavy reads.
- Take a `computer` screenshot ONLY when the check is genuinely visual
  (layout/rendering) or as FAIL evidence. When you do, CROP to the relevant
  area with the `zoom` action and a `region` rather than a full-viewport
  `screenshot`, unless the failure is viewport-wide.
- If an accessibility-tree read is needed, use `read_page` with a bounded
  `max_chars` / `depth` (or a `ref_id` focus / `filter:"interactive"`) —
  never an unbounded dump.
- Applies to HOW evidence is captured, not WHAT is checked: the same
  checks run and the clean-pass cadence is untouched (AC#2).

1. Load chrome tools via:
   ```
   ToolSearch("select:mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__javascript_tool,mcp__claude-in-chrome__get_page_text,mcp__claude-in-chrome__find,mcp__claude-in-chrome__read_page,mcp__claude-in-chrome__read_console_messages,mcp__claude-in-chrome__read_network_requests,mcp__claude-in-chrome__gif_creator,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__form_input,mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__list_connected_browsers,mcp__claude-in-chrome__select_browser")
   ```
   If ToolSearch fails or the tools are unavailable → the browser lanes cannot run. Note "Chrome extension unavailable" in results, record every `needs-browser` and single-assertion `script-verifiable` item as a user-input blocker, and escalate per the **Escalation** section (these items cannot be machine-verified without the browser).
2. **Select the browser.** Default to the Windows Chrome — it reaches the WSL QA server over WSL2's shared `localhost` with no tunnel. Call `list_connected_browsers`, find the entry whose `osPlatform` is `"Windows"`, and `select_browser` it. (DeviceIds change on re-registration — never hard-code one; always match on `osPlatform`.) If no Windows entry is found and the user has not explicitly requested macOS → record this as a user-input blocker and escalate per the **Escalation** section (do not silently fall back to macOS). Use the macOS Chrome only on explicit user request: because macOS is a separate machine, first hand the user the `ssh -L` tunnel command that `run-qa-server.sh` printed in its "Remote access" block (it forwards the Vite port plus every emulator port) — if that block has scrolled out of context, reproduce it from the known Vite and emulator ports: `http://localhost:<vite>/` plus `ssh -L <vite>:localhost:<vite> [-L <emu>:localhost:<emu> ...] <ssh-host>`; once the tunnel is up, `select_browser` the entry whose `osPlatform` is `"macOS"`. See `.claude/docs/chrome-extension.md` § Browser selection for the authoritative policy.
3. Create a new tab via `tabs_create_mcp`, capture `tabId`.
4. Navigate to the App URL.
5. Suppress JS dialogs via `javascript_tool`: override `window.alert`, `window.confirm`, `window.prompt` with no-ops.
6. Clear baselines: `read_console_messages` and `read_network_requests` with `clear: true`.
7. Start GIF recording: `gif_creator` with `action: "start_recording"`. Take an initial `computer` screenshot ONLY IF a later visual / before-after comparison will need it; otherwise establish the baseline with `get_page_text`.
8. **Single-assertion lane — for each `script-verifiable` item whose `Command`
   is a single `javascript_tool` assertion:** `navigate` to the item's `URL
   path` (if not "current"), then run the **one** assertion `Command` (wrapped
   in an async IIFE if it uses `await`). Record **PASS** or **FAIL** from the
   assertion result. This is **not** the iterative `computer`/`form_input`
   walkthrough loop — no per-item state setup, no retry/SKIP. A FAIL is
   recorded as residue and the lane continues (see "Per-item lane FAIL is
   record-and-continue" at the top of Step 3).
9. **Walkthrough lane — for each `needs-browser` item:**
   a. **Set up state.** Navigate to the item's `URL path` (if not "current"). Execute the `Steps` using `computer`, `form_input`, `navigate`. Capture extra GIF frames before and after.
   b. **Check output.** Verify the `Expected outcome` via `get_page_text` / `find` by default. Take a `computer` screenshot ONLY when the transition is genuinely visual (and not on every iterative debug step), cropping with the `zoom` action and a `region` to the changed area. Check `read_console_messages` (filter for errors). Check `read_network_requests` for 4xx/5xx using the tool's filter parameter (e.g. filter to error status codes); request a count rather than full metadata when only request counts or specific requests matter — do not pull the full request dump.

      **Screenshot capture on a walkthrough FAIL (verify-early-or-fall-back).**
      On a FAIL in this lane, take a screenshot with the `computer` tool
      and record the returned saved path as the residue item's
      `screenshot_path`. When the failure locus is a known region, CROP to
      it — `zoom` action with a `region`, `save_to_disk: true` — rather than
      a full-viewport shot; use a full-viewport `screenshot, save_to_disk: true`
      only when the failure is viewport-wide. Passing
      this path to a
      **separate** Agent/Workflow invocation (the disposition classifier,
      Step 3.5) is **UNVERIFIED**: if `save_to_disk`
      does not return a Readable path, or the disposition subagent cannot Read
      it, set `screenshot_path=''` and rely on `page_text` only. The plan does
      **not** hinge on the screenshot path — `page_text` (captured via
      `get_page_text`) is the always-reliable baseline. This fallback is
      sanctioned, not a deviation.
   c. **Record the result** — **PASS** or **FAIL**, directly from this
      skill's own checks. **No user prompt.**
      - On interaction failure: retry once, then record **SKIP** and continue.
      - 3 consecutive SKIPs → stop the walkthrough early.
      - Stay on the App URL domain — do not follow external links.
      - **On a FAIL** → record it as residue (kind `fail`, capturing the
        walkthrough-specific evidence — `page_text` via `get_page_text` and a
        best-effort `screenshot_path` per 3c.9.b) and **continue** the
        walkthrough. Do not stop or escalate here; escalation is deferred to
        the terminal disposition (Step 6) on non-empty residue. See
        "Per-item lane FAIL is record-and-continue" at the top of Step 3.
10. Stop GIF recording: `gif_creator` with `action: "stop_recording"`. Export to `tmp/qa-fix-walkthrough-<n>.gif` (where `<n>` is the Step-0-resolved issue number `<N>`).
