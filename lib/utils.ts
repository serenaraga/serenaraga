import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export { standardizePhoneNumber, cleanWhatsAppNumber } from "./brand-settings";

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

/**
 * Deduplicates comma/bullet-separated descriptions or array of strings.
 * Automatically merges identical reasons across multi-therapist item rows.
 * E.g. "charge vila, charge vila" -> "charge vila"
 * E.g. ["charge vila", "charge vila"] -> "charge vila"
 * E.g. ["charge vila", "extra scrub"] -> "charge vila, extra scrub"
 */
export function formatDeduplicatedDescription(
  input?: string | (string | undefined | null)[] | null
): string {
  if (!input) return "";
  let items: string[] = [];
  if (Array.isArray(input)) {
    items = input.flatMap((str) =>
      typeof str === "string" ? str.split(/[,•;]+/) : []
    );
  } else if (typeof input === "string") {
    items = input.split(/[,•;]+/);
  }

  const cleaned = items.map((s) => s.trim()).filter(Boolean);
  if (cleaned.length === 0) return "";

  // Case-insensitive deduplication preserving original casing of first occurrence
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const item of cleaned) {
    const key = item.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }

  return unique.join(", ");
}

/**
 * Checks whether a service is categorized as a Couple Package
 * (e.g. category contains 'couple' / 'pasangan', or name contains 'couple').
 */
export function isCoupleService(service: any): boolean {
  if (!service) return false;
  const category = String(service.category || "").toLowerCase();
  const name = String(service.name || "").toLowerCase();
  return (
    category.includes("couple") ||
    category.includes("pasangan") ||
    name.includes("couple") ||
    name.includes("berdua") ||
    name.includes("pasangan")
  );
}

/**
 * Generates a secure, unguessable public access token for customer invoice links (Midtrans/Stripe style)
 * Format: 'inv_' + 16 cryptographic random alphanumeric characters
 * Example: 'inv_k8X9pL2vM4qR1zW7'
 */
export interface InvoiceLineItem {
  name: string;
  price: number;
}

/**
 * Resolves itemized breakdown from metadata items, runtime invoice items,
 * composite service name (with " + "), or single fallback.
 */
export function resolveInvoiceLineItems(params: {
  meta?: any;
  items?: any[];
  serviceName?: string | null;
  subtotal?: number | null;
  totalAmount?: number | null;
  fallbackName?: string;
}): InvoiceLineItem[] {
  const { meta, items, serviceName, subtotal, totalAmount, fallbackName } = params;

  // 1. From metadata JSON items
  if (meta?.items && Array.isArray(meta.items) && meta.items.length > 0) {
    const grouped: InvoiceLineItem[] = [];
    const coupleMap = new Map<string, InvoiceLineItem>();

    for (const it of meta.items) {
      if (it.is_couple_package) {
        const key = it.parent_package_name || it.name;
        const existing = coupleMap.get(key);
        if (existing) {
          existing.price += Number(it.price || 0);
        } else {
          const entry = {
            name: key,
            price: Number(it.price || 0),
          };
          coupleMap.set(key, entry);
          grouped.push(entry);
        }
      } else {
        grouped.push({
          name: it.name || it.service_name || "Layanan",
          price: Number(it.price || 0),
        });
      }
    }
    return grouped;
  }

  // 2. From direct invoice items array if present in runtime
  if (Array.isArray(items) && items.length > 0) {
    const grouped: InvoiceLineItem[] = [];
    const coupleMap = new Map<string, InvoiceLineItem>();

    for (const it of items) {
      if (it.is_couple && it.therapist_mode === "couple_split") {
        const key = it.service_name || "Couple Package";
        const totalPrice = (Number(it.price) || 0) + (Number(it.secondary_price) || 0);
        grouped.push({
          name: key,
          price: totalPrice,
        });
      } else if (it.is_couple_package) {
        const key = it.parent_package_name || it.name;
        const existing = coupleMap.get(key);
        if (existing) {
          existing.price += Number(it.price || 0);
        } else {
          const entry = {
            name: key,
            price: Number(it.price || 0),
          };
          coupleMap.set(key, entry);
          grouped.push(entry);
        }
      } else {
        grouped.push({
          name: it.service_name || it.name || "Layanan",
          price: Number(it.price || 0),
        });
      }
    }
    return grouped;
  }

  // 3. From service_name containing " + " delimiter
  if (serviceName && serviceName.includes(" + ")) {
    const parts = serviceName.split(" + ").map((s) => s.trim()).filter(Boolean);
    if (parts.length > 1) {
      const sub = Number(subtotal || totalAmount || 0);
      const estPrice = Math.round(sub / parts.length);
      return parts.map((partName) => ({
        name: partName,
        price: estPrice,
      }));
    }
  }

  // 4. Single item fallback
  return [
    {
      name: serviceName || fallbackName || "Layanan Home Massage",
      price: Number(subtotal || totalAmount || 0),
    },
  ];
}

/**
 * Generates a secure, unguessable public access token for customer invoice links (Midtrans/Stripe style)
 * Format: 'inv_' + 16 cryptographic random alphanumeric characters
 * Example: 'inv_k8X9pL2vM4qR1zW7'
 */
export function generateInvoicePublicToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "inv_";
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < 16; i++) {
      token += chars[bytes[i] % chars.length];
    }
  } else {
    for (let i = 0; i < 16; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return token;
}

