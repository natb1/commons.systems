// The React shell. Composes the ds Nav (with AuthControls in its `end` slot),
// the hero island, the per-route body, and the footer. The client router lives
// in use-router.ts; the data/crypto/file-sync orchestration lives in
// use-app-state.ts. /transactions, /accounts, /accounts/reconcile, and /rules
// are real React pages; only / (budgets) remains a legacy string-rendered body
// wrapped in <LegacyRoute>.
import { AppShell } from "./AppShell.js";
import { AuthControls } from "./AuthControls.js";
import { Hero } from "./Hero.js";
import { LegacyRoute } from "./LegacyRoute.js";
import { useAppState } from "./use-app-state.js";
import { useRouter } from "./use-router.js";
import type { HydrationSpec } from "./legacy-hydrate.js";
import type { RenderPageOptions } from "./pages/render-options.js";
import { Transactions } from "./pages/Transactions.js";
import { Accounts } from "./pages/Accounts.js";
import { AccountsReconcile } from "./pages/AccountsReconcile.js";
import { Rules } from "./pages/Rules.js";
import { renderBudgets } from "./pages/budgets.js";
import { hydrateBudgetTable, hydrateBudgetChart, hydrateOverridesTable } from "./pages/budgets-hydrate.js";

interface RouteDef {
  path: string;
  render: (o: RenderPageOptions) => Promise<string | null>;
  specs: HydrationSpec[];
}

// /transactions, /accounts, /accounts/reconcile, and /rules are real React
// pages, not <LegacyRoute>s; they live outside ROUTES but are still known paths
// for routing + Nav `current`, matched by exact-equality isX selection.
const TRANSACTIONS_PATH = "/transactions";
const ACCOUNTS_PATH = "/accounts";
const ACCOUNTS_RECONCILE_PATH = "/accounts/reconcile";
const RULES_PATH = "/rules";

// The only LegacyRoute-backed route is / (budgets), with per-route hydration
// specs from main.ts:182-191. It is also the fallback for an unknown path.
const ROUTES: RouteDef[] = [
  {
    path: "/",
    render: renderBudgets,
    specs: [
      { selector: "#budgets-chart", hydrate: hydrateBudgetChart },
      { selector: "#budgets-table", hydrate: hydrateBudgetTable },
      { selector: "#overrides-table", hydrate: hydrateOverridesTable },
    ],
  },
];

// Known paths preserve the legacy ordering for nav (main.ts:132-136): "/" first,
// then the React pages /transactions, /accounts, /accounts/reconcile in their
// original slots, and /rules appended last. ROUTES now holds only "/", so the
// React-page paths are listed explicitly.
const KNOWN_PATHS = [ROUTES[0].path, TRANSACTIONS_PATH, ACCOUNTS_PATH, ACCOUNTS_RECONCILE_PATH, RULES_PATH];

export function App() {
  const app = useAppState();
  const path = useRouter(KNOWN_PATHS);

  // Exact-equality selection — mirrors the legacy `ROUTES.find(r => r.path === path)`
  // exact match. /accounts/reconcile is the more specific path; check it BEFORE
  // /accounts so the sub-path is never swallowed by the accounts match. (With
  // exact `===` it could not be swallowed anyway, but the ordering is explicit.)
  const isAccountsReconcile = path === ACCOUNTS_RECONCILE_PATH;
  const isAccounts = path === ACCOUNTS_PATH;
  const isTransactions = path === TRANSACTIONS_PATH;
  const isRules = path === RULES_PATH;
  // matchRoute … ?? routes[0] (the legacy router fell back to the first route).
  // For the React pages (/transactions, /accounts, /accounts/reconcile, /rules)
  // there is no LegacyRoute entry; `route` is only used for the LegacyRoute branch
  // and the Nav `current` (overridden below for the React-page paths).
  const route = ROUTES.find((r) => r.path === path) ?? ROUTES[0];
  const currentPath = isTransactions
    ? TRANSACTIONS_PATH
    : isAccountsReconcile
      ? ACCOUNTS_RECONCILE_PATH
      : isAccounts
        ? ACCOUNTS_PATH
        : isRules
          ? RULES_PATH
          : route.path;

  return (
    <AppShell
      current={currentPath}
      navEnd={<AuthControls {...app} />}
      hero={<Hero hidden={app.state.source === "local"} />}
    >
      {/* Keyed by path AND navEpoch: a fresh instance per link navigation
          (path change) AND per data transition (navEpoch bump), so the body
          re-resolves against the current data source — exactly what legacy's
          trailing router.navigate() did. Each instance still renders once, so
          the render-once invariant holds.

          /transactions, /accounts, /accounts/reconcile, and /rules are real
          React pages — same keying so a same-path data transition re-mounts them
          and re-resolves; renderOptions() is read at mount and also calls
          setActiveDataSource for the route, matching how LegacyRoute is fed. Only
          / (budgets) stays legacy.

          Gated on app.initialized: initialize() always ends with a transition()
          that bumps navEpoch 0→1, which would unmount-then-remount a body
          rendered eagerly at navEpoch=0 and wipe its just-hydrated chart/table.
          Holding the body until initialize settles mounts it exactly once at
          navEpoch=1 — matching legacy's single post-initialize router.navigate().
          The AppShell/nav/header/footer/hero still render immediately. */}
      {!app.initialized ? null : isTransactions ? (
        <Transactions
          key={`${TRANSACTIONS_PATH}:${app.navEpoch}`}
          options={app.renderOptions()}
        />
      ) : isAccountsReconcile ? (
        <AccountsReconcile
          key={`${ACCOUNTS_RECONCILE_PATH}:${app.navEpoch}`}
          options={app.renderOptions()}
        />
      ) : isAccounts ? (
        <Accounts
          key={`${ACCOUNTS_PATH}:${app.navEpoch}`}
          options={app.renderOptions()}
        />
      ) : isRules ? (
        <Rules
          key={`${RULES_PATH}:${app.navEpoch}`}
          options={app.renderOptions()}
        />
      ) : (
        <LegacyRoute
          key={`${route.path}:${app.navEpoch}`}
          render={() => route.render(app.renderOptions())}
          specs={route.specs}
        />
      )}
    </AppShell>
  );
}
