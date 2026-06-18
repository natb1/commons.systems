/** The tier a consumer's render callback must paint. Generic over loaded data D. */
export type AuthTier<D> =
  | { tier: "demo" }
  | { tier: "owner"; data: D }
  | { tier: "error" };

export interface AuthTierController<U> {
  /**
   * Drive a new auth identity. Synchronously renders demo when user is null;
   * otherwise loads and renders the owner tier, or the error tier on failure.
   * A later call supersedes any in-flight load (generation guard), so a stale
   * result cannot clobber a newer render. Never rejects.
   */
  handleAuthChange(user: U | null): void;
}

/**
 * Create an auth-tier render controller. Renders the demo tier synchronously on
 * construction (immediate demo paint), then transitions through owner/error
 * tiers as auth identities arrive via handleAuthChange.
 */
export function createAuthTierController<U, D>({
  load,
  render,
}: {
  /** Load owner data for a signed-in user. Rejection → error tier. */
  load: (user: U) => Promise<D>;
  /** Paint a tier. Called synchronously with {tier:"demo"} on construction. */
  render: (tier: AuthTier<D>) => void;
}): AuthTierController<U> {
  let generation = 0;
  render({ tier: "demo" });
  return {
    handleAuthChange(user: U | null): void {
      const gen = ++generation;
      if (user === null) {
        render({ tier: "demo" });
        return;
      }
      load(user)
        .then((data) => {
          if (gen === generation) render({ tier: "owner", data });
        })
        .catch(() => {
          if (gen === generation) render({ tier: "error" });
        });
    },
  };
}
