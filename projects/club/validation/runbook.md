# Runbook: §1a public-data validation mining
*Instructions for a Claude session attached to this project. Written Aug 27 2026; T2 expanded Aug 28 (Meetup as demand census — see rationale in the task). Self-contained — follow as written, no other context needed beyond the read-first docs.*

## Mission

Gather public evidence for or against the recreational-space hypothesis (business-plan.md §1a): unmet Baltimore demand for affordable private meeting rooms (2–5 hr sessions, 3–10 person recurring recreational groups, evenings/weekends, ~$15–35/hr). You are collecting *observations*, not making the case. Negative and null results are as valuable as positive ones — record them with equal care.

## Read first

1. `business-plan.md` §1a (the hypothesis and its falsifiable claims) and §5–6 (what the numbers need).
2. `validation/precedent-research.md` §5 (checks already completed — do NOT redo Pratt policy, the Peerspace one-time scan, or StartPlaying average pricing) and the validation menu at the end of §5.

## Output — one results doc, append-only

Record everything in `validation/data.md`. Create it on first run with the frontmatter-style header below; on later runs, `project_read` it first and append a new dated section (project_write replaces the whole file — carry all prior content forward unchanged).

Format per run:

```
## Run YYYY-MM-DD (task numbers run, e.g. T1, T3)
### T<n> — <name>
- Method actually used (URL fetched / search query / fallback)
- Raw observations (counts, prices, quotes with links)
- Read: supports / undercuts / neutral to §1a, one sentence
- Gaps: what couldn't be accessed and why
```

Never silently substitute an easier observation for the one specified. If a source is unreachable, say so in Gaps and move on.

## Tasks

### T1 — Analog utilization sampling: Dungeons & Javas (REPEATING — the highest-value task)

**Goal:** observed fill rate of bookable rooms/tables at the closest operating analog (Colorado Springs; rooms $5–10/hr), as a public proxy for the utilization curve. The plan's base case assumes ~<!--m:baseUtil-->33%<!--/m--> evening/weekend utilization; the gate-clearing case ~<!--m:gateUtil-->55%<!--/m-->.

**Method:** start at https://www.dungeonsandjavas.com/ and find the room/table booking page (bookings run in 30-min increments up to a year out). Fetch the availability view for (a) the upcoming Friday and Saturday evenings, (b) the upcoming Sunday afternoon, (c) one weekday (Tue or Wed) evening. For each room × time window, record booked vs open slots.

**If the booking widget doesn't render via WebFetch** (likely a Square/embedded JS widget): try the direct widget URL from the page source; if still blocked, record the failure in Gaps and instead capture any static signals (posted "fully booked" notices, event calendars, review mentions of booking difficulty). Do not fabricate an estimate.

**Cadence:** this task only means something with repetition — sample 2–3×/week for 2–3 weeks, always recording day-of-week and how far in advance the sampled date was. Each run appends one snapshot. After ~6 snapshots, add a summary line: estimated peak (Thu–Sat eve) fill %, off-peak fill %, and note this is at $5–10/hr pricing — a demand ceiling for higher prices.

