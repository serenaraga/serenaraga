"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale/id";
import { enUS as localeEn } from "date-fns/locale/en-US";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

import {
  type BrandSettings,
  type FeaturedServiceCard,
  DEFAULT_FEATURED_SERVICES,
  DEFAULT_BRAND_SETTINGS,
} from "./brand-settings-types";

export {
  type BrandSettings,
  type FeaturedServiceCard,
  DEFAULT_FEATURED_SERVICES,
  DEFAULT_BRAND_SETTINGS,
};

const STORAGE_KEY = "serenaraga_brand_settings";

/**
 * Normalize any escaped newlines (e.g. literal "\\n" or "\\r\\n") into actual line breaks
 */
export function normalizeTemplateNewlines(text?: string | null): string {
  if (!text) return "";
  return text.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\\r/g, "\r");
}

/**
 * Sanitize and normalize brand settings object, ensuring all multiline templates have true linebreaks
 */
export function normalizeBrandSettings(raw?: Partial<BrandSettings> | null): BrandSettings {
  if (!raw) return { ...DEFAULT_BRAND_SETTINGS };
  const merged: BrandSettings = {
    ...DEFAULT_BRAND_SETTINGS,
    ...raw,
  };

  if (merged.wa_invoice_message_template) {
    merged.wa_invoice_message_template = normalizeTemplateNewlines(merged.wa_invoice_message_template);
  }
  if (merged.wa_booking_message_template) {
    merged.wa_booking_message_template = normalizeTemplateNewlines(merged.wa_booking_message_template);
  }
  if (merged.wa_service_book_message_template) {
    merged.wa_service_book_message_template = normalizeTemplateNewlines(merged.wa_service_book_message_template);
  }
  if (merged.wa_support_default_message) {
    merged.wa_support_default_message = normalizeTemplateNewlines(merged.wa_support_default_message);
  }
  if (merged.wa_crm_reminder_template) {
    merged.wa_crm_reminder_template = normalizeTemplateNewlines(merged.wa_crm_reminder_template);
  }
  if (merged.wa_crm_promo_template) {
    merged.wa_crm_promo_template = normalizeTemplateNewlines(merged.wa_crm_promo_template);
  }
  return merged;
}

/**
 * Standardize any phone number input to clean E.164-style '+628...' format (e.g. +6281234567890).
 * Handles inputs like:
 * - '08123456789' -> '+628123456789'
 * - '628123456789' -> '+628123456789'
 * - '+628123456789' -> '+628123456789'
 * - '8123456789' -> '+628123456789'
 * - '+62 812-3456-789' -> '+628123456789'
 * - '+65 9123 4567' -> '+6591234567'
 */
export function standardizePhoneNumber(phone?: string | null): string {
  if (!phone) return "";
  const raw = String(phone).trim();
  if (!raw) return "";

  // If phone explicitly starts with '+' (e.g. international code like +65 or already +62)
  if (raw.startsWith("+")) {
    const digitsOnly = raw.replace(/[^\d]/g, "");
    if (digitsOnly.startsWith("0")) {
      return "+62" + digitsOnly.replace(/^0+/, "");
    }
    return `+${digitsOnly}`;
  }

  // Remove any non-digit characters (spaces, dashes, parentheses)
  let digits = raw.replace(/[^\d]/g, "");
  if (!digits) return "";

  if (digits.startsWith("0")) {
    digits = digits.replace(/^0+/, "");
    return `+62${digits}`;
  }
  if (digits.startsWith("62")) {
    return `+${digits}`;
  }
  if (digits.startsWith("8")) {
    return `+62${digits}`;
  }

  // Default prefix +62
  return `+62${digits}`;
}

/**
 * Format raw phone number into clean WhatsApp format (digits only, e.g. 6289518359037)
 */
export function cleanWhatsAppNumber(phone?: string | null): string {
  if (!phone) return "6289518359037";
  const standardized = standardizePhoneNumber(phone);
  const digitsOnly = standardized.replace(/[^\d]/g, "");
  return digitsOnly || "6289518359037";
}

