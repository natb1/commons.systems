// The React /accounts/reconcile page. Ports the legacy renderReconcileHtml
// (accounts-reconcile.ts) + hydrateAccountsReconcile (accounts-reconcile-hydrate.ts)
// to React. This is a PORT, not a rewrite: every compute helper
// (buildReconcileRows, clearedBalance, signedLegAmount, balancesMatch,
// buildAdjustmentEntry, isAged, suggestClearedLegs, parseReconcileQuery,
// periodBounds) is reused UNCHANGED — only the rendering + event-handling layer
// becomes React.
//
// The imperative DOM mutations of the legacy hydrate become React state:
//   - the URL query (institution/account/period) is React state, initialized
//     from parseReconcileQuery(location.search) — the deep-link read — and written
//     back via the shared navigate(…, { replace: true }) abstraction on a Select
//     change. We do NOT dispatch
//     popstate: useRouter strips the query, so a query-only popstate is inert, and
//     App re-keys only on a data transition. The component owns its query.
//   - per-leg checked state is React state (the optimistic toggle); on a persist
//     failure it reverts, mirroring the legacy checkbox revert.
//   - the dialog open / mismatch-revealed / button-disabled (re-entrancy) flags
//     are React state owned by LoadedReconcile.
//
// The load effect re-fetches whenever the query or a reload nonce changes — the
// faithful equivalent of the legacy triggerReload() (which re-rendered the whole
// string). renderReconcileHtml fetched ALL legs/entries/events with no args and
// filtered in-render, so a query change is purely a re-filter; re-fetching is
// behaviorally identical and keeps one code path. The two legacy triggerReload()
// sites map to: a Select change (query state change) and post-finalize (nonce bump).
import { useEffect, useRef, useState, type ReactNode } from "react";
import { navigate } from "@commons-systems/router/react";
import { Button, Card, Input, Metric, Select } from "@commons-systems/ds";
import { classifyError } from "@commons-systems/errorutil/classify";
import { deferProgrammerError } from "@commons-systems/errorutil/defer";
import { logError } from "@commons-systems/errorutil/log";
import type {
  Account,
  JournalEntry,
  JournalLeg,
  ReconciliationEvent,
  Statement,
  StatementItem,
} from "../firestore.js";
import type { ReconciliationEventFields } from "../data-source.js";
import type { AccountType } from "../schema/enums.js";
import { formatCurrency } from "../format.js";
import { accountDocId } from "../entities/account.js";
import { getActiveDataSource } from "../active-data-source.js";
import {
  buildReconcileRows,
  balancesMatch,
  buildAdjustmentEntry,
  isAged,
  ADJUSTMENT_SUSPENSE_ACCOUNT_ID,
  type ReconcileRow,
} from "../reconciliation.js";
import { suggestClearedLegs, SUGGESTION_TOLERANCE_DAYS } from "../reconcile-hints.js";
import { type RenderPageOptions } from "./render-options.js";
import { parseReconcileQuery, parseReconcilePeriod } from "./account-view-model.js";

// ── Query state + URL sync (parseReconcileQuery / replaceQueryParam) ───────────

interface ReconcileQuery {
  institution: string | null;
  account: string | null;
  period: string | null;
}

// Faithful port of accounts-reconcile-hydrate.ts replaceQueryParam: write/clear a
// single query param via the shared `navigate(…, { replace: true })` abstraction
// (NOT pushState — matches legacy and avoids back-button query cycling).
function replaceQueryParam(name: string, value: string | null): void {
  const url = new URL(location.href);
  if (value === null || value === "") url.searchParams.delete(name);
  else url.searchParams.set(name, value);
  navigate(url.pathname + url.search + url.hash, { replace: true });
}

/**
 * The last calendar day of a `YYYY-MM` period, as epoch milliseconds (UTC).
 * `Date.UTC(year, month, 0)` rolls back to the last day of the prior month —
 * with `month` already 1-based this lands on the last day of the selected month.
 * (Ported verbatim from accounts-reconcile-hydrate.ts.)
 */
function periodEndMs(period: string): number {
  const { year, month } = parseReconcilePeriod(period);
  return Date.UTC(year, month, 0);
}

