/*
 * review-fix.js — the issue #890 Workflow-tool port of the /review-fix review
 * fan-out (the dispatch chain's single terminal review pass).
 *
 * WHAT THIS IS
 * ------------
 * A self-contained, sandboxed Workflow-tool script. The /review-fix SKILL.md
 * runs the bash/gh/git/tmp work (idempotency preamble, diff + MERGE_BASE
 * capture, dispatch-security-surface, the inline CodeQL + npm-audit scans, the
 * Closes #N parse) and then invokes this Workflow, passing everything in via
 * `args`. This script performs ONLY the pure fan-out + JS aggregation: it spawns
 * the finders, dedups + classifies + adversarially-verifies the findings, runs
 * the Opus fix fan-out (non-isolated, edits land in the caller's worktree so the
 * skill's single /commit-merge-push picks them up), and prepares the deferred /
 * security follow-up filing structure. It returns ONE compact disposition
 * summary; the skill never sees raw findings. No filesystem, no gh, no git, no
 * node:* — the skill does all of that around the call.
 *
 * args IN:
 *   { pr_num, merge_base, changed_files:[...], surface:"empty"|"docs"|"tests"|"code",
 *     deps:bool, app_or_rules:bool,
 *     prescanned_findings:[...Per-finding items, Source "codeql"|"npm",
 *       carrying their source-specific fields...],
 *     implementing_issues:[N,...], security_note?:string }
 *
 * return OUT (the ONLY thing this script returns):
 *   { dispositions:[{id, short_desc, location, bucket, sources:[...],
 *       recommended_fix?, codeql_ref?:{rule_id,alert_number,html_url}}],
 *     fixed:[{id, location, fix_summary, touched_files:[...]}],
 *     deferred_filings:[{title, body, blocker_issue_nums:[N,...]|"independent"}],
 *     security_followup_input:[...codeql/npm out-of-scope subset...],
 *     verify_report:[{id, location, verdict, skeptic_votes, rationale}],
 *     deviation:bool, security_note?, coverage_incomplete:bool, coverage_note?:string }
 *
 * NORMATIVE SPECS for the three inline kernel helpers below are the pure bash/jq
 * scripts (unit-tested by test-dispatch-scripts.sh). The JS helpers are kept
 * thin so they cannot drift from their specs:
 *   - agentFinderSet  ←  .claude/skills/dispatch-propagate/scripts/dispatch-review-finders
 *   - dedupMerge      ←  .claude/skills/dispatch-propagate/scripts/dispatch-review-dedup
 *   - applyVerifyDrop ←  .claude/skills/dispatch-propagate/scripts/dispatch-review-verify-drop
 */

export const meta = {
  name: 'review-fix',
  description:
    'Combined /review-fix review fan-out: surface-conditional finders → code dedup → classify → adversarial-verify → Opus fix fan-out → follow-up filing prep. Returns a compact disposition summary (issue #890).',
  phases: [
    { title: 'finders' },
    { title: 'dedup' },
    { title: 'classify' },
    { title: 'verify' },
    { title: 'fix' },
    { title: 'file' },
  ],
};

// --- schemas -----------------------------------------------------------------

// Per-finding schema (FINDING_SCHEMA) — mirrors the "Per-finding schema" section
// of .claude/skills/review-fix/SKILL.md. Note the literal key "Recommended fix"
// (with a space) is the canonical field name.
const FINDING_ITEM_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'Location',
    'Description',
    'Source',
    'OWASP',
    'STRIDE',
    'Confidence',
    'Recommended fix',
    'Disposition',
  ],
  properties: {
    Location: { type: 'string' },
    Description: { type: 'string' },
    Source: {
      enum: [
        'code-review',
        'review',
        'input-validation',
        'secrets',
        'red-team',
        'security-review',
        'auth',
        'data-exposure',
        'firebase',
        'codeql',
        'npm',
        'erosion',
      ],
    },
    OWASP: { type: 'string' },
    STRIDE: { type: 'string' },
    Confidence: { enum: ['high', 'medium', 'low'] },
    'Recommended fix': { type: 'string' },
    Disposition: { type: 'string' },
  },
};

const FINDINGS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['findings'],
  properties: {
    findings: { type: 'array', items: FINDING_ITEM_SCHEMA },
  },
};

const PARTITION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['groups'],
  properties: {
    groups: {
      type: 'array',
      items: { type: 'array', items: { type: 'string' } },
    },
  },
};

const CLASSIFY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['classifications'],
  properties: {
    classifications: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'bucket', 'security_class'],
        properties: {
          id: { type: 'string' },
          bucket: {
            enum: [
              'Fixed',
              'Required',
              'Informational',
              'Dismissed',
              'False-positive',
              'Deferred',
              'Out-of-scope',
            ],
          },
          security_class: {
            enum: ['required', 'out-of-scope', 'false-positive', 'none'],
          },
        },
      },
    },
  },
};

const VERDICT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['verdict', 'rationale'],
  properties: {
    verdict: { enum: ['refuted', 'upheld'] },
    rationale: { type: 'string' },
  },
};

const FIX_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['touched_files', 'fix_summary', 'resolved_ids'],
  properties: {
    touched_files: { type: 'array', items: { type: 'string' } },
    fix_summary: { type: 'string' },
    resolved_ids: { type: 'array', items: { type: 'string' } },
  },
};