/**
 * Formats a phone number for display (e.g. +62 895-1835-9037)
 */
export function formatDisplayPhone(phone?: string): string {
  if (!phone) return "+62 895-1835-9037";
  const cleaned = cleanWhatsAppNumber(phone);
  if (cleaned.startsWith("62")) {
    const rest = cleaned.slice(2);
    if (rest.length >= 8) {
      if (rest.length === 11) {
        return `+62 ${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7)}`;
      } else if (rest.length === 10) {
        return `+62 ${rest.slice(0, 3)}-${rest.slice(3, 6)}-${rest.slice(6)}`;
      }
      return `+62 ${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7)}`;
    }
    return `+62 ${rest}`;
  }
  return phone.startsWith("+") ? phone : `+62 ${phone}`;
}

/**
 * Generate a wa.me URL
 */
export function getWhatsAppUrl(phone: string, text?: string): string {
  const cleanPhone = cleanWhatsAppNumber(phone);
  if (text) {
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }
  return `https://wa.me/${cleanPhone}`;
}

/**
 * Generate a valid Instagram URL
 */
export function getInstagramUrl(handleOrUrl?: string): string {
  if (!handleOrUrl || !handleOrUrl.trim()) return "";
  const trimmed = handleOrUrl.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const clean = trimmed.replace(/^@/, "").trim();
  return clean ? `https://instagram.com/${clean}` : "";
}

/**
 * Generate a valid TikTok URL
 */
export function getTikTokUrl(handleOrUrl?: string): string {
  if (!handleOrUrl || !handleOrUrl.trim()) return "";
  const trimmed = handleOrUrl.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const clean = trimmed.replace(/^@/, "").trim();
  return clean ? `https://tiktok.com/@${clean}` : "";
}

/**
 * Generate a valid Facebook URL
 */
