export function formatCurrency(n: number): string {
  if (!Number.isFinite(n)) throw new RangeError(`formatCurrency received non-finite value: ${n}`);
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
