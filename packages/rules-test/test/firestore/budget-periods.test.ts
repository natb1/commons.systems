import { describeDeniedBudgetCollection } from "../setup.js";

// budget/{env}/budget-periods was pruned (budget is local-first, no runtime
// client path reads or writes it) — assert the surface is now denied.
describeDeniedBudgetCollection("budget-periods");