// --- inline kernel helpers (thin mirrors of the pure scripts) ----------------

// normative spec: .claude/skills/dispatch-propagate/scripts/dispatch-review-finders
// Returns the AGENT finder-source set (the codeql/npm finders are NOT agents —
// they arrive via args.prescanned_findings — so they are excluded here).
function agentFinderSet(surface, app_or_rules) {
  // Any non-`code` surface (`empty`/`docs`/`tests`) yields only the two quality
  // finders — the `surface === 'code'` gate below covers `tests` with no code
  // change, since a test-only diff has no production attack surface.
  const set = ['code-review', 'review'];
  if (surface === 'code') {
    set.push('input-validation', 'secrets', 'red-team', 'security-review');
    if (app_or_rules) {
      set.push('auth', 'data-exposure', 'firebase');
    }
  }
  return set;
}

// normative spec: .claude/skills/dispatch-propagate/scripts/dispatch-review-dedup
// Collapse one partition subgroup of same-root findings into one representative.
// Each finding must carry an `_idx` (its global input index) for tie-breaking.
const CONF_RANK = { high: 3, medium: 2, low: 1 };
function rankConf(c) {
  return CONF_RANK[c] || 0;
}
function dedupMerge(groupFindings) {
  // Order by (Confidence desc, _idx asc) — used for representative + first
  // non-empty OWASP/STRIDE selection.
  const ordered = groupFindings
    .slice()
    .sort((a, b) => rankConf(b.Confidence) - rankConf(a.Confidence) || a._idx - b._idx);
  const rep = ordered[0];

  // Max confidence across the group.
  let maxRank = 0;
  for (const f of groupFindings) maxRank = Math.max(maxRank, rankConf(f.Confidence));
  const maxConf = maxRank === 3 ? 'high' : maxRank === 2 ? 'medium' : maxRank === 1 ? 'low' : '';

  // First non-empty OWASP / STRIDE in (Confidence desc, _idx asc) order.
  const firstNonEmpty = (key) => {
    for (const f of ordered) {
      if (f[key] !== null && f[key] !== undefined && f[key] !== '') return f[key];
    }
    return '';
  };

  // sources: sorted-unique union of each member's Source + any pre-existing sources.
  const srcSet = new Set();
  for (const f of groupFindings) {
    srcSet.add(f.Source);
    for (const s of f.sources || []) srcSet.add(s);
  }
  const sources = Array.from(srcSet).sort();

  // Representative fields overridden by the four computed ones; id stays = rep.id.
  return Object.assign({}, rep, {
    Confidence: maxConf,
    OWASP: firstNonEmpty('OWASP'),
    STRIDE: firstNonEmpty('STRIDE'),
    sources,
  });
}

// normative spec: .claude/skills/dispatch-propagate/scripts/dispatch-review-verify-drop
// For each VERIFY-ELIGIBLE finding — a security `Required` finding OR (erosion-
// scoped, issue #2064) an erosion/`Fixed` finding (`Source==='erosion' &&
// bucket==='Fixed'`):
//   - no skeptic vote at all (both verify agents failed) → drop (Unverified):
//     verification could not run, so for a terminal auto-ready phase we do NOT
//     auto-spend an Opus fix on it — it is dropped from the fix set and filed as
//     a follow-up, consistent with the skeptic prompt's "default to refuted under
//     uncertainty" bias (a crashed skeptic is the most uncertain case of all).
//   - ≥1 skeptic voted "refuted" → drop (Refuted).
//   - otherwise → keep (Upheld).
// An erosion/Fixed finding is treated identically to a Required one here, EXCEPT
// it can never reach the `deviation` gate (that gate keys on bucket==='Required';
// erosion stays bucket==='Fixed') — preserving the non-escalation invariant.
// All other (non-eligible) findings are never affected. Annotates each eligible
// finding with `verify`. Returns {kept, dropped}.
function applyVerifyDrop(findings, votesById) {
  const kept = [];
  const dropped = [];
  for (const f of findings) {
    if (f.bucket === 'Required' || (f.Source === 'erosion' && f.bucket === 'Fixed')) {
      const votes = votesById[f.id] || [];
      const refutedCount = votes.filter((v) => v === 'refuted').length;
      if (!votes.length) {
        dropped.push(Object.assign({}, f, { verify: 'Unverified' }));
      } else if (refutedCount >= 1) {
        dropped.push(Object.assign({}, f, { verify: 'Refuted' }));
      } else {
        kept.push(Object.assign({}, f, { verify: 'Upheld' }));
      }
    } else {
      kept.push(f);
    }
  }
  return { kept, dropped };
}

// --- finder prompts ----------------------------------------------------------

const SCHEMA_BLURB = [
  'Emit EVERY finding as an object with exactly these fields (the Per-finding schema):',
  '- "Location": "path:line"',
  '- "Description": what the issue is and why it is a risk',
  '- "Source": the source name (set as instructed below)',
  '- "OWASP": OWASP Top 10 (2021) category (e.g. "A03:2021 Injection"); "" for non-security',
  '- "STRIDE": one STRIDE element (Spoofing|Tampering|Repudiation|Information Disclosure|Denial of Service|Elevation of Privilege); "" for non-security',
  '- "Confidence": "high" | "medium" | "low"',
  '- "Recommended fix": the concrete change that resolves the finding',
  '- "Disposition": "skipped" (the orchestrator classifies it later)',
  'Return { "findings": [ ...those objects... ] }. If you find nothing, return { "findings": [] }.',
].join('\n');

