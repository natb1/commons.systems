# Landing recovery-drill parity checklist

Part of the Firebase recovery drill (`strategy-exercise-recovery-paths`,
`delegation-firebase`). This directory re-hosts the `landing` app off Firebase
on a plain rootless nginx to measure the real cost of recovering the hosted tier
from owned local data.

## What is here

| File | Role |
| --- | --- |
| `nginx-landing.conf` | nginx config reproducing the `landing` hosting block of the repo-root `firebase.json` (doc root, SPA catch-all, every header). Placeholders `__DOCROOT__` / `__PORT__` / `__PREFIX__` are rendered by the serve script. |
| `serve-landing.sh` | Starts rootless nginx from nixpkgs on `landing/dist`, foreground with a cleanup trap, throwaway prefix. `PORT` env overrides the default `8088`. |
| `extract-parity.jq` | Extracts the `landing` hosting contract from `firebase.json` into normalized JSON — the source-of-truth projection the checklist is built from. |
| `parity-checklist.json` | Machine-readable checklist: the extracted `header_rules` + `rewrites`, plus hand-maintained `test_cases`, `webmention_stub`. A later drill step verifies the running host against this, not against `firebase.json` directly. |
| `parity-checklist.md` | This file — how to run the drill and read the checklist. |

## Verifying parity (later drill step, Unit 2)

1. Build landing so `landing/dist/` exists:
   `npm run build --prefix landing`
2. Start the substitute host:
   `ops/recovery-drills/firebase/serve-landing.sh` (serves `http://127.0.0.1:8088/`).
3. For each entry in `parity-checklist.json` `test_cases`, `curl -sI` the `path`
   and assert:
   - HTTP status equals `expected_status`.
   - Every key/value in `expected_headers` is present on the response
     (case-insensitive header names; compare values verbatim).
   `expected_headers` is already the FULL merged set Firebase would emit for that
   path, so the check is a direct superset comparison against the curl output.
4. `webmention_stub` / the `webmention-unrehostable` case assert a `503`, NOT
   parity — see below.
5. Write the drill report (cost, friction, residue) — that report is Unit 2's
   deliverable, not this unit's.

Regenerate the extracted portion after any `firebase.json` landing-block change:

```
jq -f ops/recovery-drills/firebase/extract-parity.jq firebase.json \
  > ops/recovery-drills/firebase/parity-checklist.json
```

then re-apply the hand-maintained `_comment`, `test_cases`, and `webmention_stub`
additions (they are not derivable from `firebase.json`).

## Header merge semantics

Firebase applies every matching header rule and, for a repeated header key, the
later rule in the array wins. The substitute nginx reproduces this two ways:

- The five shared `**` security headers are re-emitted in every `location`
  (nginx does not inherit `add_header` into a location that declares its own).
- `/assets/**` uses an `^~` prefix location that outranks the image-extension
  regex, so an image under `/assets/` gets the `immutable` cache value (the
  last-listed, and therefore winning, `firebase.json` rule) rather than the
  plain 1-year value.

## The one non-rehostable surface

`/api/webmention` is a Firebase rewrite to the `webmention` Cloud Function.
A static nginx host cannot re-host a Cloud Function, so the config stubs it as an
explicit `503`. This is **expected, measured drill residue** — the
compute-backed part of the hosted tier that is not a projection of static owned
data — not a bug or a parity failure. The drill records it as the concrete
friction/gap in recovering `landing` without Firebase.
