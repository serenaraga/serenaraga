import { supabase } from "./supabase";
import { DEFAULT_BRAND_SETTINGS, type BrandSettings } from "./brand-settings-types";

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
