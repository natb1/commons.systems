// The React /rules page. A faithful JSX port of the legacy string-renderer
// rules.ts (renderRow / renderNormalizationRow / renderRulesTable / renderRules),
// modeled structurally on the already-migrated Transactions.tsx. It preserves
// every class name and data-* attribute so existing CSS keeps working.
//
// SCOPE: this unit renders the page — data loading + state-seeded rows composing
// @commons-systems/ds form controls, with the type filter as React state. Row
// interactivity (blur-save, autocomplete, add/delete mutators, desktop-open) is
// wired in Unit 2 (use-rules-table.ts); the containerRef and uncontrolled
// defaultValue inputs are the seams that hook attaches to.
import { useEffect, useRef, useState } from "react";
import { classifyError } from "@commons-systems/errorutil/classify";
import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import { logError } from "@commons-systems/errorutil/log";
import { Input, Select, Button } from "@commons-systems/ds";
import { type Rule, type NormalizationRule } from "../firestore.js";
import { type RenderPageOptions } from "./render-options.js";
import { uniqueSorted } from "./hydrate-util.js";

interface LoadedRulesData {
  rules: Rule[];
  normalizationRules: NormalizationRule[];
  authorized: boolean;
  budgetNames: string[];
  categoryTargets: string[];
  uniqueInstitutions: string[];
  uniqueAccounts: string[];
}

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; data: LoadedRulesData }
  | { status: "error"; message: string };

// Mirror renderLoadError's classification (render-options.ts:20-27): rethrow
// programmer/data-integrity/range; permission-denied → access-denied; else soft.
function loadErrorMessage(error: unknown): string {
  const kind = classifyError(error);
  if (kind === "programmer") {
    return "Something went wrong. Please try again.";
  }
  if (kind === "data-integrity" || kind === "range") {
    return "A data error occurred. Please contact support.";
  }
  if (kind === "permission-denied") {
    return "Access denied. Please contact support.";
  }
  return "Could not load data. Try refreshing the page.";
}

