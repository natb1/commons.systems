# Benchmark performance matrix — club roster × café traffic
**What the two gated engines must jointly deliver, expressed in the units the operator actually manages: concurrent active clubs on the calendar, and café transactions per day.**
*Recorded Aug 28, 2026. Derived from business-plan.md §5–6 (v0.3.3) marginal economics; Little Italy lease cost basis. Companion to `claude/phase-0.5-pilot.md`, `claude/interim-phase-options.md`.*

---

## 1. Conversion assumptions (stated so they can be challenged)

- **Capacity:** 3 bookable rooms × ~6 usable evenings + weekend-afternoon slots ≈ **25 session-slots/week**. Full utilization ≈ $117K/yr at a $90 average session.
- **Marginal values (plan §6):** each filled weekly session ≈ **+$4.4K/yr owner comp**; each café tx/day ≈ **+$1.8K/yr**.
- **One-off private events** (parties/showers, D11 base 5–6/mo) contribute ~1.3 weekly-equivalent sessions at every tier; the club roster figures below are net of them.
- **Club cadence mapping:** a weekly club = 1 session/wk; biweekly = 0.5; monthly ≈ 0.23. "Mixed roster" assumes ~½ weekly / ¼ biweekly / ¼ monthly (avg ≈ 0.68 sessions/club/wk) — the realistic shape the pilot's "monthly or better" retention floor predicts.
- **Program-for vs maintain:** the roster numbers are *active clubs to maintain*. Programming must run above them — clubs churn (rate unknown; a pilot deliverable), so the recruiting pipeline needs to be perhaps 1.3–1.5× the maintained roster. Validate the churn rate during Phase 0.5.
- **Cost basis:** Little Italy lease (base owner comp −$13K at 100 tx/day café + 33% rooms). **SN/HT lease: subtract ~$22K from every cell**; its café mark is 80 tx/day, which is why SN/HT only works near the bottom-right of the matrix.

## 2. Rooms benchmarks as club rosters

| Evening utilization (3 rooms) | Weekly-eq sessions | Weekly-committed clubs | Mixed-cadence roster | What a week looks like |
|---|---|---|---|---|
| **33%** (base case) | ~8 | **~7** | **~10–12** | Each room booked 2–3 nights |
| **~45%** (break-even, $0 draw) | ~11 | **~10** | **~14–17** | Each room 3–4 nights; weekends full + ~1 midweek club night per room |
| **~55%** (gate case) | ~14 | **~13** | **~19–22** | Each room 4–5 nights; midweek is where this tier is won |
| **~75%** (rooms-alone ceiling) | ~19 | **~18** | **~26–31** | Each room ~6 of 7 nights — near-sellout of prime time |

*(All rows assume the 5–6 one-off events/month continue on top of the club roster.)*

## 3. The matrix — owner comp ($K/yr, Little Italy lease)

Rows: rooms performance (utilization / weekly-committed club roster). Columns: café performance (transactions/day; LI base mark = 100).

| Rooms ↓ / Café → | **80 tx/day** | **90 tx/day** | **100 tx/day** (LI mark) | **110 tx/day** | **123 tx/day** (top-decile) |
|---|---|---|---|---|---|
| **33% · ~7 clubs** (base) | −49 | −31 | **−13** | +5 | +28 |
| **45% · ~10 clubs** (break-even tier) | −36 | −18 | **≈ 0** | +18 | +42 |
| **55% · ~13 clubs** (gate case) | −23 | −5 | +13 | **+31** | +55 |
| **75% · ~18 clubs** (ceiling) | −1 | +17 | +35 | +53 | +77 |

**Contours to read off:**

- **The $0 line (not losing money, no draw):** runs roughly from (45%, 100 tx) through (55%, ~93 tx) to (75%, ~80 tx). Every cell above/left of it is a business burning cash.
- **The $30K line (the plan's own bar):** first crossed at **(55% · ~13 weekly clubs · 110 tx/day)** — the D-log's gate-clearing combination — or (75% · 100 tx), or (45% · ~123 tx). No plausible single-engine cell clears it: the café-alone path needs top-decile traffic, the rooms-alone path needs utilization the analog only shows at $5–10/hr pricing.
- **Evidence limits (mark before believing any cell):** columns right of 110 tx/day are top-decile café territory; rows below 55% utilization are unsupported by any current evidence at the $15–35/hr band (the D&J analog hits ~100% peak at $5–10/hr — a ceiling test, not a forecast). The credible planning region is the middle of the matrix, which is exactly why the dual gate demands proof on both axes before a lease.

## 4. How the pilot and interim options map onto this

- **Phase 0.5 at full tilt** (7 hosted slots/wk, one room) with a 50% graduation conversion seeds **~3–4 weekly-committed clubs** — roughly half the base row's roster, a third of the break-even row's. The pilot's pipeline aspiration (10–14 hosted groups) is the right order of magnitude for the *base* row only if conversion runs high and cadences hold weekly.
- **The gap the site must close on its own:** from ~3–4 seeded clubs to the 10–13 the break-even and gate rows need — via the walk-in funnel, new group formation, house programs graduating into clubs, and (if adopted) an interim phase growing the roster before signature (`claude/interim-phase-options.md`).
- **T2 census context:** 34 known groups, 13 with documented venue pain. The break-even roster (~10 weekly / 14–17 mixed) means signing a third to half of the currently known census — the quantitative case that the model depends on demand *formation*, not just capture.
- **Midweek is the whole game above 45%:** analog data shows weekends fill first and sell out; every step down the matrix's rows is won on Tue–Thu club nights. Recurring clubs are the only instrument that books midweek reliably — which is what this matrix is for: the club roster, not raw utilization, is the operational target to program against.
