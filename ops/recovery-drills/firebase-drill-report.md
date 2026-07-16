# Firebase recovery drill — report

Strategy: `strategy-exercise-recovery-paths`. Delegation record: `delegation-firebase`
(flipped in Unit 3, not this report). Tools built in Unit 1:
`ops/recovery-drills/firebase/` (nginx config, serve script, parity checklist,
`extract-parity.jq`). This is Unit 2's record of actually running the drill.

## What the drill measured

Whether `landing` — currently hosted on Firebase Hosting — is a rebuildable
projection of owned local data (the built `landing/dist/` output plus a
hand-authored nginx config translating `firebase.json`'s `landing` hosting
block), or whether it secretly depends on Firebase-specific infrastructure
that can't be reproduced elsewhere.

## Date and duration

Run: 2026-07-16 (UTC).

Wall-clock breakdown of the mechanical recovery steps, as actually measured
in this session:

| Step | Time |
| --- | --- |
| `npm run build --prefix landing` (produces `landing/dist/`) | ~23 s |
| Cold-start substitute host (`serve-landing.sh`, includes one-time `nix run nixpkgs#nginx` fetch of nginx/openssl/zlib from cache.nixos.org, ~3.3 MiB) | ~10 s |
| `verify-parity.sh` run against the live host (7 test cases) | <1 s |
| **Mechanical recovery total (build → serve → verify), warm nix store** | **~35 s** |

That ~35 s figure is what a *repeat* recovery costs once the substitute-host
tooling (nginx config, serve script, checklist, verify script) already
exists — i.e., the ongoing cost of re-hosting `landing` off Firebase at any
future point, given this drill's artifacts are kept current.

The one-time cost of *building* that tooling (Unit 1: writing
`nginx-landing.conf` by hand-translating `firebase.json`'s header-merge
semantics, `extract-parity.jq`, `parity-checklist.json`; Unit 2: writing and
debugging `verify-parity.sh`, running the drill end-to-end, writing this
report) was on the order of a working session (design, several iterations,
manual curl verification before automating) — call it low single-digit hours
across both units. That non-recurring engineering cost is the real "recovery
cost" this drill is measuring: not the mechanical steps (fast, because they're
already scripted), but the one-time work of building a faithful non-Firebase
substitute in the first place.

## Parity results

All 7 test cases in `ops/recovery-drills/firebase/parity-checklist.json`,
verified by `ops/recovery-drills/firebase/verify-parity.sh` against the
substitute host (`serve-landing.sh`, port 8088):

| Test case | Path probed | Expected status | Parity target? | Result |
| --- | --- | --- | --- | --- |
| `spa-root` | `/` | 200 | yes | **PASS** — shared `**` security headers match; body byte-identical to `landing/dist/index.html` |
| `spa-deep-route` | `/any/unmatched/client-route` | 200 | yes | **PASS** — SPA catch-all serves `index.html`, not a 404; headers match |
| `blogroll-opml` | `/blogroll.opml` | 200 | yes | **PASS** — forced `Content-Type: text/x-opml+xml; charset=utf-8` + `Access-Control-Allow-Origin: *` match |
| `feed-xml` | `/feed.xml` | 200 | yes | **PASS** — forced `Content-Type: application/rss+xml; charset=utf-8` + `Cache-Control: public, max-age=3600` match |
| `assets-hashed-file` | `/assets/deferred-app-auth-BvQA3diB.js` (real hashed build output, auto-resolved) | 200 | yes | **PASS** — `Cache-Control: public, max-age=31536000, immutable` wins over the plain image-cache rule, matching Firebase's last-rule-wins merge |
| `root-image-non-asset` | `/nathan.jpg` (real file, auto-resolved) | 200 | yes | **PASS** — `Cache-Control: public, max-age=31536000` (no `immutable`, correctly distinct from the `/assets/**` case) |
| `webmention-unrehostable` | `/api/webmention` | 503 | **no** (measured residue, not a parity assertion) | **PASS** (as residue) — returns `503` with the drill's diagnostic body, matching the checklist's `webmention_stub` expectation |

**7 of 7 cases behaved as specified in the checklist** (6 genuine parity
passes + 1 correctly-stubbed residue case). `verify-parity.sh` exits 0.

A sanity check confirmed the verify script fails loud and non-zero when the
target is unreachable (ran it against a closed port; all 7 cases reported
`FAIL ... curl could not reach ...`, exit 1) — the script does not silently
pass on a broken target.

## The `/api/webmention` residue — the measured recovery gap

`firebase.json` rewrites `/api/webmention` to the `webmention` Cloud
Function. A static nginx host has no compute layer, so it cannot re-host a
Cloud Function — full stop. The substitute config
(`ops/recovery-drills/firebase/nginx-landing.conf`) stubs this path with an
explicit `503` and a diagnostic body rather than silently 404/200-ing, so the
gap stays visible instead of being swallowed.

This is the one genuine, unavoidable finding of the drill: **`landing`'s
static surface (SPA shell, feed, blogroll, assets, all header/caching
behavior) is fully rebuildable from owned local data with no Firebase
dependency, but the `/api/webmention` backend endpoint is not** — it is
compute-backed, not a projection of static build output. A real, no-notice
recovery of `landing` off Firebase would leave webmention receiving broken
until a replacement endpoint (e.g. a small serverless function elsewhere, or
a queue-and-batch webmention processor) is stood up. That is real,
measurable friction, not a tooling gap in this drill — it is intrinsic to
what `landing` currently depends on Firebase for.

## DNS cutover — documented, NOT executed

Production `landing` (the `commons.systems` apex/`landing` subdomain, per
`firebase.json` hosting config) **stays on Firebase**. No DNS, Cloudflare
zone, or Firebase project configuration was touched by this drill — all
verification ran against the local substitute host on `127.0.0.1:8088`.

If a real cutover were ever executed (out of scope here, and not something
this drill or report authorizes), the steps would be:

1. Stand up the substitute host somewhere reachable from the internet (a VM,
   container host, or similar) running the same `nginx-landing.conf` contract
   against a built `landing/dist/`, kept current via CI/CD the same way the
   Firebase deploy currently is.
2. Stand up a replacement for `/api/webmention` (see residue above) — the one
   surface the static host cannot serve.
3. Change the Cloudflare DNS record for the `landing` subdomain (currently
   presumably CNAME/A to Firebase Hosting's edge) to point at the new host.
4. **TLS**: `*.commons.systems` currently gets its certificate through
   Firebase Hosting's automatic provisioning (or Cloudflare's proxy layer, if
   Cloudflare-proxied — whichever is authoritative for this zone). A cutover
   away from Firebase means TLS termination moves too: either issue and renew
   a cert on the new host (e.g. certbot / Let's Encrypt) or keep Cloudflare
   proxying the record (orange-cloud) so Cloudflare's edge certificate keeps
   covering it and the origin cert only needs to satisfy Cloudflare's
   full-strict validation. This decision needs to be made explicitly at
   cutover time — it is not automatic.
5. Verify propagation and monitor for TLS/cert errors and 5xx before removing
   the Firebase Hosting site.

None of the above was executed. This section exists so a future real
recovery has a documented starting checklist instead of reconstructing the
plan from scratch under pressure.

## Conclusion

`landing`'s static hosting tier recovers cleanly and quickly (~35 s
mechanical, once the substitute-host tooling from Units 1–2 exists) with full
header/caching parity. The one real, measured gap is the compute-backed
`/api/webmention` endpoint, which any real recovery must replace separately.
Firebase remains the live production host; this drill changed no production
state.
