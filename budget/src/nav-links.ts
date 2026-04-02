export const NAV_LINKS = [
  { href: "/", label: "budgets" },
  { href: "/transactions", label: "transactions" },
  { href: "/accounts", label: "accounts" },
  { href: "/rules", label: "rules" },
] as const satisfies readonly { href: string; label: string }[];
