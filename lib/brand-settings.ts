"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase";

export interface BrandSettings {
  brand_name: string;
  tagline: string;
  description: string;
  whatsapp_number: string;
  phone_number: string;
  email: string;
  website_url: string;
  instagram_handle: string;
  tiktok_handle?: string;
  facebook_url?: string;
  threads_handle?: string;
  operational_hours: string;
  service_areas: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_holder: string;
  qris_image_url: string;
  qris_payload?: string;
  invoice_footer_note: string;
  invoice_support_text: string;
  wa_invoice_message_template: string;
  wa_booking_message_template: string;
  wa_support_default_message: string;
}

export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  brand_name: "Serena Raga",
  tagline: "Comfortable Home Massage",
  description:
    "Layanan pijat panggilan yang nyaman langsung ke rumah, hotel, dan apartemen Anda.",
  whatsapp_number: "6289518359037",
  phone_number: "+62 895-1835-9037",
  email: "ragaserena@gmail.com",
  website_url: "https://serenaraga.com",
  instagram_handle: "@serena.raga",
  tiktok_handle: "@serenaraga",
  facebook_url: "https://facebook.com/serenaraga",
  threads_handle: "@serena.raga",
  operational_hours: "08:00 - 22:00 WIB (Setiap Hari)",
  service_areas: "Yogyakarta, Sleman, Bantul, & Sekitarnya",
  bank_name: "BCA (Bank Central Asia)",
  bank_account_number: "8720-1928-33",
  bank_account_holder: "PT Serena Raga Indonesia",
  qris_image_url: "",
  qris_payload: "",
  invoice_footer_note:
    "Terima kasih telah mempercayakan relaksasi Anda pada Serena Raga.",
  invoice_support_text:
    "Dokumen ini merupakan bukti transaksi resmi. Layanan pelanggan WhatsApp {whatsapp}.",
  wa_invoice_message_template:
    "Halo {customer_name},\n\nTerima kasih telah menggunakan layanan *{brand_name} – {service_name}* 🤎\n\nBerikut rincian invoice {customer_name}:\n📄 No. Invoice: *{invoice_number}*\n📅 Jadwal: *{booking_date}, {booking_time} WIB*\n💰 Total: *{total_amount}*\n💳 Status: *{payment_status}*\n\n🧾 Nota digital:\n{invoice_url}\n\nSalam hangat,\n*{brand_name}*",
  wa_booking_message_template:
    "Halo {customer_name},\n\nPesanan *{service_name}* di *{brand_name}* Anda telah dikonfirmasi!\n\n📅 *Tanggal:* {booking_date}\n⏰ *Jam:* {booking_time}\n📍 *Alamat:* {address}\n💆 *Terapis:* {therapist_name}\n\nMohon bersiap 10 menit sebelum waktu pelayanan.",
  wa_support_default_message:
    "Halo Admin SerenaRaga! Saya ingin tanya layanan massage di rumah. Bisa bantu informasinya?",
};

const STORAGE_KEY = "serenaraga_brand_settings";

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
  isEn,
}: {
  template?: string;
  brandName?: string;
  serviceName?: string;
  isEn?: boolean;
}): string {
  const brand = brandName || "Serena Raga";

  if (template && template.trim()) {
    return template
      .replace(/\{brand_name\}/gi, brand)
      .replace(/\{brand\}/gi, brand);
  }

  return isEn
    ? `Hello ${brand}, I would like to inquire about your home massage & spa services. Could you please help?`
    : `Halo ${brand}, saya ingin tanya mengenai layanan home massage & spa. Bisa bantu informasinya?`;
}

/**
 * Get brand settings synchronously from cache/localStorage with fallback to defaults
 */
export function getCachedBrandSettings(): BrandSettings {
  if (typeof window === "undefined") {
    return DEFAULT_BRAND_SETTINGS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_BRAND_SETTINGS, ...parsed };
    }
  } catch (e) {
    // Ignore storage parse errors
  }
  return DEFAULT_BRAND_SETTINGS;
}

/**
 * Save brand settings to localStorage and sync with Supabase
 */
export async function saveBrandSettings(
  newSettings: BrandSettings
): Promise<{ success: boolean; error?: any }> {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      window.dispatchEvent(
        new CustomEvent("brand_settings_updated", { detail: newSettings })
      );
      try {
        const bc = new BroadcastChannel("brand_settings_channel");
        bc.postMessage(newSettings);
        bc.close();
      } catch (e) {
        // BroadcastChannel optional fallback
      }
    }

    // Persist all fields to Supabase brand_settings table
    try {
      const { error } = await supabase
        .from("brand_settings")
        .upsert(
          { id: 1, ...newSettings, updated_at: new Date().toISOString() },
          { onConflict: "id" }
        );
      if (error) {
        console.warn("Supabase brand_settings table sync notice:", error.message);
      }
    } catch (dbErr) {
      // Table may not exist yet in Supabase, localStorage fallback remains active
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err };
  }
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

function setGlobalBrandSettings(next: Partial<BrandSettings> | null | undefined) {
  if (!next) return;
  currentSettings = {
    ...currentSettings,
    ...next,
  };
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
        setGlobalBrandSettings(data);
      }
    } catch (e) {
      // Fallback to localStorage data
    } finally {
      isInitialized = true;
      initPromise = null;
    }

    // Attach single realtime channel and window listeners once
    if (!listenersAttached && typeof window !== "undefined") {
      listenersAttached = true;

      // 1. Single Supabase Realtime channel
      if (!realtimeChannel) {
        realtimeChannel = supabase
          .channel("sr_brand_settings_global_bus")
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

/**
 * React Hook for consuming Brand Settings throughout the application.
 * Uses a singleton external store with useSyncExternalStore to eliminate redundant
 * network requests, duplicate Realtime channels, and event listener leaks.
 */
export function useBrandSettings() {
  const settings = useSyncExternalStore(
    (callback) => {
      subscribers.add(callback);
      initGlobalBrandSettings();
      return () => {
        subscribers.delete(callback);
      };
    },
    () => currentSettings,
    () => DEFAULT_BRAND_SETTINGS
  );

  const [loading, setLoading] = useState<boolean>(!isInitialized);

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