**Secondary analog (once, or when D&J is blocked):** Mox Boarding House private-room availability (https://www.moxboardinghouse.com/pages/private-rooms) — scarcity of near-term weekend slots = demand signal at the F&B-attach price point.

### T2 — Baltimore recurring-group demand census, Meetup-led (once, refresh monthly)

**Goal:** count and name the §1a customer pipeline: active Baltimore-metro recurring groups — TTRPG/D&D, board game, book club, writing group.

**Why Meetup specifically (added Aug 28):** Meetup and its kin solve *group formation and discovery* but externalize the venue problem — their groups scrounge library rooms, bars, and living rooms. That makes the platform layer this venture's **upstream supplier, not its competitor**: its public Baltimore listings are a free, queryable census of the exact §1a prospect pool, and the groups it surfaces are (a) the pilot outreach list (`pilot/marketing-plan.md`), (b) the G1 graduation-ask prospect pool, and (c) — if the concept ever replicates — a site-selection instrument, since the same query measures recreational-group density for any metro or neighborhood before a lease is signed. Run the census with a documented, repeatable method so refreshes and cross-area comparisons are apples-to-apples.

**Method:** Meetup.com search for Baltimore + each category (fetch category/search pages; some content is login-gated — take what's public: group names, member counts, stated meeting venues/frequency). Supplement with WebSearch for "Baltimore D&D group", "Baltimore book club meetup", "Baltimore writing group weekly", etc.

**Record per group:** name, platform, member count if shown, meeting frequency, group age / founded date and a recency signal (last event date) where visible, current venue type (home / bar / library / shop / online / unknown), and public organizer handle or contact path. The venue column is the point: groups meeting in homes and bars are the prospect list — capture anything they say about why, and quote any venue-pain language verbatim (it feeds T3). Group age matters independently: long-lived recurring groups are the sticky, retention-shaped demand the pro forma's recurring-club line assumes.

**Out of scope for Claude:** Discord servers and Facebook groups are login-walled — flag them in Gaps as an operator task (Nathan can census these by hand; the doc should hold a placeholder table for him to fill).

### T3 — Unmet-demand text search (once, refresh before G1)

**Goal:** direct evidence that people already search for this product.

**Method:** WebSearch (and fetch what surfaces) for combinations like: site:reddit.com r/baltimore "where" "play D&D"; "Baltimore" "private room" board games rent; r/rpg "Baltimore" "looking for a place to play"; "book club" Baltimore "where to meet"; also RPG.net / EN World / BGG forum threads mentioning Baltimore venues.

**Record:** each relevant post — link, date, gist quote, and what the thread's answers were (the answers reveal the current best alternatives and their weaknesses). Count of distinct posts in the last ~3 years is the headline number. Zero relevant posts is a real finding — record it as such.

### T4 — Pratt evening hours at candidate branches (once)

**Goal:** complete the §5.1 verification — policy exclusion is confirmed; hours close the loop.

**Method:** fetch https://www.prattlibrary.org/locations (or per-branch pages) and record closing times for: Central (for Little Italy/Jonestown and Station North), Southeast Anchor / Highlandtown-adjacent branch, and any branch near Bromo. Note the latest weekday close and weekend hours. Compare against club prime time (7–11 PM): the claim is that even ignoring the recurring-booking denial, the buildings are shut when the customer meets.

### T5 — Organized-play and paid-GM supply scan (once)

**Goal:** size the content-attach opportunity (precedent memo §7.3) and identify GM partners.

**Method:** StartPlaying filtered/searched for Baltimore-area GMs (in-person games specifically — record count, per-seat prices, session lengths); Warhorn search for Baltimore events; event calendars of Canton Games, No Land Beyond, and Games & Stuff (Glen Burnie) — record what organized play exists, how often, and whether it sells out (waitlists, "full" tags).

**Record:** number of active in-person paid GMs, their per-seat prices, and any evidence of demand exceeding supply. This doubles as a partner list for ticketed program nights.

### T6 — Review mining: space-scarcity language (once)

**Goal:** third-party confirmation of the operator's observation that local shops are space-constrained, plus willingness-to-pay signals at area escape rooms.

**Method:** Google/Yelp review content is only partially fetchable — use WebSearch for review excerpts ("No Land Beyond" crowded OR "no room" OR "couldn't get a table"; "Canton Games" space OR table; Baltimore escape room reviews mentioning price). Take quotes only from pages that actually load; note in Gaps that full review corpora weren't accessible.

## Interpretation guardrails

- Do not average away bad news. If T1 shows the analog's rooms mostly empty midweek, that is a finding about the off-peak assumption; say so plainly.
- Distinguish observation ("9 of 12 Friday slots booked") from inference ("~75% peak utilization") and label both.
- Each run, end the appended section with a 2–4 sentence "So far" rollup across all runs: which §1a claims are strengthening, which are weakening.
- These are leading indicators. Nothing here substitutes for the G1 bar (deposit-backed / prepaid commitments); the runbook's job is to make G1 cheaper and better aimed.
- T2's platform data carries a known bias: Meetup skews toward groups actively seeking members and venues; stable, housed groups (a long-running home game) are undercounted. Treat the census as a floor on group count and a biased-toward-need sample on venue pain.

## When the data is in (after ~3 weeks of T1 + the one-time tasks)

Write a closing summary into `validation/data.md` and update `validation/precedent-research.md` §5 with a pointer. Flag for the operator: any §1a table row that needs rewriting in `business-plan.md`, and whether the observed analog utilization supports, stretches, or breaks the 33%/55% assumptions in §5–6 of the plan.