function diffContext(args) {
  const base = args.merge_base || 'origin/main';
  const filesStr = (args.changed_files || []).join(', ') || '(see git diff HEAD)';
  return [
    `Review ONLY the pending diff against the merge base \`${base}\` (the branch's`,
    `changes vs origin/main). Changed files: ${filesStr}.`,
    'Read full files for the context needed to judge each change, but report findings only',
    'on the pending changes. You report findings ONLY — edit no files, commit nothing, push nothing.',
  ].join(' ');
}

// Direct security-domain reviewer descriptions — mirror SKILL.md §1c.
const DOMAIN_PROMPTS = {
  'input-validation':
    'Input validation: hunt injection in the changed code — SQL/NoSQL injection, XSS, command injection, path traversal. Check that external input is validated and escaped at every boundary it crosses.',
  secrets:
    'Secrets scan: hardcoded keys/tokens/credentials in the changed code, `.env` files committed to git, secrets leaking into build output.',
  'red-team':
    'Red team: construct concrete attack scenarios against the changed code. Pick an attacker goal, trace a path through the diff to reach it, and report each viable scenario as a finding. Build scenarios from the code under review, not a checklist of known vulnerabilities.',
  auth:
    'Auth & access control: Firestore rules coverage for paths the diff touches, missing auth checks, privilege escalation. Confirm each new or changed Firestore path has a matching rule block and that client code does not assume access the rules do not grant.',
  'data-exposure':
    'Data exposure: API responses returning more fields than the caller needs, PII in logs (console.log and similar), internal details (stack traces, config, paths) leaked in error messages.',
  firebase:
    'Firebase-specific: Firestore rules permissiveness (overly broad `allow` conditions, missing field constraints), emulator-only code reachable on production paths, Firebase API key or config exposure.',
};

function finderPrompt(name, args) {
  const ctx = diffContext(args);
  if (name === 'code-review') {
    return [
      'You are a findings-only code-review subagent.',
      'Invoke the built-in `/code-review` skill via the Skill tool with the `max` effort argument,',
      'FINDINGS-ONLY — do NOT pass the `--fix` flag; apply no fixes.',
      ctx,
      'Once /code-review returns, continue: normalize every finding it produced to the schema below',
      'with Source "code-review" and OWASP "" and STRIDE "" (code-review findings are not security-classified).',
      SCHEMA_BLURB,
    ].join('\n');
  }
  if (name === 'review') {
    return [
      'You are a findings-only PR-review subagent.',
      'Invoke the built-in `/review` skill via the Skill tool — the generic PR review.',
      ctx,
      'Once /review returns, continue: normalize every finding it produced to the schema below',
      'with Source "review" and OWASP "" and STRIDE "".',
      SCHEMA_BLURB,
    ].join('\n');
  }
  if (name === 'security-review') {
    return [
      'You are a findings-only security-review subagent.',
      'Invoke the built-in `/security-review` skill via the Skill tool.',
      ctx,
      'Once /security-review returns, continue: normalize every finding to the schema below with',
      'Source "security-review". Map its severity to Confidence (high/medium/low → high/medium/low),',
      'and infer the OWASP category and STRIDE element from each finding\'s category and description.',
      SCHEMA_BLURB,
    ].join('\n');
  }
  // input-validation | secrets | red-team | auth | data-exposure | firebase
  return [
    `You are a findings-only security reviewer. Domain: ${DOMAIN_PROMPTS[name]}`,
    ctx,
    `Set Source "${name}" on every finding. Fill OWASP and STRIDE for each finding.`,
    SCHEMA_BLURB,
  ].join('\n');
}

// =============================================================================
// Pipeline
// =============================================================================

// Normalize args — the Workflow runtime may deliver it as a JSON string rather
// than a parsed object (property accesses on a string silently return undefined,
// causing downstream .join/.map calls to throw). Parse once at the top so all
// downstream code sees a plain JS object.
const _a = typeof args === 'string' ? JSON.parse(args) : (args || {});
log(`args type: ${typeof args}; surface=${_a.surface}; changed_files count=${(_a.changed_files || []).length}`);

// subagents_launched (source 1, this Workflow's own fan-out): a single
// accumulator incremented at each spawn site, inside the guard that actually
// launches the agents. A launched-but-dead agent still counts — increment at
// the spawn, not on the result. The SKILL body (Unit 4) adds its own source-2
// subagents (Step-5a/5b /file-issue) before emitting the envelope.
let subagentsLaunched = 0;

// --- 1. FINDERS (two waves, probe-gated) -------------------------------------
phase('finders');
const finderNames = agentFinderSet(_a.surface, _a.app_or_rules);
// Probe-wave throttle short-circuit: the two always-on quality finders are real
// review work that runs on every surface, so launch them FIRST as wave 1 and
// double them as a throttle probe. If BOTH return null (a strong outage signal —
// far more robust than one flake), skip the security finder wave entirely rather
// than waste those launches on a throttled model. On empty/docs/tests surfaces
// there are no security finders, so this degenerates to a single wave (no change).
const qualityFinders = finderNames.filter((n) => n === 'code-review' || n === 'review');
const securityFinders = finderNames.filter((n) => n !== 'code-review' && n !== 'review');
log(
  `finders: wave 1 = ${qualityFinders.length} quality finder(s); ` +
    `${securityFinders.length} security finder(s) pending for surface=${_a.surface}`
);

