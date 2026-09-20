import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://jbnvxlwjffanqusfrhpk.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpibnZ4bHdqZmZhbnF1c2ZyaHBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxOTgyOTksImV4cCI6MjEwNDc3NDI5OX0.kNIuFJZJbKgWYeU0XsGcxV1hWiU2Ix4bZG7UCVCr1Us";

// Global singleton to prevent multiple GoTrueClient instances in the same browser context
declare global {
  var __supabase_client: SupabaseClient<any, any, any> | undefined;
}

export const supabase: SupabaseClient<any, any, any> =
  globalThis.__supabase_client ||
  createClient<any>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

if (typeof window !== "undefined") {
  globalThis.__supabase_client = supabase;
}
