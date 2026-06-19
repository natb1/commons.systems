// The React shell. Composes the ds Nav (with AuthControls in its `end` slot),
// the hero island, the per-route body, and the footer. The client router lives
// in use-router.ts; the data/crypto/file-sync orchestration lives in
// use-app-state.ts. All routes are now real React pages: "/" (Budgets),
// /transactions (Transactions), /accounts (Accounts), /accounts/reconcile
// (AccountsReconcile), and /rules (Rules).
import { AppShell } from "./AppShell.js";
import { AuthControls } from "./AuthControls.js";
import { Hero } from "./Hero.js";
import { useAppState } from "./use-app-state.js";
import { useRouter } from "./use-router.js";
import { Budgets } from "./pages/Budgets.js";
import { Transactions } from "./pages/Transactions.js";
import { Accounts } from "./pages/Accounts.js";
import { AccountsReconcile } from "./pages/AccountsReconcile.js";
import { Rules } from "./pages/Rules.js";

// Every route is now a real React page, not a <LegacyRoute>; they are all known
// paths for routing + Nav `current`, matched by exact-equality isX selection.
// Budgets ("/") is also the unknown-path fallback (it was ROUTES[0] in the
// legacy router's `?? ROUTES[0]` fall-through).
const BUDGETS_PATH = "/";
const TRANSACTIONS_PATH = "/transactions";
const ACCOUNTS_PATH = "/accounts";
const ACCOUNTS_RECONCILE_PATH = "/accounts/reconcile";
const RULES_PATH = "/rules";

// Known paths preserve the legacy nav ordering from main.ts:132-136: budgets
// ("/") first, then /transactions, /accounts, /accounts/reconcile in their
// original slots, and /rules appended last. All are React pages now, so each
// path is listed explicitly.
const KNOWN_PATHS = [BUDGETS_PATH, TRANSACTIONS_PATH, ACCOUNTS_PATH, ACCOUNTS_RECONCILE_PATH, RULES_PATH];

export function App() {
  const app = useAppState();
  const path = useRouter(KNOWN_PATHS);

  // Exact-equality selection. /accounts/reconcile is the more specific path;
  // check it BEFORE /accounts so the sub-path is never swallowed by the accounts
  // match. (With exact `===` it could not be swallowed anyway, but the ordering
  // is explicit.) The legacy router fell back to ROUTES[0] (budgets) for an
  // unknown path; now budgets is a React page, so "/" AND any unknown path
  // (not one of the named React pages) render the React Budgets page — it is the
  // JSX fallback below.
  const isAccountsReconcile = path === ACCOUNTS_RECONCILE_PATH;
  const isAccounts = path === ACCOUNTS_PATH;
  const isTransactions = path === TRANSACTIONS_PATH;
  const isRules = path === RULES_PATH;
  const currentPath = isTransactions
    ? TRANSACTIONS_PATH
    : isAccountsReconcile
      ? ACCOUNTS_RECONCILE_PATH
      : isAccounts
        ? ACCOUNTS_PATH
        : isRules
          ? RULES_PATH
          : BUDGETS_PATH;

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

          Every route is a real React page — "/" (Budgets), /transactions
          (Transactions), /accounts (Accounts), /accounts/reconcile
          (AccountsReconcile), and /rules (Rules). Same keying so a same-path data
          transition re-mounts them and re-resolves; renderOptions() is read at
          mount and also calls setActiveDataSource for the route.

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
        <Budgets
          key={`${BUDGETS_PATH}:${app.navEpoch}`}
          options={app.renderOptions()}
        />
      )}
    </AppShell>
  );
}