const launchFinder = (name) => () =>
  agent(finderPrompt(name, _a), {
    model: 'sonnet',
    agentType: 'general-purpose',
    schema: FINDINGS_SCHEMA,
    label: `find:${name}`,
    phase: 'finders',
  });

// Wave 1 — the quality finders (also the throttle probe).
subagentsLaunched += qualityFinders.length;
const qualityResults = await parallel(qualityFinders.map(launchFinder));

// Gate: both quality finders dead → model likely throttled; skip the security
// wave. coverage_incomplete records the degraded review for the Step 6 comment.
let securityResults = [];
let coverage_incomplete = false;
let coverage_note = '';
const bothQualityDead = qualityResults.filter(Boolean).length === 0;
if (securityFinders.length && bothQualityDead) {
  coverage_incomplete = true;
  coverage_note =
    'Security finders skipped: both quality finders failed (model likely throttled).';
  log(`finders: ${coverage_note} Backing off the security wave.`);
} else if (securityFinders.length) {
  // Wave 2 — the surface-gated security finders.
  log(`finders: wave 2 = launching ${securityFinders.length} security finder(s)`);
  subagentsLaunched += securityFinders.length;
  securityResults = await parallel(securityFinders.map(launchFinder));
}

const finderResults = qualityResults.concat(securityResults);

// Gather: surviving finder findings + the prescanned codeql/npm findings.
let allFindings = [];
for (const res of finderResults.filter(Boolean)) {
  for (const f of res.findings || []) allFindings.push(f);
}
for (const f of _a.prescanned_findings || []) allFindings.push(f);

// Assign a unique id and a global input index (_idx) to every finding.
{
  const counters = {};
  allFindings = allFindings.map((f, i) => {
    const src = f.Source || 'unknown';
    const n = counters[src] || 0;
    counters[src] = n + 1;
    return Object.assign({}, f, { id: `${src}-${n}`, _idx: i });
  });
}
log(`finders: gathered ${allFindings.length} raw finding(s)`);

// --- 2. DEDUP (barrier) ------------------------------------------------------
phase('dedup');

// Mechanical: group by trimmed Location. Distinct locations never merge.
const locationGroups = new Map();
for (const f of allFindings) {
  const loc = (f.Location || '').trim();
  if (!locationGroups.has(loc)) locationGroups.set(loc, []);
  locationGroups.get(loc).push(f);
}

const dedupedById = new Map(); // unique merge key → merged finding
let dedupCounter = 0; // monotonic key so distinct merges never collide on a shared representative id
for (const [loc, group] of locationGroups) {
  let partition;
  if (group.length <= 1) {
    // Single-finding location group → trivial partition, no model call.
    partition = group.map((f) => [f.id]);
  } else {
    // Bounded semantic: one Sonnet partition over THIS group's ids by same-root.
    const ids = group.map((f) => f.id);
    const compact = group.map((f) => ({
      id: f.id,
      Source: f.Source,
      Description: f.Description,
      Confidence: f.Confidence,
      OWASP: f.OWASP,
      STRIDE: f.STRIDE,
    }));
    const prompt = [
      `Several findings name the same location (${loc}). Partition them by SAME ROOT ISSUE:`,
      'findings describing the same underlying problem at this location go in one subgroup;',
      'genuinely distinct problems at the same location go in separate subgroups.',
      'Return { "groups": [ [id, ...], ... ] } — a partition of exactly these ids, each id in',
      `exactly one subgroup. The ids are: ${ids.join(', ')}.`,
      `Findings:\n${JSON.stringify(compact, null, 2)}`,
    ].join('\n');
    subagentsLaunched += 1;
    const res = await agent(prompt, {
      model: 'sonnet',
      agentType: 'general-purpose',
      schema: PARTITION_SCHEMA,
      label: `dedup:${loc}`,
      phase: 'dedup',
    });
    // Fall back to all-separate if the agent died or returned nothing usable.
    partition = res && res.groups && res.groups.length ? res.groups : ids.map((id) => [id]);
  }

  // Apply the partition: collapse each subgroup via dedupMerge.
  // The schema cannot enforce "each id in exactly one subgroup"; a valid-but-
  // malformed partition that re-uses an id across subgroups would otherwise
  // silently drop findings (a re-used representative id overwrites its prior
  // merge under the same map key, and the displaced finding is marked covered
  // so it never falls through to the singleton fallback). Guard it: skip any
  // subgroup containing an already-covered id so the FIRST merge wins, and key
  // the collapsed result by a unique counter rather than merged.id so two
  // distinct merges that happen to share a representative id both survive.
  const byId = new Map(group.map((f) => [f.id, f]));
  const covered = new Set();
  for (const sub of partition) {
    const reused = sub.find((id) => covered.has(id));
    if (reused !== undefined) {
      log(`dedup: partition for ${loc} re-used id ${reused} across subgroups — skipping the later subgroup (first merge wins)`);
      continue;
    }
    const members = sub.map((id) => byId.get(id)).filter(Boolean);
    if (!members.length) continue;
    for (const id of sub) covered.add(id);
    const merged = dedupMerge(members);
    dedupedById.set(`merge:${dedupCounter++}`, merged);
  }
  // Any id the partition omitted → emit as its own singleton (spec: uncovered = singleton).
  for (const f of group) {
    if (!covered.has(f.id)) {
      const merged = dedupMerge([f]);
      dedupedById.set(`merge:${dedupCounter++}`, merged);
    }
  }
}

