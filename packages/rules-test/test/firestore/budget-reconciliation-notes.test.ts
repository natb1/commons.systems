import { describeDeniedBudgetCollection } from "../setup.js";

// budget/{env}/reconciliation-notes was pruned (budget is local-first, no runtime client
// path reads or writes it) — assert the surface is now denied.
describeDeniedBudgetCollection("reconciliation-notes");
