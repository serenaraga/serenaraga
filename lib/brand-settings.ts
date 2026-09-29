"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
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

  const targetTemplate = template && template.trim() ? template : defaultTemplate;

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

    const { data, error } = await supabase
      .from("brand_settings")
      .upsert(
        { id: targetId, ...payload, updated_at: new Date().toISOString() },
        { onConflict: "id" }
      )
      .select()
      .maybeSingle();

    if (error) {
      console.error("Supabase brand_settings save error:", error);
      return { success: false, error };
    }

    const savedData: BrandSettings = {
      ...newSettings,
      ...(data as Partial<BrandSettings> || {}),
    };

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
      return {
        ...DEFAULT_BRAND_SETTINGS,
        ...data,
      };
    }
  } catch (e) {
    console.warn("fetchBrandSettingsServer error:", e);
  }
  return DEFAULT_BRAND_SETTINGS;
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

  const candidate: BrandSettings = {
    ...currentSettings,
    ...next,
  };

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
        const merged: BrandSettings = {
          ...DEFAULT_BRAND_SETTINGS,
          ...data,
        };
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