// Preserve first-appearance order by min _idx.
let deduped = Array.from(dedupedById.values()).sort((a, b) => a._idx - b._idx);
log(`dedup: ${allFindings.length} → ${deduped.length} finding(s)`);

// --- 3. CLASSIFY (barrier) ---------------------------------------------------
phase('classify');
if (deduped.length) {
  const compact = deduped.map((f) => ({
    id: f.id,
    Location: f.Location,
    Source: f.Source,
    Description: f.Description,
    Confidence: f.Confidence,
    OWASP: f.OWASP,
    STRIDE: f.STRIDE,
  }));
  const classifyPrompt = [
    'Classify each finding into exactly one disposition bucket, preserving BOTH vocabularies.',
    'Disposition table (from /review-fix SKILL.md Step 3):',
    '- Fixed (code-review/review): a concrete, in-scope code change applicable to this PR — implement it.',
    '- Required (security): a real vulnerability/weakness in the changed code that should be fixed.',
    '- Informational (code-review/review): FYIs/notes/observations; no change required.',
    '- Dismissed (code-review/review): nits, incorrect findings, or N/A; one-line rationale.',
    '- False-positive (security): not an actual vulnerability — a misread / non-issue.',
    '- Deferred (code-review/review): valid but out of scope for this PR (filed as a follow-up).',
    '- Out-of-scope (security): a genuine concern in pre-existing code the diff did not touch.',
    '- Fixed (erosion): an actionable net-erosion finding (Source "erosion") with a concrete refactor',
    '  that reverses the structural decay this diff introduced → Fixed (it runs the same adversarial',
    '  verify→fix machinery as a code-review Fixed finding; it is a QUALITY concern, never a vulnerability).',
    '- Informational (erosion): an advisory complexity/duplication increase with no clear single refactor',
    '  → Informational (an FYI; no change required and nothing is filed).',
    'RULES: A finding is NEVER Dismissed merely because the change is small — if it is a real',
    'improvement within scope, classify it Fixed. When a code-review/review finding is ambiguous,',
    'default to Informational rather than inventing a code change.',
    'Also set security_class: "required" | "out-of-scope" | "false-positive" for security-sourced',
    'findings, else "none" for code-review/review findings.',
    'Return { "classifications": [ { "id", "bucket", "security_class" }, ... ] } — one per finding id.',
    `Findings:\n${JSON.stringify(compact, null, 2)}`,
  ].join('\n');

  subagentsLaunched += 1;
  const classifyRes = await agent(classifyPrompt, {
    model: 'sonnet',
    agentType: 'general-purpose',
    schema: CLASSIFY_SCHEMA,
    label: 'classify',
    phase: 'classify',
  });

  const classById = new Map();
  if (classifyRes && classifyRes.classifications) {
    for (const c of classifyRes.classifications) classById.set(c.id, c);
  }
  if (!classById.size) {
    log(
      `classify: agent returned no usable classifications for ${deduped.length} finding(s) — falling back per-source (code-review/review → Deferred so they are filed, security → Out-of-scope)`
    );
  }
  const SEC_SOURCES = new Set([
    'input-validation',
    'secrets',
    'red-team',
    'security-review',
    'auth',
    'data-exposure',
    'firebase',
    'codeql',
    'npm',
  ]);
  deduped = deduped.map((f) => {
    const c = classById.get(f.id);
    // Fallback when the classify agent gave no verdict for this finding: erosion
    // sources → Informational (advisory, not filed) per the Informational-erosion
    // design intent; security sources → Out-of-scope; code-review/review → Deferred
    // (NOT Informational) so an unclassified-but-real finding is filed as a follow-up
    // rather than silently dropped from both the fix set and the follow-up filings.
    const bucket = c
      ? c.bucket
      : f.Source === 'erosion'
        ? 'Informational'
        : SEC_SOURCES.has(f.Source)
          ? 'Out-of-scope'
          : 'Deferred';
    // For prescanned codeql/npm findings, prefer their own carried classification if present.
    let security_class = c ? c.security_class : 'none';
    if ((f.Source === 'codeql' || f.Source === 'npm') && f.classification) {
      security_class = f.classification;
    }
    return Object.assign({}, f, { bucket, security_class });
  });
}

