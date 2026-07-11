import { describeDeniedBudgetCollection } from "../setup.js";

// budget/{env}/statements was pruned (budget is local-first, no runtime client
// path reads or writes it) — assert the surface is now denied.
describeDeniedBudgetCollection("statements");
