// The React shell. Composes the ds Nav (with AuthControls in its `end` slot),
// the hero island, the per-route body, and the footer. The client router lives
// in use-router.ts; the data/crypto/file-sync orchestration lives in
// use-app-state.ts. /transactions, /accounts, and /accounts/reconcile are real
// React pages; the remaining routes (/, /rules) are still legacy string-rendered
// bodies wrapped in <LegacyRoute>.
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
import { renderBudgets } from "./pages/budgets.js";
import { renderRules } from "./pages/rules.js";
import { hydrateBudgetTable, hydrateBudgetChart, hydrateOverridesTable } from "./pages/budgets-hydrate.js";
import { hydrateRulesTable } from "./pages/rules-hydrate.js";

interface RouteDef {
  path: string;
  render: (o: RenderPageOptions) => Promise<string | null>;
  specs: HydrationSpec[];
}

// /transactions is a real React page (Unit 3), not a <LegacyRoute>; it lives
// outside ROUTES but is still a known path for routing + Nav `current`.
// /accounts and /accounts/reconcile are real React pages too (Unit 4), so they
// also live outside ROUTES and are matched by exact-equality isX selection.
const TRANSACTIONS_PATH = "/transactions";
const ACCOUNTS_PATH = "/accounts";
const ACCOUNTS_RECONCILE_PATH = "/accounts/reconcile";

// LegacyRoute-backed routes mirror main.ts:132-136 (minus /transactions), with
// per-route hydration specs from main.ts:182-191. The first route is the
// fallback for an unknown path.
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
  {
    path: "/rules",
    render: renderRules,
    specs: [
      { selector: "#rules-table", hydrate: hydrateRulesTable },
    ],
  },
];

// Known paths preserve the legacy ordering for nav: "/", then the React pages
// /transactions, /accounts, /accounts/reconcile (their original slots in
// main.ts:132-136), then the remaining LegacyRoute paths (/rules). ROUTES now
// holds only "/" and the LegacyRoute paths.
const KNOWN_PATHS = [
  ROUTES[0].path,
  TRANSACTIONS_PATH,
  ACCOUNTS_PATH,
  ACCOUNTS_RECONCILE_PATH,
  ...ROUTES.slice(1).map((r) => r.path),
];

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
  // matchRoute … ?? routes[0] (the legacy router fell back to the first route).
  // For the React pages (/transactions, /accounts, /accounts/reconcile) there is
  // no LegacyRoute entry; `route` is only used for the LegacyRoute branch and the
  // Nav `current` (overridden below for the React-page paths).
  const route = ROUTES.find((r) => r.path === path) ?? ROUTES[0];
  const currentPath = isTransactions
    ? TRANSACTIONS_PATH
    : isAccountsReconcile
      ? ACCOUNTS_RECONCILE_PATH
      : isAccounts
        ? ACCOUNTS_PATH
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

          /transactions, /accounts, and /accounts/reconcile are real React pages
          — same keying so a same-path data transition re-mounts them and
          re-resolves; renderOptions() is read at mount and also calls
          setActiveDataSource for the route, matching how LegacyRoute is fed. The
          remaining routes (/, /rules) stay legacy.

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
