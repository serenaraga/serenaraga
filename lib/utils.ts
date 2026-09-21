export { cn } from "cn";

/**
 * Standard Indonesian Rupiah Currency Formatter (e.g. "Rp 150.000")
 * Consistently formats with "id-ID" locale to guarantee "Rp " prefix.
 */
export function formatIDR(val: number | string | null | undefined): string {
  const num = typeof val === "number" ? val : Number(val) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export const formatCurrency = formatIDR;