export function getFacebookUrl(urlOrName?: string): string {
  if (!urlOrName || !urlOrName.trim()) return "";
  const trimmed = urlOrName.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const clean = trimmed.replace(/^\//, "").trim();
  return clean ? `https://facebook.com/${clean}` : "";
}

/**
 * Generate a valid Threads URL
 */
export function getThreadsUrl(handleOrUrl?: string): string {
  if (!handleOrUrl || !handleOrUrl.trim()) return "";
  const trimmed = handleOrUrl.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const clean = trimmed.replace(/^@/, "").trim();
  return clean ? `https://threads.net/@${clean}` : "";
}

/**
 * Generate inbound customer message based on default setting template from dashboard
 */
export function buildWhatsAppInboundMessage({
  template,
  brandName,
  serviceName,
  durationText,
  priceText,
  isEn,
}: {
  template?: string;
  brandName?: string;
  serviceName?: string;
  durationText?: string;
  priceText?: string;
  isEn?: boolean;
}): string {
  const brand = brandName || "Serena Raga";

  if (template && template.trim()) {
    return template
      .replace(/\{brand_name\}/gi, brand)
      .replace(/\{brand\}/gi, brand)
      .replace(/\{service_name\}/gi, serviceName || "")
      .replace(/\{service\}/gi, serviceName || "")
      .replace(/\{duration\}/gi, durationText || "")
      .replace(/\{price\}/gi, priceText || "");
  }

  if (serviceName) {
    return isEn
      ? `Hello ${brand}, I would like to book the *${serviceName}* treatment. Could you please let me know therapist availability and next steps? Thank you!`
      : `Halo ${brand}, saya ingin memesan layanan *${serviceName}*. Mohon info ketersediaan jadwal terapis untuk lokasi saya. Terima kasih!`;
  }

  return isEn
    ? `Hello ${brand}, I would like to inquire about your home massage & spa services. Could you please help?`
    : `Halo ${brand}, saya ingin tanya mengenai layanan home massage & spa. Bisa bantu informasinya?`;
}

/**
 * Generate inbound booking message specifically for services catalog "Book Treatment" buttons
 */
export function buildWhatsAppServiceBookingMessage({
  template,
  brandName,
  serviceName,
  detailTreatment,
  durationText,
  priceText,
}: {
  template?: string;
  brandName?: string;
  serviceName: string;
  detailTreatment?: string | null;
  durationText?: string;
  priceText?: string;
}): string {
  const brand = brandName || "Serena Raga";
  const detail = detailTreatment?.trim() || durationText || "-";

  const defaultTemplate =
    "Halo {brand_name}, saya ingin memesan layanan pijat:\n\n✨ Treatment: *{service_name}*\n💆🏻‍♀️ Detail Treatment: *{detail_treatment}*\n💵 Tarif: *{price}*\n\nMohon info ketersediaan jadwal terapis untuk lokasi saya. Terima kasih!";

  const targetTemplate = normalizeTemplateNewlines(
    template && template.trim() ? template : defaultTemplate
  );

  return targetTemplate
    .replace(/\{brand_name\}/gi, brand)
    .replace(/\{brand\}/gi, brand)
    .replace(/\{service_name\}/gi, serviceName)
    .replace(/\{service\}/gi, serviceName)
    .replace(/\{detail_treatment\}/gi, detail)
    .replace(/\{description\}/gi, detail)
    .replace(/\{detail\}/gi, detail)
    .replace(/\{duration\}/gi, durationText || "")
    .replace(/\{price\}/gi, priceText || "");
}

/**
 * Generate outbound reminder booking message for customer
 */
export function buildWhatsAppBookingReminderMessage({
  template,
  customerName,
  brandName,
  serviceName,
  bookingDate,
  bookingTime,
  serviceAddress,
  therapistName,
}: {
  template?: string;
  customerName?: string;
  brandName?: string;
  serviceName?: string;
  bookingDate?: string;
  bookingTime?: string;
  serviceAddress?: string;
  therapistName?: string;
}): string {
  const brand = brandName || "Serena Raga";
  const customer = customerName || "Pelanggan";
  const service = serviceName || "-";
  const date = bookingDate || "-";
  const rawTime = bookingTime || "-";
  const time = rawTime.replace(/\s*WIB/gi, "").trim();
  const address = serviceAddress || "-";
  const therapist = therapistName || "-";

  const defaultTemplate =
    "Halo {customer_name}, reminder booking {brand_name}:\n📅 {booking_date} pukul {booking_time} WIB\n💆 {service_name}\n📍 {service_address}\n💆🏻‍♀️ Terapis: {therapist_name}\n\nTerima kasih telah mempercayakan relaksasi Anda kepada kami! 🙏";

  const targetTemplate = normalizeTemplateNewlines(
    template && template.trim() ? template : defaultTemplate
  );

  return targetTemplate
    .replace(/\{customer_name\}/gi, customer)
    .replace(/\{customer\}/gi, customer)
    .replace(/\{brand_name\}/gi, brand)
    .replace(/\{brand\}/gi, brand)
    .replace(/\{service_name\}/gi, service)
    .replace(/\{service\}/gi, service)
    .replace(/\{booking_date\}/gi, date)
    .replace(/\{date\}/gi, date)
    .replace(/\{booking_time\}/gi, time)
    .replace(/\{time\}/gi, time)
    .replace(/\{service_address\}/gi, address)
    .replace(/\{address\}/gi, address)
    .replace(/\{therapist_name\}/gi, therapist)
    .replace(/\{therapist\}/gi, therapist);
}

/**
 * Direct action to open WhatsApp with custom booking reminder message
 */
export async function sendBookingWhatsAppReminder(
  booking: any,
  brandSettings?: BrandSettings,
  isEn?: boolean
) {
  if (!booking) return;

  const settings = brandSettings || getCachedBrandSettings();

  // 1. Resolve customer
  let customerName = booking.customers?.full_name || booking.customer_name;
  let customerPhone = booking.customers?.phone || booking.customer_phone;
  let customerAddress = booking.customers?.address || booking.customer_address;

  // 2. Resolve service
  let serviceName = booking.services?.name || booking.service_name;

  // 3. Resolve therapist
  let therapistName = booking.therapists?.name || booking.therapist_name;

  // If any relation is missing, fetch from Supabase in parallel
  const fetches: PromiseLike<any>[] = [];
  if (!customerPhone && booking.customer_id) {
    fetches.push(
      supabase
        .from("customers")
        .select("full_name, phone, address")
        .eq("id", booking.customer_id)
        .maybeSingle()
        .then(({ data }: any) => {
          if (data) {
            customerName = customerName || data.full_name;
            customerPhone = customerPhone || data.phone;
            customerAddress = customerAddress || data.address;
          }
        })
    );
  }
  if (!serviceName && booking.service_id) {
    fetches.push(
      supabase
        .from("services")
        .select("name")
        .eq("id", booking.service_id)
        .maybeSingle()
        .then(({ data }: any) => {
          if (data?.name) serviceName = data.name;
        })
    );
  }
  if (!therapistName && booking.therapist_id) {
    fetches.push(
      supabase
        .from("therapists")
        .select("name")
        .eq("id", booking.therapist_id)
        .maybeSingle()
        .then(({ data }: any) => {
          if (data?.name) therapistName = data.name;
        })
    );
  }

  if (fetches.length > 0) {
    try {
      await Promise.all(fetches);
    } catch (e) {
      console.warn("Error fetching relational data for WA reminder:", e);
    }
  }

  // Multi-item / couple therapist check from special_requests or relational_items if available
  if (booking.special_requests) {
    try {
      const trimmed = String(booking.special_requests).trim();
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed.items) && parsed.items.length > 0) {
          const names = parsed.items.map((it: any) => it.therapist).filter(Boolean);
          if (names.length > 0) {
            therapistName = Array.from(new Set(names)).join(", ");
          }
        }
      }
    } catch (e) {}
  }

  if (!customerPhone) {
    toast.error(
      isEn
        ? "Customer phone number is not available."
        : "Nomor WhatsApp pelanggan belum terdaftar."
    );
    return;
  }

  // Format date
  let formattedDate = booking.booking_date || "-";
  if (booking.booking_date) {
    try {
      formattedDate = format(new Date(booking.booking_date), "d MMM yyyy", {
        locale: isEn ? localeEn : localeId,
      });
    } catch (e) {}
  }

  const cleanPhone = cleanWhatsAppNumber(customerPhone);
  const message = buildWhatsAppBookingReminderMessage({
    template: settings.wa_booking_message_template,
    customerName: customerName || (isEn ? "Customer" : "Pelanggan"),
    brandName: settings.brand_name || "Serena Raga",
    serviceName: serviceName || (isEn ? "Massage Service" : "Layanan Treatment"),
    bookingDate: formattedDate,
    bookingTime: booking.booking_time
      ? String(booking.booking_time).replace(/\s*WIB/i, "").trim()
      : "-",
    serviceAddress: booking.service_address || customerAddress || "-",
    therapistName: therapistName || "-",
  });

  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
  toast.success(
    isEn
      ? "Opening WhatsApp chat with booking reminder..."
      : "Membuka WhatsApp untuk mengirim reminder booking..."
  );
}

