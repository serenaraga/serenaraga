"use client";

import { useState, useEffect, useCallback } from "react";
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
  invoice_footer_note: string;
  invoice_support_text: string;
  wa_invoice_message_template: string;
  wa_booking_message_template: string;
  wa_support_default_message: string;
}

export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  brand_name: "Serena Raga",
  tagline: "Comfortable Home Massage & Spa",
  description:
    "Layanan terapis pijat dan spa profesional langsung ke rumah, hotel, dan apartemen Anda.",
  whatsapp_number: "6289518359037",
  phone_number: "+62 895-1835-9037",
  email: "support@serenaraga.com",
  website_url: "https://serenaraga.com",
  instagram_handle: "@serenaraga",
  tiktok_handle: "@serenaraga",
  facebook_url: "https://facebook.com/serenaraga",
  threads_handle: "@serenaraga",
  operational_hours: "08:00 - 22:00 WIB (Setiap Hari)",
  service_areas: "Yogyakarta, Sleman, Bantul, & Sekitarnya",
  bank_name: "BCA (Bank Central Asia)",
  bank_account_number: "8720-1928-33",
  bank_account_holder: "PT Serena Raga Indonesia",
  qris_image_url: "",
  invoice_footer_note:
    "Terima kasih telah mempercayakan relaksasi Anda pada Serena Raga.",
  invoice_support_text:
    "Dokumen ini merupakan bukti transaksi resmi. Layanan pelanggan WhatsApp {whatsapp}.",
  wa_invoice_message_template:
    "Halo {customer_name},\n\nTerima kasih telah menggunakan layanan *{brand_name}* ({service_name}).\nBerikut adalah rincian nota & invoice resmi Anda:\n\n📄 *No. Invoice:* {invoice_number}\n💰 *Total Tagihan:* {total_amount}\n📅 *Jadwal:* {booking_date} jam {booking_time}\n💳 *Status:* {payment_status}\n\n🔗 *Lihat Nota Digital:* {invoice_url}\n\nJika ada pertanyaan, silakan hubungi kami via WhatsApp ini.",
  wa_booking_message_template:
    "Halo {customer_name},\n\nPesanan *{service_name}* di *{brand_name}* Anda telah dikonfirmasi!\n\n📅 *Tanggal:* {booking_date}\n⏰ *Jam:* {booking_time}\n📍 *Alamat:* {address}\n💆 *Terapis:* {therapist_name}\n\nMohon bersiap 10 menit sebelum waktu pelayanan.",
  wa_support_default_message:
    "Halo Customer Service {brand_name}, saya butuh bantuan mengenai layanan / nota saya.",
};

const STORAGE_KEY = "serenaraga_brand_settings";

/**
 * Format raw phone number into clean WhatsApp format (digits only, e.g. 6289518359037)
 */
export function cleanWhatsAppNumber(phone?: string): string {
  if (!phone) return "6289518359037";
  let cleaned = phone.replace(/[^\d]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  } else if (cleaned.startsWith("8")) {
    cleaned = "62" + cleaned;
  }
  return cleaned || "6289518359037";
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
  if (!handleOrUrl) return "https://instagram.com/serenaraga";
  if (handleOrUrl.startsWith("http://") || handleOrUrl.startsWith("https://")) {
    return handleOrUrl;
  }
  const clean = handleOrUrl.replace(/^@/, "").trim();
  return `https://instagram.com/${clean || "serenaraga"}`;
}

/**
 * Generate a valid TikTok URL
 */
export function getTikTokUrl(handleOrUrl?: string): string {
  if (!handleOrUrl) return "https://tiktok.com/@serenaraga";
  if (handleOrUrl.startsWith("http://") || handleOrUrl.startsWith("https://")) {
    return handleOrUrl;
  }
  const clean = handleOrUrl.replace(/^@/, "").trim();
  return `https://tiktok.com/@${clean || "serenaraga"}`;
}

/**
 * Generate a valid Facebook URL
 */
export function getFacebookUrl(urlOrName?: string): string {
  if (!urlOrName) return "https://facebook.com/serenaraga";
  if (urlOrName.startsWith("http://") || urlOrName.startsWith("https://")) {
    return urlOrName;
  }
  const clean = urlOrName.replace(/^\//, "").trim();
  return `https://facebook.com/${clean || "serenaraga"}`;
}

/**
 * Generate a valid Threads URL
 */
export function getThreadsUrl(handleOrUrl?: string): string {
  if (!handleOrUrl) return "https://threads.net/@serenaraga";
  if (handleOrUrl.startsWith("http://") || handleOrUrl.startsWith("https://")) {
    return handleOrUrl;
  }
  const clean = handleOrUrl.replace(/^@/, "").trim();
  return `https://threads.net/@${clean || "serenaraga"}`;
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
 * Save brand settings to localStorage and optionally sync with Supabase
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
    }

    // Try persisting to Supabase if brand_settings table exists
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

/**
 * React Hook for consuming Brand Settings throughout the application
 */
export function useBrandSettings() {
  const [settings, setSettings] = useState<BrandSettings>(() => getCachedBrandSettings());
  const [loading, setLoading] = useState<boolean>(true);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Load from localStorage and sync with Supabase on mount
  useEffect(() => {
    let mounted = true;
    setIsMounted(true);

    async function loadRemoteSettings() {
      try {
        const { data, error } = await supabase
          .from("brand_settings")
          .select("*")
          .order("id", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (!error && data && mounted) {
          const merged: BrandSettings = {
            ...DEFAULT_BRAND_SETTINGS,
            ...data,
          };
          setSettings(merged);
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          }
        }
      } catch (e) {
        // Fallback to localStorage data
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadRemoteSettings();

    // Listen to local changes in the same window
    const handleLocalUpdate = (e: any) => {
      if (e.detail && mounted) {
        setSettings(e.detail);
      }
    };

    // Listen to storage events from other tabs/windows
    const handleStorageUpdate = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue && mounted) {
        try {
          const parsed = JSON.parse(e.newValue);
          setSettings({ ...DEFAULT_BRAND_SETTINGS, ...parsed });
        } catch (err) {}
      }
    };

    window.addEventListener("brand_settings_updated", handleLocalUpdate);
    window.addEventListener("storage", handleStorageUpdate);

    return () => {
      mounted = false;
      window.removeEventListener("brand_settings_updated", handleLocalUpdate);
      window.removeEventListener("storage", handleStorageUpdate);
    };
  }, []);

  const updateSettings = useCallback(async (newSettings: BrandSettings) => {
    setSettings(newSettings);
    return await saveBrandSettings(newSettings);
  }, []);

  const resetToDefault = useCallback(async () => {
    setSettings(DEFAULT_BRAND_SETTINGS);
    return await saveBrandSettings(DEFAULT_BRAND_SETTINGS);
  }, []);

  const adminWhatsAppUrl = (customText?: string) => {
    const text =
      customText ||
      settings.wa_support_default_message.replace(
        /\{brand_name\}/g,
        settings.brand_name
      );
    return getWhatsAppUrl(settings.whatsapp_number, text);
  };

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