// The renderRules data pipeline (rules.ts:131-148) moved into an effect, UNCHANGED
// in behavior. Runs once per mount; the page is re-keyed per navEpoch by App so a
// data transition re-mounts and re-resolves.
function useRulesData(options: RenderPageOptions): LoadState {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    const { authorized, dataSource } = options;

    (async () => {
      try {
        const [rules, budgets, normalizationRules] = await Promise.all([
          dataSource.getRules()
            .catch((e) => { logError(e, { operation: "load-rules" }); throw e; }),
          dataSource.getBudgets()
            .catch((e) => { logError(e, { operation: "load-budgets" }); throw e; }),
          dataSource.getNormalizationRules()
            .catch((e) => { logError(e, { operation: "load-normalization-rules" }); throw e; }),
        ]);

        const budgetNames = budgets.map(b => b.name);
        const categoryTargets = uniqueSorted(rules.filter(r => r.type === "categorization").map(r => r.target));
        const uniqueInstitutions = uniqueSorted(rules.map(r => r.institution));
        const uniqueAccounts = uniqueSorted(rules.map(r => r.account));

        if (cancelled) return;
        setState({
          status: "loaded",
          data: {
            rules,
            normalizationRules,
            authorized,
            budgetNames,
            categoryTargets,
            uniqueInstitutions,
            uniqueAccounts,
          },
        });
      } catch (error) {
        if (cancelled) return;
        if (!deferProgrammerError(error)) logError(error, { operation: "router-render" });
        setState({ status: "error", message: loadErrorMessage(error) });
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return state;
}

export function Rules({ options }: { options: RenderPageOptions }) {
  const load = useRulesData(options);

  return (
    <main id="app">
      <h2>Rules</h2>
      {options.authorized ? null : (
        <p id="seed-data-notice">Viewing example data. Load a data file to see your rules.</p>
      )}
      {load.status === "error" ? (
        <p id="rules-error">{load.message}</p>
      ) : load.status === "loaded" ? (
        <LoadedRules data={load.data} />
      ) : null}
    </main>
  );
}

function LoadedRules({ data }: { data: LoadedRulesData }) {
  const { rules, normalizationRules, authorized, budgetNames, categoryTargets, uniqueInstitutions, uniqueAccounts } = data;

  // Value-only seeding — Unit 2 adds the setters and mutators.
  const [ruleRows] = useState<Rule[]>(() =>
    [...rules].sort((a, b) => a.priority - b.priority || a.pattern.localeCompare(b.pattern)));
  const [normalizationRows] = useState<NormalizationRule[]>(() =>
    [...normalizationRules].sort((a, b) => a.priority - b.priority || a.pattern.localeCompare(b.pattern)));

  // The type filter is React state — drives data-active-filter and works for all
  // users including seed (the e2e selectOption runs on seed data).
  const [filter, setFilter] = useState("categorization");

  // Container ref for Unit 2's interactivity hook.
  const containerRef = useRef<HTMLDivElement>(null);

  const dataAttrs: Record<string, string> = authorized ? {
    "data-budget-options": JSON.stringify(budgetNames),
    "data-category-options": JSON.stringify(categoryTargets),
    "data-institution-options": JSON.stringify(uniqueInstitutions),
    "data-account-options": JSON.stringify(uniqueAccounts),
  } : {};

  return (
    <>
      <Select
        id="rule-type-filter"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        options={[
          { value: "categorization", label: "Categorization" },
          { value: "budget_assignment", label: "Budget Assignment" },
          { value: "normalization", label: "Normalization" },
        ]}
      />
      <div id="rules-table" ref={containerRef} data-active-filter={filter} {...dataAttrs}>
        <div className="rule-header rule-header-default">
          <span>Pattern</span>
          <span>Target</span>
          <span>Priority</span>
          <span>Institution</span>
          <span>Account</span>
          <span>Min $</span>
          <span>Max $</span>
          <span>Excl Cat</span>
          <span>Match Cat</span>
          <span></span>
        </div>
        <div className="rule-header rule-header-normalization">
          <span>Pattern</span>
          <span>Canonical Desc</span>
          <span>Priority</span>
          <span>Date Window</span>
          <span></span>
        </div>
        {ruleRows.map(r => <RuleRow key={r.id} rule={r} authorized={authorized} />)}
        {normalizationRows.map(r => <NormalizationRuleRow key={r.id} rule={r} authorized={authorized} />)}
        {authorized ? <Button id="add-rule">Add Rule</Button> : null}
      </div>
    </>
  );
}

function RuleRow({ rule, authorized }: { rule: Rule; authorized: boolean }) {
  return (
    <details className="expand-row rule-row" data-rule-type={rule.type} {...(authorized ? { "data-rule-id": rule.id } : {})}>
      <summary>
        <div className="expand-summary rule-summary-content">
          <span>
            <Input type="text" className="edit-pattern" defaultValue={rule.pattern} aria-label="Pattern" disabled={!authorized} />
          </span>
          <span>
            <Input type="text" className="edit-target" defaultValue={rule.target} aria-label="Target" data-autocomplete="" disabled={!authorized} />
          </span>
        </div>
      </summary>
      <div className="rule-details">
        <span>
          <Input type="number" className="edit-priority" defaultValue={String(rule.priority)} aria-label="Priority" disabled={!authorized} />
        </span>
        <span>
          <Input type="text" className="edit-institution" defaultValue={rule.institution ?? ""} aria-label="Institution" data-autocomplete="" disabled={!authorized} />
        </span>
        <span>
          <Input type="text" className="edit-account" defaultValue={rule.account ?? ""} aria-label="Account" data-autocomplete="" disabled={!authorized} />
        </span>
        <span>
          <Input type="number" step="0.01" className="edit-min-amount" defaultValue={rule.minAmount != null ? String(rule.minAmount) : ""} aria-label="Min Amount" disabled={!authorized} />
        </span>
        <span>
          <Input type="number" step="0.01" className="edit-max-amount" defaultValue={rule.maxAmount != null ? String(rule.maxAmount) : ""} aria-label="Max Amount" disabled={!authorized} />
        </span>
        <span>
          <Input type="text" className="edit-exclude-category" defaultValue={rule.excludeCategory ?? ""} aria-label="Exclude Category" disabled={!authorized} />
        </span>
        <span>
          <Input type="text" className="edit-match-category" defaultValue={rule.matchCategory ?? ""} aria-label="Match Category" disabled={!authorized} />
        </span>
        <span>
          {authorized ? <Button className="delete-rule" aria-label="Delete rule">Delete</Button> : <span></span>}
        </span>
      </div>
    </details>
  );
}

function NormalizationRuleRow({ rule, authorized }: { rule: NormalizationRule; authorized: boolean }) {
  return (
    <details className="expand-row rule-row" data-rule-type="normalization" {...(authorized ? { "data-rule-id": rule.id } : {})}>
      <summary>
        <div className="expand-summary rule-summary-content">
          <span>
            <Input type="text" className="edit-pattern" defaultValue={rule.pattern} aria-label="Pattern" disabled={!authorized} />
          </span>
          <span>
            <Input type="text" className="edit-canonical" defaultValue={rule.canonicalDescription} aria-label="Canonical Description" disabled={!authorized} />
          </span>
        </div>
      </summary>
      <div className="rule-details">
        <span>
          <Input type="number" className="edit-priority" defaultValue={String(rule.priority)} aria-label="Priority" disabled={!authorized} />
        </span>
        <span>
          <Input type="number" className="edit-date-window" defaultValue={String(rule.dateWindowDays)} aria-label="Date Window" disabled={!authorized} />
        </span>
        <span></span>
        <span>
          {authorized ? <Button className="delete-rule" aria-label="Delete rule">Delete</Button> : <span></span>}
        </span>
      </div>
    </details>
  );
}