// --- 4. VERIFY (parallel) ----------------------------------------------------
phase('verify');
// Verify-eligible set: security `Required` findings AND (erosion-scoped, per
// issue #2064) erosion/`Fixed` findings — an actionable net-erosion finding runs
// the SAME adversarial verify→drop→fix machinery as a Required vulnerability, but
// it is a QUALITY concern: it is `bucket==='Fixed'`, never `Required`, so it can
// never reach the `deviation` gate (non-escalation invariant). The literal
// `Source === 'erosion'` check keeps this erosion-scoped — do NOT generalize it.
const requiredFindings = deduped.filter(
  (f) => f.bucket === 'Required' || (f.Source === 'erosion' && f.bucket === 'Fixed')
);
const votesById = {};
const rationalesById = {};
if (requiredFindings.length) {
  log(
    `verify: ${requiredFindings.length} Required finding(s), severity-scaled ` +
      `skeptics (2 for high-confidence, 1 for medium/low) at high effort`
  );
  // Flat thunk list across (finding × skeptic) so the barrier covers all votes.
  // Skeptic count scales with finding confidence: a high-confidence Required
  // finding (the only tier that can trigger the deviation gate) gets 2 skeptics;
  // medium/low get 1. The floor is 1, NEVER 0 — a Required finding given 0 votes
  // is treated as "Unverified" by applyVerifyDrop (dropped + filed, not fixed),
  // so 1 vote is the minimum that preserves the existing verify-drop semantics.
  const verifyJobs = [];
  for (const f of requiredFindings) {
    const skepticCount = f.Confidence === 'high' ? 2 : 1;
    for (let k = 0; k < skepticCount; k++) {
      verifyJobs.push({ id: f.id, k, finding: f });
    }
  }
  subagentsLaunched += verifyJobs.length;
  const verifyResults = await parallel(
    verifyJobs.map((job) => () => {
      const f = job.finding;
      // Erosion findings (Source "erosion", issue #2064) are a QUALITY concern, not
      // a vulnerability — the "false positive / not-exploitable" framing below is
      // wrong for them (erosion is NEVER "exploitable", so an exploitability skeptic
      // would systematically refute→drop every erosion finding). Give the skeptic an
      // erosion-aware brief instead: argue the structural METRIC MISFIRED rather than
      // that the finding is non-exploitable. Keep the security framing for all other
      // sources. This branch is erosion-scoped on a literal `Source === 'erosion'`.
      const prompt =
        f.Source === 'erosion'
          ? [
              'You are an adversarial skeptic reviewing a code-quality net-erosion finding (a structural',
              'metric — complexity and/or duplication — increased on this diff). Build the STRONGEST possible',
              'case that the METRIC MISFIRED and there is no genuine net erosion here:',
              '- the complexity delta is spurious (a measurement artifact, not a real branching/nesting increase);',
              '- the "new duplication" is coincidental, boilerplate, or generated code, not extractable shared logic;',
              '- the increase is a rename / move / file-boundary artifact (code relocated, not added) rather than net growth.',
              'Default to verdict="refuted" under uncertainty — this gate guards spending an expensive Opus refactor',
              'on a metric false positive. (Do NOT argue exploitability — this is a quality finding, never a vulnerability.)',
              `Finding location: ${f.Location}`,
              `Description: ${f.Description}`,
              `Confidence: ${f.Confidence}`,
              `Recommended fix: ${f['Recommended fix']}`,
              'Return { "verdict": "refuted" | "upheld", "rationale": "..." }.',
            ].join('\n')
          : [
              'You are an adversarial skeptic. Build the STRONGEST possible case that the finding below',
              'is a FALSE POSITIVE / not-exploitable. Default to verdict="refuted" under uncertainty —',
              'this gate guards spending an expensive Opus fix and a false "required" deviation that marks',
              'the PR ready without review.',
              `Finding location: ${f.Location}`,
              `Description: ${f.Description}`,
              `OWASP: ${f.OWASP}  STRIDE: ${f.STRIDE}  Confidence: ${f.Confidence}`,
              `Recommended fix: ${f['Recommended fix']}`,
              'Return { "verdict": "refuted" | "upheld", "rationale": "..." }.',
            ].join('\n');
      return agent(prompt, {
        model: 'sonnet',
        effort: 'high',
        agentType: 'general-purpose',
        schema: VERDICT_SCHEMA,
        label: `verify:${job.id}#${job.k}`,
        phase: 'verify',
      });
    })
  );
  // Collect votes per id. A dead skeptic (null) contributes no vote, so a
  // finding whose every skeptic died gets [] → handled by applyVerifyDrop as
  // "Unverified": dropped (not auto-fixed) and surfaced as verdict "unverified"
  // in verify_report, matching the skeptic prompt's "refute under uncertainty"
  // bias. (A finding is only Upheld when at least one skeptic ran and voted.)
  verifyResults.forEach((res, i) => {
    const job = verifyJobs[i];
    if (!votesById[job.id]) votesById[job.id] = [];
    if (!rationalesById[job.id]) rationalesById[job.id] = [];
    if (res && res.verdict) {
      votesById[job.id].push(res.verdict);
      if (res.rationale) rationalesById[job.id].push(res.rationale);
    }
  });
}

const { kept: keptFindings, dropped: refutedFindings } = applyVerifyDrop(deduped, votesById);

// verify_report — one entry per Required finding (upheld / refuted / unverified).
// "unverified" = every skeptic failed to vote: distinct from a clean upheld pass
// so the PR comment shows the verification could not run rather than masking it
// as verdict "upheld" with empty evidence.
const verify_report = requiredFindings.map((f) => {
  const votes = votesById[f.id] || [];
  let verdict;
  if (!votes.length) {
    verdict = 'unverified';
  } else if (votes.includes('refuted')) {
    verdict = 'refuted';
  } else {
    verdict = 'upheld';
  }
  return {
    id: f.id,
    location: f.Location,
    verdict,
    skeptic_votes: votes,
    rationale: (rationalesById[f.id] || []).join(' | '),
  };
});

// Map dropped (refuted OR unverified) Required findings to a non-fixed disposition
// bucket for the audit trail: refuted → "Refuted", unverified → "Unverified".
const refutedIds = new Set(
  refutedFindings.filter((f) => f.verify === 'Refuted').map((f) => f.id)
);
const unverifiedIds = new Set(
  refutedFindings.filter((f) => f.verify === 'Unverified').map((f) => f.id)
);

