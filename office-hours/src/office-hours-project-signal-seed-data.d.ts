declare module "virtual:office-hours-project-signal-seed-data" {
  import type {
    GithubSignals,
    Ga4AppSignals,
    GscSignals,
    PsiUrlSignals,
  } from "./project-signals.js";

  const projectSignalSeed: {
    readonly computedAt: Date;
    readonly groupId: string;
    readonly github?: GithubSignals;
    readonly ga4?: Ga4AppSignals[];
    readonly gsc?: GscSignals;
    readonly psi?: PsiUrlSignals[];
  };
  export default projectSignalSeed;
}
