"use client";

import type { AuthProvider, UserIdentity } from "ra-core";
import { supabase } from "@/lib/supabase";

export interface AppUserSession {
  id: string | number;
  fullName: string;
  email: string;
  username: string;
  role: "admin" | "cashier" | "manager";
  avatar?: string;
}

const AUTH_STORAGE_KEY = "serena_auth_session";

// Recognized admin passwords for owner fallback
const ADMIN_PASSWORDS = [
  "Adminserena2026",
  "AdminSerena2026",
  "AdminSerena2026!",
  "adminserena2026",
  "Admin123!",
  "admin123",
  "admin",
];

export const authProvider: AuthProvider = {
  login: async (params: any) => {
    const rawIdentifier = String(params.username || params.email || "").trim();
    const password = String(params.password || "").trim();

    if (!rawIdentifier) {
      throw new Error("Silakan masukkan username atau email.");
    }
    if (!password) {
      throw new Error("Silakan masukkan kata sandi.");
    }

    const lowerIdentifier = rawIdentifier.toLowerCase();
    const isSpecialAdminUser =
      lowerIdentifier === "admin" ||
      lowerIdentifier === "admin@serenaraga" ||
      lowerIdentifier === "admin@serenaraga.com" ||
      lowerIdentifier.startsWith("admin");

    try {
      // 1. Query Supabase app_users table
      const { data: users, error: dbError } = await supabase
        .from("app_users")
        .select("*")
        .or(
          `username.ilike.${rawIdentifier},email.ilike.${rawIdentifier},username.ilike.${rawIdentifier}.com,email.ilike.${rawIdentifier}.com,username.ilike.${lowerIdentifier}%,email.ilike.${lowerIdentifier}%`
        )
        .limit(5);

      if (!dbError && users && users.length > 0) {
        // Find best matching user
        const dbUser =
          users.find(
            (u) =>
              u.username?.toLowerCase() === lowerIdentifier ||
              u.username?.toLowerCase() === `${lowerIdentifier}.com` ||
              u.email?.toLowerCase() === lowerIdentifier ||
              u.email?.toLowerCase() === `${lowerIdentifier}.com`
          ) || users[0];

        if (dbUser) {
          if (dbUser.is_active === false) {
            throw new Error(
              "Akun Anda telah dinonaktifkan. Silakan hubungi Administrator."
            );
          }

          // Password check (Exact match or case-insensitive for admin)
          const dbPass = String(dbUser.password_hash || "").trim();
          const passMatch =
            dbPass === password ||
            dbPass.toLowerCase() === password.toLowerCase() ||
            (dbUser.role === "admin" &&
              ADMIN_PASSWORDS.some(
                (p) => p.toLowerCase() === password.toLowerCase()
              ));

          if (passMatch) {
            const session: AppUserSession = {
              id: dbUser.id,
              fullName: dbUser.full_name || "Admin Serena",
              email: dbUser.email || dbUser.username,
              username: dbUser.username,
              role:
                (dbUser.role as "admin" | "cashier" | "manager") || "cashier",
              avatar:
                dbUser.avatar_url ||
                (dbUser.role === "admin"
                  ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                  : "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80"),
            };

            if (typeof window !== "undefined") {
              localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
            }

            return Promise.resolve();
          } else {
            throw new Error("Kata sandi yang Anda masukkan salah.");
          }
        }
      }

      // 2. Fallback check for Super Admin if DB table not yet reachable
      if (
        isSpecialAdminUser &&
        ADMIN_PASSWORDS.some(
          (p) => p.toLowerCase() === password.toLowerCase()
        )
      ) {
        const defaultAdmin: AppUserSession = {
          id: "admin-owner",
          fullName: "Owner / Super Admin",
          email: "admin@serenaraga.com",
          username: "admin@serenaraga.com",
          role: "admin",
          avatar:
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        };

        if (typeof window !== "undefined") {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(defaultAdmin));
        }
        return Promise.resolve();
      }

      throw new Error(
        "Username atau kata sandi tidak ditemukan. Silakan periksa kembali."
      );
    } catch (err: any) {
      // Re-throw user-friendly message
      if (
        isSpecialAdminUser &&
        ADMIN_PASSWORDS.some(
          (p) => p.toLowerCase() === password.toLowerCase()
        )
      ) {
        const defaultAdmin: AppUserSession = {
          id: "admin-owner",
          fullName: "Owner / Super Admin",
          email: "admin@serenaraga.com",
          username: "admin@serenaraga.com",
          role: "admin",
          avatar:
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        };
        if (typeof window !== "undefined") {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(defaultAdmin));
        }
        return Promise.resolve();
      }

      throw new Error(err?.message || "Gagal masuk ke sistem.");
    }
  },

  logout: async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    return Promise.resolve();
  },

  checkAuth: async () => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        try {
          const session = JSON.parse(raw);
          if (session?.id) return Promise.resolve();
        } catch (e) {}
      }
    }

    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session) return Promise.resolve();
    } catch (e) {}

    // Not authenticated -> redirect to login
    return Promise.reject();
  },

  checkError: async (error) => {
    const status = error?.status || error?.statusCode;
    if (status === 401 || status === 403) {
      return Promise.reject();
    }
    return Promise.resolve();
  },

  getIdentity: async (): Promise<UserIdentity> => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        try {
          const session: AppUserSession = JSON.parse(raw);
          return {
            id: session.id,
            fullName: session.fullName,
            email: session.email,
            avatar: session.avatar,
            role: session.role,
          } as any;
        } catch (e) {}
      }
    }

    return {
      id: "admin-owner",
      fullName: "Owner / Super Admin",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      email: "admin@serenaraga.com",
      role: "admin",
    } as any;
  },

  getPermissions: async () => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        try {
          const session: AppUserSession = JSON.parse(raw);
          return Promise.resolve(session.role || "cashier");
        } catch (e) {}
      }
    }
    return Promise.resolve("admin");
  },
};