/**
 * Generate outbound CRM routine relaxation reminder message
 */
export function buildWhatsAppCrmReminderMessage({
  template,
  customerName,
  brandName,
  favoriteService,
  favoriteTherapist,
  lastOrderDate,
  daysAgo,
  promoCode,
  discountValue,
}: {
  template?: string;
  customerName?: string;
  brandName?: string;
  favoriteService?: string;
  favoriteTherapist?: string;
  lastOrderDate?: string;
  daysAgo?: string;
  promoCode?: string;
  discountValue?: string;
}): string {
  const brand = brandName || "Serena Raga";
  const customer = customerName || "Pelanggan";
  const service = favoriteService || "Traditional Body Massage";
  const therapist = favoriteTherapist || "terapis profesional kami";
  const lastDate = lastOrderDate || "-";
  const days = daysAgo || "beberapa waktu";
  const code = promoCode || "WELCOMEBACK";
  const discount = discountValue || "10%";

  const defaultTemplate =
    "Halo Kak {customer_name}, apa kabar? 🤎\n\nSudah {days_ago} sejak treatment terakhir Kakak bersama *{brand_name}*. Tubuh yang lelah butuh dimanjakan kembali dengan treatment favorit Kakak *{favorite_service}* bersama terapis *{favorite_therapist}*.\n\nKami ada penawaran spesial promo voucher *{promo_code}* diskon *{discount_value}* untuk Kakak ✨\n\nApakah ingin kami jadwalkan sesi pijat nyaman di rumah hari ini atau besok? Silakan balas pesan WhatsApp ini untuk reservasi ya! 🙏";

  const targetTemplate = normalizeTemplateNewlines(
    template && template.trim() ? template : defaultTemplate
  );

  return targetTemplate
    .replace(/\{customer_name\}/gi, customer)
    .replace(/\{customer\}/gi, customer)
    .replace(/\{brand_name\}/gi, brand)
    .replace(/\{brand\}/gi, brand)
    .replace(/\{days_ago\}/gi, days)
    .replace(/\{days_since_last_order\}/gi, days)
    .replace(/\{promo_code\}/gi, code)
    .replace(/\{discount_value\}/gi, discount)
    .replace(/\{favorite_service\}/gi, service)
    .replace(/\{service_name\}/gi, service)
    .replace(/\{favorite_therapist\}/gi, therapist)
    .replace(/\{therapist_name\}/gi, therapist)
    .replace(/\{last_order_date\}/gi, lastDate);
}

