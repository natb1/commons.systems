# Benchmark explorer — owner-comp bar respec (pending edit)
**Handoff spec, written Aug 28, 2026. A session with artifact-read access should execute this against the live artifact, then delete or mark this doc done.**

Artifact: https://claude.ai/code/artifact/c90fad60-5217-4399-9bb1-17bb1c2a54ad (Albemarle Benchmark Explorer)

## Procedure (do not rebuild from docs)
1. `Artifact read` the URL above and build on the LIVE version — the owner explicitly forbade reconstructing it from project docs. If the read fails, stop and report; do not publish.
2. Make the changes below, republish to the same URL.
3. Afterward: save the final HTML source to the project as `claude/benchmark-explorer-src.html` (via project_write local_path) and note in `claude/benchmark-explorer.md` that the source now lives there too — so future edits never depend on artifact reads again.

## The change (decided with Nathan, Aug 28)
The **$30K owner-draw bar is dropped entirely.** Rationale, for the notes card: it was the plan's *partial-income floor* (trigger test, §9: debt service + ~$30K, premised on "other household income covers the rest") — a household-survival line, not a measure of when the business is worth the owner's labor and capital. Replace it with two tiers:

**1. Living-wage bar (~$48K).** The point where the owner's 40 hr/wk (plan's gridded owner week: ~30 floor + ~10 admin/sales) earns the same living wage the plan prices staff labor at: 40 × 52 × $23/hr loaded ≈ **$47.8K**. Use the artifact's own living-wage definition — if its wage basis differs from $23/hr loaded, compute from the artifact's value and keep the formula visible. Note for the notes card: a draw equal to the *loaded* rate is the fair owner equivalent, since an LLC owner pays both halves of SE tax out of the draw.

**2. Economic band (living wage + return on capital).** A shaded band, not a line: living-wage bar + required return on cash at risk, spanning **10%** (opportunity-cost floor, what the cash earns passively) to **20%** (risk-adjusted rate a buyer of an illiquid single-operator small business would demand). Cash at risk should be an **adjustable input**, defaulting to the plan's grant-free cash-to-open range **$180–300K** (default the slider/input to ~$240K midpoint if a single value is needed). At $240K the band is ≈ **$72K–$96K**. Buy-case footnote: ~$10K/yr principal paydown counts toward the return side.

**Notes-card addition (condense as fits the card's voice):** standard test for "when does a business make sense" = economic profit — owner comp must cover (a) market/living wage for hours worked and (b) required return on equity at risk; small-business valuation formalizes the same via SDE minus fair replacement salary. Where the tiers land on the model: gate-clearing (~110 tx/day + ~55% utilization) reaches ~$30K+; the living-wage bar needs roughly that plus ~10 tx/day OR ~4 more filled weekly sessions; the economic band sits at or beyond the plan's "Strong" scenario ($85–95K).

Everything else in the artifact stays as-is.