/** Inclusive-start, exclusive-end UTC millisecond bounds for a `YYYY-MM` period. */
function periodBounds(period: string): { startMs: number; endMs: number } {
  const { year, month } = parseReconcilePeriod(period);
  return { startMs: Date.UTC(year, month - 1, 1), endMs: Date.UTC(year, month, 1) };
}

// ── Pure data selectors (ported from accounts-reconcile.ts module functions) ───

function availableAccounts(accounts: Account[]): { institution: string; account: string }[] {
  return accounts
    .map((a) => ({ institution: a.institution, account: a.account }))
    .sort((a, b) => {
      const ak = `${a.institution}\t${a.account}`;
      const bk = `${b.institution}\t${b.account}`;
      return ak.localeCompare(bk);
    });
}

function availablePeriods(legs: JournalLeg[], accountId: string): string[] {
  const periods = new Set<string>();
  for (const leg of legs) {
    if (leg.accountId !== accountId) continue;
    const d = leg.timestamp.toDate();
    periods.add(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return [...periods].sort().reverse();
}

function formatDateShort(ms: number): string {
  return new Date(ms).toLocaleDateString();
}

/**
 * The most recent `Statement` for the account+period, by `balanceDate` then `period`.
 * Returns `null` when no statement exists — an expected optional, not an error.
 */
function statementEndingBalance(
  statements: Statement[],
  institution: string,
  account: string,
  period: string,
): number | null {
  const matching = statements.filter(
    (s) => s.institution === institution && s.account === account && s.period === period,
  );
  if (matching.length === 0) return null;
  const mostRecent = matching.reduce((best, s) =>
    (s.balanceDate ?? "") > (best.balanceDate ?? "") ? s : best,
  );
  return mostRecent.balance;
}

// ── Loaded view model: everything renderReconcileHtml derives for a selection ──

interface ReconcileViewModel {
  account: Account;
  rows: ReconcileRow[];
  suggestedIds: Set<string>;
  statementBalance: number | null;
  accountType: AccountType;
  /** Adjustment-suspense account id, or null when no suspense account exists. */
  suspenseAccountId: string | null;
}

// renderReconcileHtml's selection-dependent derivation, extracted so it can throw
// the same "account not found" error the legacy renderer did.
function buildViewModel(data: LoadedData, query: ReconcileQuery): ReconcileViewModel {
  const institution = query.institution!;
  const account = query.account!;
  const period = query.period!;

  const accountId = accountDocId(institution, account);
  const acct = data.accounts.find((a) => a.id === accountId);
  if (acct === undefined) {
    throw new Error(`Reconcile account ${accountId} not found`);
  }

  const { startMs, endMs } = periodBounds(period);
  const filteredLegs = data.journalLegs.filter((leg) => {
    if (leg.accountId !== accountId) return false;
    const ms = leg.timestamp.toMillis();
    return ms >= startMs && ms < endMs;
  });

  const filteredStatementItems = data.statementItems.filter(
    (item) =>
      item.institution === institution &&
      item.account === account &&
      item.period === period,
  );

  const suggestedIds = suggestClearedLegs(filteredLegs, filteredStatementItems, SUGGESTION_TOLERANCE_DAYS);

  const entriesById = new Map<string, JournalEntry>();
  for (const entry of data.journalEntries) entriesById.set(entry.id, entry);

  const rows = buildReconcileRows(filteredLegs, entriesById, acct.accountType);
  const statementBalance = statementEndingBalance(data.statements, institution, account, period);
  const suspenseAccountId = data.accounts.some((a) => a.id === ADJUSTMENT_SUSPENSE_ACCOUNT_ID)
    ? ADJUSTMENT_SUSPENSE_ACCOUNT_ID
    : null;

  return { account: acct, rows, suggestedIds, statementBalance, accountType: acct.accountType, suspenseAccountId };
}

// ── Controls (renderControls → JSX with DS Select) ─────────────────────────────

function ReconcileControls({ query, accounts, journalLegs, onSelectAccount, onSelectPeriod }: {
  query: ReconcileQuery;
  accounts: Account[];
  journalLegs: JournalLeg[];
  onSelectAccount: (value: string) => void;
  onSelectPeriod: (value: string) => void;
}) {
  const accountOptions = [
    { value: "", label: "Select account…" },
    ...availableAccounts(accounts).map((a) => ({
      value: `${a.institution}\t${a.account}`,
      label: `${a.institution} — ${a.account}`,
    })),
  ];
  const accountValue = query.institution && query.account ? `${query.institution}\t${query.account}` : "";

  const periods = query.institution && query.account
    ? availablePeriods(journalLegs, accountDocId(query.institution, query.account))
    : [];
  const periodOptions = periods.length === 0
    ? [{ value: "", label: "—" }]
    : periods.map((p) => ({ value: p, label: p }));

  return (
    <div id="reconcile-controls" className="reconcile-controls">
      <Select
        id="reconcile-account-select"
        label="Account"
        options={accountOptions}
        value={accountValue}
        onChange={(e) => onSelectAccount(e.target.value)}
      />
      <Select
        id="reconcile-period-select"
        label="Period"
        options={periodOptions}
        value={query.period ?? ""}
        disabled={periods.length === 0}
        onChange={(e) => onSelectPeriod(e.target.value)}
      />
    </div>
  );
}

// ── Leg list (renderLegList → JSX with DS Checkbox) ────────────────────────────

interface LegItemState {
  /** The leg's current cleared (checked) state — optimistic, reverts on error. */
  checked: boolean;
  /** Whether the suggested treatment (class + badge) is still showing. */
  suggested: boolean;
  /**
   * The last persisted cleared value, surfaced as `data-cleared-saved` on the
   * row — a settle signal for e2e (and the legacy contract). `null` while a
   * write is in flight or before any toggle, matching the legacy hydrate's
   * `delete row.dataset.clearedSaved` before the await + set after it resolves.
   */
  savedChecked: boolean | null;
}

function LegList({ rows, legState, onToggle }: {
  rows: ReconcileRow[];
  legState: Map<string, LegItemState>;
  onToggle: (legId: string, next: boolean) => void;
}) {
  if (rows.length === 0) {
    return <p className="reconcile-empty">No journal legs for this account and period.</p>;
  }
  return (
    <ul id="reconcile-leg-list" className="reconcile-list">
      {rows.map((row) => {
        const { leg } = row;
        const reconciled = leg.reconciledEventId !== null || leg.reconciledAt !== null;
        const state = legState.get(leg.id)!;
        const aging = !state.checked && isAged(row.ageDays)
          ? <span className="reconcile-aging" data-age-days={Math.floor(row.ageDays)}>{Math.floor(row.ageDays)}d</span>
          : null;
        const suggestedBadge = state.suggested
          ? <span className="reconcile-suggested-badge">Bank reported</span>
          : null;
        const className = `reconcile-leg${state.suggested ? " reconcile-suggested" : ""}`;
        return (
          <li
            key={leg.id}
            className={className}
            data-leg-id={leg.id}
            data-signed-amount={row.signedAmount}
            {...(state.suggested ? { "data-suggested": "" } : {})}
            {...(state.savedChecked !== null ? { "data-cleared-saved": String(state.savedChecked) } : {})}
          >
            {/* DS Checkbox owns the label/styling contract (cs-checkbox), but the
                input keeps the legacy `reconcile-cleared-checkbox` class the CSS
                rule (.reconcile-suggested .reconcile-cleared-checkbox) and any
                downstream selectors target. The DS component consumes className for
                its <label>, so the input class is preserved by wiring the cs-checkbox
                contract directly here. */}
            <label className="cs-checkbox reconcile-cleared" style={{ display: "inline-flex", alignItems: "center" }}>
              <input
                type="checkbox"
                className="reconcile-cleared-checkbox"
                checked={state.checked}
                disabled={reconciled}
                onChange={(e) => onToggle(leg.id, e.target.checked)}
                style={{ accentColor: "var(--accent)", width: "1rem", height: "1rem" }}
              />
            </label>
            <span className="reconcile-date">{formatDateShort(leg.timestamp.toMillis())}</span>
            <span className="reconcile-description">
              {row.description}
              {aging ? <> {aging}</> : null}
              {suggestedBadge ? <> {suggestedBadge}</> : null}
            </span>
            <span className="reconcile-amount">{formatCurrency(row.signedAmount)}</span>
            <span className="reconcile-running-balance">{formatCurrency(row.runningBalance)}</span>
          </li>
        );
      })}
    </ul>
  );
}

// ── Past reconciliations (renderPastReconciliations → JSX) ─────────────────────

function PastReconciliations({ events, institution, account }: {
  events: ReconciliationEvent[];
  institution: string;
  account: string;
}) {
  const matching = events
    .filter((e) => e.institution === institution && e.account === account)
    .sort((a, b) => b.reconciledThroughDate.toMillis() - a.reconciledThroughDate.toMillis());
  return (
    <section id="reconcile-past" className="reconcile-past">
      <h3>Past reconciliations</h3>
      {matching.length === 0 ? (
        <p className="reconcile-empty">No past reconciliations.</p>
      ) : (
        // The past-reconciliations list composes DS Card (the panel) with one
        // Metric per event (the cleared-balance figure), keeping the legacy
        // reconcile-past-event item classes + data-event-id / data-adjustment-entry-id
        // contract that the renderer test asserts.
        <Card as="ul" className="reconcile-list" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {matching.map((e) => {
            const through = formatDateShort(e.reconciledThroughDate.toMillis());
            const hasAdjustment = Math.round(e.adjustment * 100) !== 0;
            return (
              <li key={e.id} className="reconcile-past-event" data-event-id={e.id} style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
                <Metric
                  label={<span className="reconcile-date">{through}</span>}
                  value={<span className="reconcile-amount">{formatCurrency(e.clearedBalance)}</span>}
                  delta={hasAdjustment ? (
                    <span className="reconcile-adjustment-indicator" data-adjustment-entry-id={e.adjustmentEntryId ?? ""}>
                      {formatCurrency(e.adjustment)}
                    </span>
                  ) : undefined}
                />
              </li>
            );
          })}
        </Card>
      )}
    </section>
  );
}

// ── Loaded reconcile surface (header + leg list + dialog + past) ───────────────
//
// Owns ALL interactive state for a selection. Re-keyed by selection + nonce in the
// page (so a query switch or a finalize resets every flag), mirroring the legacy
// full re-render. The dialog is rendered inline; its state (input/phase/disabled)
// lives here so the submit/adjust handlers can read the live cleared total without
// a DOM round-trip.

type DialogPhase = "match-pending" | "mismatch";

function LoadedReconcile({ data, query, vm, onReload, onSelectAccount, onSelectPeriod }: {
  data: LoadedData;
  query: ReconcileQuery;
  vm: ReconcileViewModel;
  onReload: () => void;
  onSelectAccount: (value: string) => void;
  onSelectPeriod: (value: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Per-leg checked + suggestion state, seeded from the loaded rows. The React
  // equivalent of the rendered checkbox state + suggestion class/badge.
  const [legState, setLegState] = useState<Map<string, LegItemState>>(() => {
    const map = new Map<string, LegItemState>();
    for (const row of vm.rows) {
      const reconciled = row.leg.reconciledEventId !== null || row.leg.reconciledAt !== null;
      const suggested = !row.leg.cleared && !reconciled && vm.suggestedIds.has(row.leg.id);
      // savedChecked starts null → no data-cleared-saved attribute on initial
      // render (matching the legacy hydrate, which only stamps it post-persist).
      map.set(row.leg.id, { checked: row.leg.cleared, suggested, savedChecked: null });
    }
    return map;
  });

  // Dialog UI state (the legacy dialog's hidden/disabled/textContent mutations).
  const [bankInput, setBankInput] = useState<string>(vm.statementBalance !== null ? String(vm.statementBalance) : "");
  const [dialogPhase, setDialogPhase] = useState<DialogPhase>("match-pending");
  const [differenceText, setDifferenceText] = useState<string>("");
  const [submitDisabled, setSubmitDisabled] = useState(false); // re-entrancy guard
  const [adjustDisabled, setAdjustDisabled] = useState(false);  // re-entrancy guard

  // The live cleared balance, summed from the checked legs — the React equivalent
  // of clearedBalanceFromDom (sum signedAmount over checked rows).
  const clearedFromState = (state: Map<string, LegItemState>): number => {
    let total = 0;
    for (const row of vm.rows) {
      if (state.get(row.leg.id)?.checked) total += row.signedAmount;
    }
    return total;
  };
  const cleared = clearedFromState(legState);

  // Cleared-checkbox toggle: optimistic flip (+ live header total via state);
  // async persist; revert on error; dismiss suggestion styling on success. Port
  // of the container change listener in accounts-reconcile-hydrate.ts.
  const onToggle = (legId: string, next: boolean): void => {
    setLegState((prev) => {
      const cur = prev.get(legId);
      if (!cur) return prev;
      const map = new Map(prev);
      // Optimistic flip; clear the settle signal (legacy: delete clearedSaved
      // before the await) so a stale "true" cannot be read as the new write.
      map.set(legId, { ...cur, checked: next, savedChecked: null });
      return map;
    });
    getActiveDataSource()
      .updateJournalLegCleared(legId, next)
      .then(() => {
        // Any explicit toggle dismisses the suggestion — checking confirms it,
        // unchecking rejects it. Either way the row leaves the suggested pool so a
        // later Confirm-all cannot re-clear a rejection. Stamp the settled write
        // (legacy: row.dataset.clearedSaved = String(nextChecked)).
        setLegState((prev) => {
          const cur = prev.get(legId);
          if (!cur) return prev;
          const map = new Map(prev);
          map.set(legId, { ...cur, suggested: false, savedChecked: next });
          return map;
        });
      })
      .catch((error: unknown) => {
        setLegState((prev) => {
          const cur = prev.get(legId);
          if (!cur) return prev;
          const map = new Map(prev);
          map.set(legId, { ...cur, checked: !next }); // revert the optimistic flip
          return map;
        });
        if (deferProgrammerError(error)) return;
        logError(error, { operation: "reconcile-toggle-cleared" });
      });
  };

  // Confirm-all: bulk-check every suggested row, persist in parallel, revert the
  // individual rows that fail. Port of handleConfirmAll.
  const onConfirmAll = (): void => {
    const suggestedIds: string[] = [];
    for (const [id, st] of legState) if (st.suggested) suggestedIds.push(id);
    if (suggestedIds.length === 0) return;

    setLegState((prev) => {
      const map = new Map(prev);
      for (const id of suggestedIds) {
        const cur = map.get(id)!;
        // Optimistic bulk-check; clear the settle signal until each write lands.
        map.set(id, { ...cur, checked: true, savedChecked: null });
      }
      return map;
    });

    void Promise.all(
      suggestedIds.map(async (id) => {
        try {
          await getActiveDataSource().updateJournalLegCleared(id, true);
          setLegState((prev) => {
            const cur = prev.get(id);
            if (!cur) return prev;
            const map = new Map(prev);
            // promote: drop suggestion styling + stamp the settled write
            // (legacy: row.dataset.clearedSaved = "true" after each persist).
            map.set(id, { ...cur, suggested: false, savedChecked: true });
            return map;
          });
        } catch (error: unknown) {
          setLegState((prev) => {
            const cur = prev.get(id);
            if (!cur) return prev;
            const map = new Map(prev);
            map.set(id, { ...cur, checked: false }); // revert this row
            return map;
          });
          if (deferProgrammerError(error)) return;
          logError(error, { operation: "reconcile-confirm-all" });
        }
      }),
    );
  };

  // Open the dialog, resetting its mismatch state (legacy open handler).
  const openDialog = (): void => {
    setDialogPhase("match-pending");
    setDifferenceText("");
    setBankInput(vm.statementBalance !== null ? String(vm.statementBalance) : "");
    setSubmitDisabled(false);
    setAdjustDisabled(false);
    dialogRef.current?.showModal();
  };

  function parseBank(): number | null {
    // Number("") is 0, not NaN — guard the empty input explicitly so an un-filled
    // dialog is rejected rather than reconciled against a zero balance.
    const raw = bankInput.trim();
    const value = Number(raw);
    if (raw === "" || !Number.isFinite(value)) {
      setDifferenceText("Enter a valid bank balance.");
      return null;
    }
    return value;
  }

  // finalizeReconciliation: write the reconciliation event with the cleared leg
  // ids (+ any extra adjustment legs), then close + reload. Surface the error in
  // the dialog. Port of finalizeReconciliation.
  const finalize = async (bankBalance: number, opts: { adjustment: number; adjustmentEntryId: string | null; extraLegIds: string[] }): Promise<void> => {
    const legIds: string[] = [];
    for (const [id, st] of legState) if (st.checked) legIds.push(id);
    legIds.push(...opts.extraLegIds);

    const clearedNow = clearedFromState(legState);
    const fields: ReconciliationEventFields = {
      institution: query.institution!,
      account: query.account!,
      reconciledThroughDateMs: periodEndMs(query.period!),
      bankBalance,
      clearedBalance: clearedNow,
      adjustment: opts.adjustment,
      reconciledBy: "local",
      reconciledAtMs: Date.now(),
      adjustmentEntryId: opts.adjustmentEntryId,
    };

    try {
      await getActiveDataSource().createReconciliationEvent(fields, legIds);
      dialogRef.current?.close();
      onReload();
    } catch (error) {
      if (deferProgrammerError(error)) return;
      setDifferenceText("Reconcile failed — please try again.");
      logError(error, { operation: "reconcile-finalize" });
    }
  };

  // Dialog submit: validate, compare cent-tolerant. Match → finalize with zero
  // adjustment; mismatch → reveal mismatch actions, keep dialog open. Port of
  // handleReconcileSubmit (including the submit re-entrancy guard).
  const onSubmit = (event: React.FormEvent): void => {
    event.preventDefault();
    if (submitDisabled) return;
    const bankBalance = parseBank();
    if (bankBalance === null) return;
    const clearedNow = clearedFromState(legState);
    if (!balancesMatch(bankBalance, clearedNow)) {
      setDifferenceText(`Difference: ${formatCurrency(clearedNow - bankBalance)}`);
      setDialogPhase("mismatch");
      return;
    }
    setSubmitDisabled(true);
    void (async () => {
      try {
        await finalize(bankBalance, { adjustment: 0, adjustmentEntryId: null, extraLegIds: [] });
      } finally {
        setSubmitDisabled(false);
      }
    })();
  };

  // Escape-hatch: build a balanced adjustment entry, then finalize with the signed
  // difference. Keep the create button disabled once the entry exists — preventing
  // orphan entries on retry. Port of handleCreateAdjustment's entryCreated guard.
  const onCreateAdjustment = (): void => {
    if (adjustDisabled) return; // re-entrancy guard
    const bankBalance = parseBank();
    if (bankBalance === null) return;
    const clearedNow = clearedFromState(legState);
    const difference = clearedNow - bankBalance;
    // The user can edit the bank balance to match after the mismatch actions
    // appear. Refuse a zero-amount adjustment — submit the dialog instead.
    if (balancesMatch(bankBalance, clearedNow)) {
      setDifferenceText("Balances match — submit to reconcile without an adjustment.");
      return;
    }
    if (vm.suspenseAccountId === null) {
      setDifferenceText("No Adjustment Suspense account is available — cannot create an adjustment entry.");
      return;
    }

    setAdjustDisabled(true);
    void (async () => {
      let entryCreated = false;
      try {
        const { entry, legs } = buildAdjustmentEntry({
          difference,
          reconcilingAccountId: accountDocId(query.institution!, query.account!),
          reconcilingAccountType: vm.accountType,
          suspenseAccountId: vm.suspenseAccountId!,
          accountLabel: query.account!,
          throughDateMs: periodEndMs(query.period!),
        });
        const { entryId, legIds } = await getActiveDataSource().createJournalEntry(entry, legs);
        entryCreated = true;
        await finalize(bankBalance, { adjustment: difference, adjustmentEntryId: entryId, extraLegIds: [...legIds] });
      } catch (error) {
        if (deferProgrammerError(error)) return;
        setDifferenceText("Adjustment entry failed — please try again.");
        logError(error, { operation: "reconcile-create-adjustment" });
      } finally {
        // Only re-enable if the journal entry was never written — once an entry
        // exists, disallow retry to prevent orphan accumulation.
        if (!entryCreated) setAdjustDisabled(false);
      }
    })();
  };

  const hasSuggestions = [...legState.values()].some((s) => s.suggested);

  return (
    <div
      id="reconcile-container"
      {...(vm.statementBalance !== null ? { "data-statement-balance": String(vm.statementBalance) } : {})}
      data-account-type={vm.accountType}
      {...(vm.suspenseAccountId !== null ? { "data-suspense-account-id": vm.suspenseAccountId } : {})}
    >
      <ReconcileControls
        query={query}
        accounts={data.accounts}
        journalLegs={data.journalLegs}
        onSelectAccount={onSelectAccount}
        onSelectPeriod={onSelectPeriod}
      />
      <div id="reconcile-header" className="reconcile-header">
        <Card style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-4)", alignItems: "center" }}>
          <Metric
            label="Cleared balance"
            value={<span className="reconcile-cleared-balance">{formatCurrency(cleared)}</span>}
          />
          {vm.statementBalance !== null ? (
            <Metric
              label="Statement-ending balance"
              value={<span className="reconcile-statement-balance">{formatCurrency(vm.statementBalance)}</span>}
            />
          ) : null}
          {vm.statementBalance !== null ? (
            <Metric
              label="Difference"
              value={<span className="reconcile-difference">{formatCurrency(cleared - vm.statementBalance)}</span>}
            />
          ) : null}
        </Card>
        {hasSuggestions ? (
          <Button id="reconcile-confirm-all" onClick={onConfirmAll}>Confirm all suggestions</Button>
        ) : null}
        <Button id="reconcile-open-dialog" onClick={openDialog}>Reconcile</Button>
      </div>
      <LegList rows={vm.rows} legState={legState} onToggle={onToggle} />
      <dialog id="reconcile-dialog" ref={dialogRef}>
        <form method="dialog" id="reconcile-dialog-form" onSubmit={onSubmit}>
          <label>Bank's cleared balance:
            <Input
              id="reconcile-bank-balance-input"
              type="number"
              step="0.01"
              value={bankInput}
              onChange={(e) => setBankInput(e.target.value)}
            />
          </label>
          <p id="reconcile-difference-display" className="reconcile-difference-display">{differenceText}</p>
          <div id="reconcile-mismatch-actions" hidden={dialogPhase !== "mismatch"}>
            <Button type="button" id="reconcile-adjust-selections" onClick={() => dialogRef.current?.close()}>
              Adjust cleared selections
            </Button>
            <Button type="button" id="reconcile-create-adjustment" disabled={adjustDisabled} onClick={onCreateAdjustment}>
              Create adjustment entry
            </Button>
            <small className="reconcile-escape-hatch-note">Use only for small, unexplained differences.</small>
          </div>
          <div className="reconcile-dialog-actions">
            <Button type="submit" id="reconcile-submit" disabled={submitDisabled}>Reconcile</Button>
            <Button type="button" id="reconcile-cancel" onClick={() => dialogRef.current?.close()}>Cancel</Button>
          </div>
        </form>
      </dialog>
      <PastReconciliations events={data.reconciliationEvents} institution={query.institution!} account={query.account!} />
    </div>
  );
}

// ── Load pipeline (renderAccountsReconcile → effect) ───────────────────────────

interface LoadedData {
  journalLegs: JournalLeg[];
  journalEntries: JournalEntry[];
  reconciliationEvents: ReconciliationEvent[];
  accounts: Account[];
  statements: Statement[];
  statementItems: StatementItem[];
}

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; data: LoadedData }
  | { status: "error"; message: string };

// Mirror renderLoadError's classification (render-options.ts:20-27) +
// LegacyRoute.formatRouteError, reproduced inline because an async effect throw
// cannot reach a React error boundary. Identical to Accounts/Transactions.
function loadErrorMessage(error: unknown): string {
  const kind = classifyError(error);
  if (kind === "programmer") return "Something went wrong. Please try again.";
  if (kind === "data-integrity" || kind === "range") return "A data error occurred. Please contact support.";
  if (kind === "permission-denied") return "Access denied. Please contact support.";
  return "Could not load data. Try refreshing the page.";
}

// The renderAccountsReconcile data pipeline moved into an effect. Re-runs whenever
// the query selection or the reload nonce changes — the faithful equivalent of the
// legacy triggerReload() (the legacy renderer fetched ALL records with no args, so
// a query change is a pure re-filter; re-fetching is behaviorally identical).
function useReconcileData(options: RenderPageOptions, query: ReconcileQuery, reloadNonce: number): LoadState {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    const { dataSource } = options;
    setState({ status: "loading" });

    (async () => {
      try {
        const [journalLegs, journalEntries, reconciliationEvents, accounts, statements, statementItems] = await Promise.all([
          dataSource.getJournalLegs(),
          dataSource.getJournalEntries(),
          dataSource.getReconciliationEvents(),
          dataSource.getAccounts(),
          dataSource.getStatements(),
          dataSource.getStatementItems(),
        ]);
        if (cancelled) return;
        setState({ status: "loaded", data: { journalLegs, journalEntries, reconciliationEvents, accounts, statements, statementItems } });
      } catch (error) {
        if (cancelled) return;
        if (!deferProgrammerError(error)) logError(error, { operation: "router-render" });
        setState({ status: "error", message: loadErrorMessage(error) });
      }
    })();

    return () => { cancelled = true; };
  }, [query.institution, query.account, query.period, reloadNonce]);

  return state;
}