/**
 * Generate outbound CRM loyalty promo / voucher message
 */
export function buildWhatsAppCrmPromoMessage({
  template,
  customerName,
  brandName,
  promoCode,
  discountValue,
}: {
  template?: string;
  customerName?: string;
  brandName?: string;
  promoCode?: string;
  discountValue?: string;
}): string {
  const brand = brandName || "Serena Raga";
  const customer = customerName || "Pelanggan";
  const code = promoCode || "LOYAL10";
  const discount = discountValue || "10% OFF";

  const defaultTemplate =
    "Halo Kak {customer_name}! ✨\n\nSebagai apresiasi atas kesetiaan Kakak di *{brand_name}*, kami memberikan penawaran spesial voucher *{promo_code}* diskon *{discount_value}* untuk pemesanan treatment Kakak berikutnya.\n\nKlaim voucher ini sekarang dengan membalas pesan WhatsApp ini ya. Terima kasih telah mempercayakan relaksasi Kakak kepada kami! 💆🏻‍♀️🤎";

  const targetTemplate = normalizeTemplateNewlines(
    template && template.trim() ? template : defaultTemplate
  );

  return targetTemplate
    .replace(/\{customer_name\}/gi, customer)
    .replace(/\{customer\}/gi, customer)
    .replace(/\{brand_name\}/gi, brand)
    .replace(/\{brand\}/gi, brand)
    .replace(/\{promo_code\}/gi, code)
    .replace(/\{discount_value\}/gi, discount);
}

/**
 * Direct action to open WhatsApp with CRM routine reminder
 */