// --- 5. FIX (parallel over file-groups) --------------------------------------
phase('fix');
// fixSet = Fixed-bucket findings + Upheld Required findings (refuted ones excluded).
const fixSet = keptFindings.filter(
  (f) => f.bucket === 'Fixed' || (f.bucket === 'Required' && f.verify === 'Upheld')
);

// Group by file path (Location before the last ':').
function filePath(location) {
  const loc = location || '';
  const idx = loc.lastIndexOf(':');
  return idx >= 0 ? loc.slice(0, idx) : loc;
}
const fileGroups = new Map();
for (const f of fixSet) {
  const file = filePath(f.Location);
  if (!fileGroups.has(file)) fileGroups.set(file, []);
  fileGroups.get(file).push(f);
}

const fixed = [];
if (fileGroups.size) {
  log(`fix: ${fixSet.length} finding(s) across ${fileGroups.size} file-group(s) on Opus`);
  const fixFileList = Array.from(fileGroups.entries()); // [ [file, findings], ... ]
  subagentsLaunched += fixFileList.length;
  const fixResults = await parallel(
    fixFileList.map(([file, group]) => () => {
      const findingList = group
        .map(
          (f) =>
            `- [${f.id}] ${f.Location} (${f.bucket}): ${f.Description}\n  Recommended fix: ${f['Recommended fix']}`
        )
        .join('\n');
      const prompt = [
        `Apply the recommended fix for each of these findings in file ${file}.`,
        'Edit the working tree ONLY — make NO commits and NO pushes (a later step commits).',
        'Findings to resolve:',
        findingList,
        'Return { "touched_files": [...], "fix_summary": "one-line summary of what you changed",',
        '"resolved_ids": [ ...the ids you actually applied a fix for... ] }.',
        'Only list an id in resolved_ids if you applied its fix; omit ids you could not or chose not to fix.',
      ].join('\n');
      // DEFAULT (non-isolated) isolation — edits land in the caller's worktree so
      // the skill's single /commit-merge-push picks them up. Opus per #1172.
      return agent(prompt, {
        model: 'opus',
        agentType: 'general-purpose',
        schema: FIX_SCHEMA,
        label: `fix:${file}`,
        phase: 'fix',
      });
    })
  );

  // Record one `fixed` entry per resolved finding.
  const findingById = new Map(fixSet.map((f) => [f.id, f]));
  fixResults.forEach((res, gi) => {
    if (!res) return;
    for (const id of res.resolved_ids || []) {
      const f = findingById.get(id);
      if (!f) continue;
      fixed.push({
        id,
        location: f.Location,
        fix_summary: res.fix_summary || '',
        touched_files: res.touched_files || [],
      });
    }
  });
}
const fixedIds = new Set(fixed.map((e) => e.id));

// Upheld erosion findings (issue #2064): an erosion/`Fixed` finding that survived
// adversarial verify (verify==='Upheld'). The `verify` annotation lives ONLY on
// applyVerifyDrop's OUTPUT copies (keptFindings), NOT on the `deduped` entries the
// deferred_filings filter iterates — so derive an id membership set here, mirroring
// the existing unverifiedIds pattern. The `verify === 'Upheld'` clause is
// LOAD-BEARING: an Informational-bucket erosion finding also lands in keptFindings
// (via applyVerifyDrop's else branch) but carries NO verify field, so filtering on
// Source alone would wrongly scoop it up. Informational erosion is a pure FYI — it
// must be filed nowhere.
const upheldErosionIds = new Set(
  keptFindings.filter((f) => f.Source === 'erosion' && f.verify === 'Upheld').map((f) => f.id)
);

// --- 6. FILE-PREP (pure JS, no gh) -------------------------------------------
phase('file');

// 6a. Deferred code-review/review findings → deferred_filings.
function shortTitle(desc) {
  const text = (desc || '').trim();
  const firstSentence = text.split(/(?<=[.!?])\s/)[0] || text;
  const candidate = firstSentence.length <= 80 ? firstSentence : text.slice(0, 80);
  return candidate.trim().replace(/\s+/g, ' ');
}
const blockerNums =
  _a.implementing_issues && _a.implementing_issues.length
    ? _a.implementing_issues
    : 'independent';

const deferred_filings = deduped
  // Deferred code-review/review findings, Unverified Required findings (every
  // skeptic failed), plus (issue #2064) upheld erosion findings Opus did NOT fix:
  // none are resolved in this terminal phase, so file a follow-up rather than
  // silently dropping them. A REFUTED erosion finding falls through all three
  // clauses (it is not in upheldErosionIds and not Deferred/Unverified) → not
  // filed, which is correct. Upheld erosion NEVER escalates the PR — it is a
  // non-blocking follow-up only (the non-escalation invariant).
  .filter(
    (f) =>
      f.bucket === 'Deferred' ||
      unverifiedIds.has(f.id) ||
      (upheldErosionIds.has(f.id) && !fixedIds.has(f.id))
  )
  .map((f) => {
    const files = filePath(f.Location);
    const isUpheldErosionUnfixed = upheldErosionIds.has(f.id) && !fixedIds.has(f.id);
    const isUnverified = unverifiedIds.has(f.id);
    // Order: upheld-erosion check FIRST (it is bucket==='Fixed', never Deferred,
    // and never in unverifiedIds, so the three predicates are disjoint here).
    const tail = isUpheldErosionUnfixed
      ? 'Net structural erosion verified but not auto-fixed: filed as a non-blocking follow-up rather than escalating the PR (this is a quality finding, never a release blocker).'
      : isUnverified
        ? 'Finding whose adversarial-verify skeptics both failed to vote: deferred to a follow-up rather than auto-applied in the terminal review phase.'
        : 'Out of scope for this PR: surfaced by the review pass but not a change this PR delivers.';
    const body = [
      f.Description,
      '',
      `Recommended fix: ${f['Recommended fix']}`,
      '',
      `Files: ${files}`,
      '',
      `Backlink: #${_a.pr_num}`,
      '',
      tail,
    ].join('\n');
    return {
      title: shortTitle(f.Description),
      body,
      blocker_issue_nums: blockerNums,
    };
  });

