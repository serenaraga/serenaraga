import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

/**
 * Smart Multi-language Promo Name Localizer
 * Automatically translates system promo names, scopes, and custom discounts.
 */
export function localizePromoName(
  rawName: string | null | undefined,
  isEn: boolean
): string {
  if (!rawName) return isEn ? "Custom Discount" : "Diskon Manual";
  const name = rawName.trim();
  const lower = name.toLowerCase();

  // 1. First-Time Customer Promos
  if (
    lower.includes("first") ||
    lower.includes("pertama") ||
    lower.includes("baru") ||
    lower.includes("new customer") ||
    lower.includes("first_order")
  ) {
    return isEn ? "First-Time Customer Promo" : "Diskon Pelanggan Baru";
  }

  // 2. Loyalty Milestone Promos
  if (
    lower.includes("loyal") ||
    lower.includes("setia") ||
    lower.includes("milestone") ||
    lower.includes("loyalty")
  ) {
    const countMatch = name.match(/(\d+x|\d+\s*order)/i);
    const countStr = countMatch ? ` (${countMatch[1]})` : "";
    return isEn
      ? `Loyal Customer Promo${countStr}`
      : `Diskon Pelanggan Setia${countStr}`;
  }

  // 3. Min Spend Promos
  if (
    lower.includes("min. order") ||
    lower.includes("min order") ||
    lower.includes("minimum belanja") ||
    lower.includes("min_order") ||
    lower.includes("belanja minimal")
  ) {
    return isEn ? "Minimum Spend Promo" : "Diskon Belanja Minimal";
  }

  // 4. Manual / Custom Discount
  if (
    lower === "diskon manual" ||
    lower === "custom discount" ||
    lower === "manual" ||
    lower === "custom"
  ) {
    return isEn ? "Custom Discount" : "Diskon Manual";
  }

  // 5. Voucher Code
  if (lower.startsWith("voucher:") || lower.startsWith("kode:") || lower === "code") {
    const code = name.split(":")[1]?.trim() || name;
    return isEn ? `Voucher (${code})` : `Kode Voucher (${code})`;
  }

  // 6. Special / General Promo
  if (lower.includes("spesial") || lower.includes("special")) {
    return isEn ? "Special Promo" : "Promo Spesial";
  }

  return name;
}