export function sendCrmWhatsAppReminder({
  customer,
  metrics,
  promoCode,
  discountValue,
  brandSettings,
  isEn,
}: {
  customer: any;
  metrics: any;
  promoCode?: string;
  discountValue?: string;
  brandSettings?: BrandSettings;
  isEn?: boolean;
}) {
  if (!customer?.phone) {
    toast.error(
      isEn
        ? "Customer phone number is not available."
        : "Nomor WhatsApp pelanggan belum terdaftar."
    );
    return;
  }

  const settings = brandSettings || getCachedBrandSettings();
  const cleanPhone = cleanWhatsAppNumber(customer.phone);

  let formattedLastDate = "-";
  if (metrics.lastOrderDate) {
    try {
      formattedLastDate = format(new Date(metrics.lastOrderDate), "d MMMM yyyy", {
        locale: isEn ? localeEn : localeId,
      });
    } catch (e) {}
  }

  const daysAgoText =
    metrics.daysSinceLastOrder !== null && metrics.daysSinceLastOrder !== undefined
      ? isEn
        ? `${metrics.daysSinceLastOrder} days`
        : `${metrics.daysSinceLastOrder} hari`
      : isEn
      ? "a while"
      : "beberapa waktu";

  const message = buildWhatsAppCrmReminderMessage({
    template: settings.wa_crm_reminder_template,
    customerName: customer.full_name || (isEn ? "Customer" : "Pelanggan"),
    brandName: settings.brand_name || "Serena Raga",
    favoriteService: metrics.favoriteService || (isEn ? "Traditional Body Massage" : "Pijat Tradisional"),
    favoriteTherapist: metrics.favoriteTherapist || (isEn ? "our top therapist" : "terapis terbaik kami"),
    lastOrderDate: formattedLastDate,
    daysAgo: daysAgoText,
    promoCode: promoCode || "WELCOMEBACK",
    discountValue: discountValue || "10%",
  });

  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
  toast.success(
    isEn
      ? "Opening WhatsApp with CRM relaxation reminder..."
      : "Membuka WhatsApp untuk mengirim reminder relaksasi CRM..."
  );
}

/**
 * Direct action to open WhatsApp with CRM loyalty voucher offer
 */
export function sendCrmWhatsAppPromo({
  customer,
  promoCode,
  discountValue,
  brandSettings,
  isEn,
}: {
  customer: any;
  promoCode?: string;
  discountValue?: string;
  brandSettings?: BrandSettings;
  isEn?: boolean;
}) {
  if (!customer?.phone) {
    toast.error(
      isEn
        ? "Customer phone number is not available."
        : "Nomor WhatsApp pelanggan belum terdaftar."
    );
    return;
  }

  const settings = brandSettings || getCachedBrandSettings();
  const cleanPhone = cleanWhatsAppNumber(customer.phone);

  const message = buildWhatsAppCrmPromoMessage({
    template: settings.wa_crm_promo_template,
    customerName: customer.full_name || (isEn ? "Customer" : "Pelanggan"),
    brandName: settings.brand_name || "Serena Raga",
    promoCode: promoCode || "LOYAL10",
    discountValue: discountValue || "10% OFF",
  });

  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
  toast.success(
    isEn
      ? "Opening WhatsApp with CRM loyalty promo..."
      : "Membuka WhatsApp untuk mengirim penawaran promo CRM..."
  );
}

/**
 * Get brand settings synchronously from cache/localStorage with fallback to defaults
 */
export function getCachedBrandSettings(): BrandSettings {
  if (typeof window === "undefined") {
    return normalizeBrandSettings(DEFAULT_BRAND_SETTINGS);
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return normalizeBrandSettings({ ...DEFAULT_BRAND_SETTINGS, ...parsed });
    }
  } catch (e) {
    // Ignore storage parse errors
  }
  return normalizeBrandSettings(DEFAULT_BRAND_SETTINGS);
}

/**
 * Save brand settings to Supabase and update local state
 */