// 6b. Out-of-scope codeql/npm findings → security_followup_input (pass fields through).
const security_followup_input = deduped
  .filter(
    (f) => (f.Source === 'codeql' || f.Source === 'npm') && f.security_class === 'out-of-scope'
  )
  .map((f) => {
    if (f.Source === 'codeql') {
      return {
        classification: f.security_class,
        source: 'codeql',
        rule_id: f.rule_id,
        alert_number: f.alert_number,
        security_severity_level: f.security_severity_level,
        description: f.description !== undefined ? f.description : f.Description,
        location: f.location !== undefined ? f.location : f.Location,
        html_url: f.html_url,
      };
    }
    // npm
    return {
      classification: f.security_class,
      source: 'npm',
      advisory_id: f.advisory_id,
      severity: f.severity,
      introduced_by_diff: f.introduced_by_diff,
      package: f.package,
      title: f.title,
      url: f.url,
    };
  });

// --- 7. deviation + dispositions + return ------------------------------------

// deviation: any Required + Upheld + high-confidence finding still unresolved after fixes.
const deviation = keptFindings.some(
  (f) =>
    f.bucket === 'Required' &&
    f.verify === 'Upheld' &&
    f.Confidence === 'high' &&
    !fixedIds.has(f.id)
);

function truncate(text, n) {
  const t = (text || '').trim().replace(/\s+/g, ' ');
  return t.length <= n ? t : t.slice(0, n);
}

// dispositions: one entry for EVERY deduped finding (incl. Refuted/Unverified).
const dispositions = deduped.map((f) => {
  const bucket = refutedIds.has(f.id)
    ? 'Refuted'
    : unverifiedIds.has(f.id)
      ? 'Unverified'
      : f.bucket;
  const entry = {
    id: f.id,
    short_desc: truncate(f.Description, 140),
    location: f.Location,
    bucket,
    sources: f.sources && f.sources.length ? f.sources : [f.Source],
  };
  if (f.bucket === 'Fixed' || f.bucket === 'Required') {
    entry.recommended_fix = f['Recommended fix'];
  }
  if (f.Source === 'codeql') {
    entry.codeql_ref = {
      rule_id: f.rule_id,
      alert_number: f.alert_number,
      html_url: f.html_url,
    };
  }
  return entry;
});

// --- outcome-envelope counts (Unit 3, issue #1860) ---------------------------
// Computed per .claude/docs/outcome-envelope.md. Unit 4 passes these straight
// into dispatch-emit-outcome; Unit 5 aggregates them. Additive only.
// Exception: followups_deferred is the deferred-filing QUEUE depth, NOT
// passed straight through — the SKILL body emits its OWN actual filed count.
const findings_surfaced = dispositions.length; // every deduped finding, any bucket
const fixes_applied = fixed.length; // = the count of Fixed-bucket dispositions
const followups_deferred = deferred_filings.length; // deferred-filing QUEUE depth (Step-5a entries the SKILL body must still file); NOT a filed count
// findings_actionable: dispositions whose FINAL bucket ∈ {Fixed, Required, Deferred}.
// Compute from `dispositions` (the post-remap array) NOT `deduped`: dispositions
// remaps refuted/unverified Required findings to Refuted/Unverified, so Required
// here means upheld-only. Computing from `deduped` would wrongly count those
// dropped findings (they still carry bucket==='Required' there) as actionable.
const ACTIONABLE_BUCKETS = new Set(['Fixed', 'Required', 'Deferred']);
const findings_actionable = dispositions.filter((d) => ACTIONABLE_BUCKETS.has(d.bucket)).length;
// disposition: escalated on deviation; else completed_with_fixes when any fix
// landed; else completed. Matches the path→value table in outcome-envelope.md.
const disposition = deviation
  ? 'escalated'
  : fixed.length > 0
    ? 'completed_with_fixes'
    : 'completed';

return {
  dispositions,
  fixed,
  deferred_filings,
  security_followup_input,
  verify_report,
  deviation,
  security_note: _a.security_note,
  // coverage_incomplete is independent of `deviation`: it flags a launch-efficiency
  // back-off (security wave skipped because both quality finders died — model
  // likely throttled), surfaced in the Step 6 partial-coverage comment line.
  coverage_incomplete,
  coverage_note,
  findings_surfaced,
  findings_actionable,
  fixes_applied,
  followups_deferred,
  subagents_launched: subagentsLaunched,
  disposition,
};