export function AccountsReconcile({ options }: { options: RenderPageOptions }): ReactNode {
  // Query state, initialized from the URL — the deep-link read.
  const [query, setQuery] = useState<ReconcileQuery>(() => {
    const q = parseReconcileQuery(typeof location !== "undefined" ? location.search : "");
    return { institution: q.institution, account: q.account, period: q.period };
  });
  const [reloadNonce, setReloadNonce] = useState(0);

  const load = useReconcileData(options, query, reloadNonce);

  // Select change → write the URL via the shared `navigate(…, { replace: true })`
  // abstraction AND update query state. No popstate dispatch (useRouter strips the
  // query, so it is inert).
  const onSelectAccount = (value: string): void => {
    if (!value) {
      replaceQueryParam("institution", null);
      replaceQueryParam("account", null);
      replaceQueryParam("period", null);
      setQuery({ institution: null, account: null, period: null });
    } else {
      const [institution, account] = value.split("\t");
      replaceQueryParam("institution", institution);
      replaceQueryParam("account", account);
      replaceQueryParam("period", null);
      setQuery({ institution, account, period: null });
    }
  };
  const onSelectPeriod = (value: string): void => {
    replaceQueryParam("period", value || null);
    setQuery((prev) => ({ ...prev, period: value || null }));
  };

  // Post-finalize reload: bump the nonce (re-fetch + re-key the loaded view).
  const onReload = (): void => setReloadNonce((n) => n + 1);

  let body: ReactNode = null;
  if (load.status === "error") {
    body = <p id="reconcile-error">{load.message}</p>;
  } else if (load.status === "loaded") {
    const data = load.data;
    const selected = !!(query.institution && query.account && query.period);
    if (!selected) {
      body = (
        <div id="reconcile-container">
          <ReconcileControls
            query={query}
            accounts={data.accounts}
            journalLegs={data.journalLegs}
            onSelectAccount={onSelectAccount}
            onSelectPeriod={onSelectPeriod}
          />
          <p className="reconcile-empty">Select an account and period to reconcile.</p>
        </div>
      );
    } else {
      try {
        const vm = buildViewModel(data, query);
        // Re-key the loaded view by selection + nonce so per-leg optimistic state,
        // dialog open/mismatch state, and re-entrancy guards reset on each (re)load
        // — the React equivalent of the legacy full re-render.
        body = (
          <LoadedReconcile
            key={`${query.institution}\t${query.account}\t${query.period}:${reloadNonce}`}
            data={data}
            query={query}
            vm={vm}
            onReload={onReload}
            onSelectAccount={onSelectAccount}
            onSelectPeriod={onSelectPeriod}
          />
        );
      } catch (error) {
        if (!deferProgrammerError(error)) logError(error, { operation: "reconcile-render" });
        body = <p id="reconcile-error">{loadErrorMessage(error)}</p>;
      }
    }
  }

  return (
    <main id="app">
      <h2>Reconcile account</h2>
      {options.authorized ? null : (
        <p id="seed-data-notice">Viewing example data. Load a data file to see your reconciliation.</p>
      )}
      {body}
    </main>
  );
}