export async function saveBrandSettings(
  newSettings: BrandSettings
): Promise<{ success: boolean; error?: any }> {
  try {
    // 1. Determine target row id from Supabase
    let targetId = 1;
    try {
      const { data: existing } = await supabase
        .from("brand_settings")
        .select("id")
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (existing?.id) {
        targetId = existing.id;
      }
    } catch (e) {
      console.warn("Could not query existing brand_settings row id:", e);
    }

    // 2. Persist directly to Supabase brand_settings table
    // Sanitize payload to only persist standard database schema columns
    const payload: any = { ...newSettings };
    delete payload.featured_services;

    let { data, error } = await supabase
      .from("brand_settings")
      .upsert(
        { id: targetId, ...payload, updated_at: new Date().toISOString() },
        { onConflict: "id" }
      )
      .select()
      .maybeSingle();

    if (error && (error.code === "PGRST204" || error.message?.includes("schema cache") || error.message?.includes("column"))) {
      console.warn("Supabase schema cache does not have new CRM columns yet. Stripping CRM columns from SQL upsert and caching locally:", error.message);
      const safePayload = { ...payload };
      delete safePayload.wa_crm_reminder_template;
      delete safePayload.wa_crm_promo_template;

      const fallbackRes = await supabase
        .from("brand_settings")
        .upsert(
          { id: targetId, ...safePayload, updated_at: new Date().toISOString() },
          { onConflict: "id" }
        )
        .select()
        .maybeSingle();

      if (!fallbackRes.error) {
        data = fallbackRes.data;
        error = null;
      }
    }

    if (error) {
      console.error("Supabase brand_settings save error:", error);
      return { success: false, error };
    }

    const savedData: BrandSettings = normalizeBrandSettings({
      ...newSettings,
      ...(data as Partial<BrandSettings> || {}),
    });

    // 3. Update localStorage and broadcast
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));
      } catch {}
      window.dispatchEvent(
        new CustomEvent("brand_settings_updated", { detail: savedData })
      );
      try {
        const bc = new BroadcastChannel("brand_settings_channel");
        bc.postMessage(savedData);
        bc.close();
      } catch {}
    }

    setGlobalBrandSettings(savedData);

    return { success: true };
  } catch (err) {
    console.error("saveBrandSettings exception:", err);
    return { success: false, error: err };
  }
}

/**
 * Fetch latest brand settings directly on server for SSR / instant pre-render without flash
 */
export async function fetchBrandSettingsServer(): Promise<BrandSettings> {
  try {
    const { data, error } = await supabase
      .from("brand_settings")
      .select("*")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return normalizeBrandSettings({
        ...DEFAULT_BRAND_SETTINGS,
        ...data,
      });
    }
  } catch (e) {
    console.warn("fetchBrandSettingsServer error:", e);
  }
  return normalizeBrandSettings(DEFAULT_BRAND_SETTINGS);
}

// In-memory singleton store for BrandSettings across the entire app
let currentSettings: BrandSettings = getCachedBrandSettings();
let isInitialized = false;
let initPromise: Promise<void> | null = null;
const subscribers = new Set<() => void>();
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
let listenersAttached = false;

function notifySubscribers() {
  subscribers.forEach((cb) => {
    try {
      cb();
    } catch {}
  });
}

function areSettingsEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

export function setGlobalBrandSettings(next: Partial<BrandSettings> | null | undefined) {
  if (!next) return;

  const candidate: BrandSettings = normalizeBrandSettings({
    ...currentSettings,
    ...next,
  });

  // Skip update if there is no actual change in content
  if (areSettingsEqual(currentSettings, candidate)) {
    return;
  }

  currentSettings = candidate;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings));
    } catch {}
  }
  notifySubscribers();
}

async function initGlobalBrandSettings(): Promise<void> {
  if (typeof window === "undefined") return;
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const { data, error } = await supabase
        .from("brand_settings")
        .select("*")
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        // Direct merge: DB data is source of truth, defaults only fill missing fields
        const merged: BrandSettings = normalizeBrandSettings({
          ...DEFAULT_BRAND_SETTINGS,
          ...data,
        });
        setGlobalBrandSettings(merged);
      }
    } catch (e) {
      console.error("Failed to load brand_settings from database:", e);
    } finally {
      isInitialized = true;
      initPromise = null;
    }

    // Attach single realtime channel and window listeners once
    if (!listenersAttached && typeof window !== "undefined") {
      listenersAttached = true;

      // 1. Single Supabase Realtime channel
      if (!realtimeChannel) {
        try {
          const channels = supabase.getChannels();
          const existing = channels.find(
            (c) => c.topic === "realtime:sr_brand_settings_global_bus"
          );
          if (existing) {
            supabase.removeChannel(existing);
          }
        } catch (e) {}

        const channel = supabase.channel("sr_brand_settings_global_bus");
        realtimeChannel = channel
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "brand_settings" },
            (payload: any) => {
              if (payload.new) {
                setGlobalBrandSettings(payload.new);
              }
            }
          )
          .subscribe();
      }

      // 2. Custom local event listener
      window.addEventListener("brand_settings_updated", (e: any) => {
        if (e.detail) {
          setGlobalBrandSettings(e.detail);
        }
      });

      // 3. Storage event listener for multi-tab sync
      window.addEventListener("storage", (e: StorageEvent) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            setGlobalBrandSettings(parsed);
          } catch {}
        }
      });

      // 4. BroadcastChannel listener
      try {
        const bc = new BroadcastChannel("brand_settings_channel");
        bc.onmessage = (e) => {
          if (e.data) {
            setGlobalBrandSettings(e.data);
          }
        };
      } catch {}
    }
  })();

  return initPromise;
}

function subscribeBrandSettings(callback: () => void) {
  subscribers.add(callback);
  initGlobalBrandSettings();
  return () => {
    subscribers.delete(callback);
  };
}

function getBrandSettingsSnapshot(): BrandSettings {
  return currentSettings;
}

function getBrandSettingsServerSnapshot(): BrandSettings {
  return currentSettings || DEFAULT_BRAND_SETTINGS;
}

/**
 * React Hook for consuming Brand Settings throughout the application.
 * Uses a singleton external store with useSyncExternalStore to eliminate redundant
 * network requests, duplicate Realtime channels, and event listener leaks.
 */
export function useBrandSettings(initialSettings?: BrandSettings) {
  if (initialSettings && !areSettingsEqual(currentSettings, initialSettings)) {
    currentSettings = {
      ...currentSettings,
      ...initialSettings,
    };
  }

  const settings = useSyncExternalStore(
    subscribeBrandSettings,
    getBrandSettingsSnapshot,
    getBrandSettingsServerSnapshot
  );

  const [loading, setLoading] = useState<boolean>(!isInitialized);

  useEffect(() => {
    if (initialSettings) {
      setGlobalBrandSettings(initialSettings);
    }
  }, [initialSettings]);

  useEffect(() => {
    let mounted = true;
    if (isInitialized) {
      setLoading(false);
    } else {
      initGlobalBrandSettings().then(() => {
        if (mounted) setLoading(false);
      });
    }
    return () => {
      mounted = false;
    };
  }, []);

  const updateSettings = useCallback(async (newSettings: BrandSettings) => {
    setGlobalBrandSettings(newSettings);
    return await saveBrandSettings(newSettings);
  }, []);

  const resetToDefault = useCallback(async () => {
    setGlobalBrandSettings(DEFAULT_BRAND_SETTINGS);
    return await saveBrandSettings(DEFAULT_BRAND_SETTINGS);
  }, []);

  const adminWhatsAppUrl = useCallback(
    (customText?: string) => {
      const text =
        customText ||
        settings.wa_support_default_message.replace(
          /\{brand_name\}/g,
          settings.brand_name
        );
      return getWhatsAppUrl(settings.whatsapp_number, text);
    },
    [settings]
  );

  return {
    settings,
    loading,
    updateSettings,
    resetToDefault,
    cleanWhatsAppNumber: cleanWhatsAppNumber(settings.whatsapp_number),
    formattedPhone: formatDisplayPhone(settings.whatsapp_number),
    adminWhatsAppUrl,
  };
}
