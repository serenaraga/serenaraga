"use client";

import { useState } from "react";
import { useLogin, useNotify, useTranslate, Translate } from "ra-core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notification } from "@/components/notification";
import { LocalesMenuButton } from "@/components/locales-menu-button";
import { ThemeModeToggle } from "@/components/theme-mode-toggle";
import { Lock, User, ShieldCheck, Eye, EyeOff, Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { FireworksBackground } from "@/components/animate-ui/components/backgrounds/fireworks";

export const LoginPage = (props: { redirectTo?: string }) => {
  const { redirectTo } = props;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState<{ username?: string; password?: string }>({});

  const login = useLogin();
  const notify = useNotify();
  const translate = useTranslate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError({});

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    const errors: { username?: string; password?: string } = {};
    if (!cleanUser) {
      errors.username = translate("ra.validation.required", { _: "Wajib diisi" });
    }
    if (!cleanPass) {
      errors.password = translate("ra.validation.required", { _: "Wajib diisi" });
    }

    if (Object.keys(errors).length > 0) {
      setFieldError(errors);
      notify(translate("ra.message.invalid_form", { _: "Data formulir tidak valid. Silakan periksa kembali." }), {
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      await login({ username: cleanUser, password: cleanPass }, redirectTo);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      const errMsg =
        typeof error === "string"
          ? error
          : error?.message || translate("ra.auth.sign_in_error", { _: "Autentikasi gagal, silakan coba lagi." });

      notify(errMsg, { type: "error" });
    }
  };

  return (
    <div className="min-h-screen flex relative bg-background">
      {/* Top right quick controls */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <LocalesMenuButton />
        <ThemeModeToggle />
      </div>

      <div className="container relative grid flex-col items-center justify-center sm:max-w-none lg:grid-cols-2 lg:px-0">
        {/* Left Side: Clean Branding Panel with Animated Fireworks Background */}
        <div className="relative hidden h-full flex-col bg-muted/30 p-12 text-foreground border-r border-border lg:flex justify-between overflow-hidden">
          {/* Animated Fireworks Canvas */}
          <FireworksBackground
            className="absolute inset-0 z-0 pointer-events-none opacity-50 dark:opacity-75"
            color={["#8b5e3c", "#d49b6a", "#c4916a", "#b07d56", "#f59e0b", "#e2b170"]}
            population={1.2}
          />

          {/* Brand Header */}
          <div className="relative z-10 flex items-center">
            <BrandLogo variant="full" className="h-9 w-auto" />
          </div>

          {/* Center Information */}
          <div className="relative z-10 my-auto max-w-md space-y-4">
            <blockquote className="space-y-3 backdrop-blur-md bg-background/50 dark:bg-background/60 p-6 rounded-2xl border border-border/50 shadow-sm">
              <p className="text-xl font-medium text-foreground leading-relaxed">
                &ldquo;Kenyamanan dan relaksasi profesional langsung di rumah Anda.&rdquo;
              </p>
              <footer className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Portal Resmi Admin & Kasir • Serena Raga</span>
              </footer>
            </blockquote>
          </div>

          {/* Footer Copyright */}
          <div className="relative z-10 text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Serena Raga. All rights reserved.
          </div>
        </div>

        {/* Right Side: Sign-in Form */}
        <div className="p-6 lg:p-12">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[360px]">
            <div className="flex flex-col space-y-2 text-center">
              <div className="lg:hidden mx-auto flex items-center justify-center p-2 mb-2">
                <BrandLogo variant="full" className="h-8 w-auto" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                <Translate i18nKey="ra.auth.sign_in">Masuk</Translate>
              </h1>
              <p className="text-xs text-muted-foreground">
                <Translate i18nKey="app.welcome">
                  Masukkan akun resmi Anda untuk mengelola sistem pemesanan.
                </Translate>
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs font-medium text-foreground">
                  {translate("ra.auth.username", { _: "Username / Akun" })} <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    autoComplete="username"
                    autoFocus
                    placeholder="admin@serenaraga.com"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (fieldError.username) setFieldError((prev) => ({ ...prev, username: undefined }));
                    }}
                    className={`h-9 text-sm pr-9 shadow-none ${fieldError.username ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                  <User className="w-4 h-4 text-muted-foreground absolute right-3 top-2.5 pointer-events-none" />
                </div>
                {fieldError.username && (
                  <p className="text-[11px] text-destructive font-medium">{fieldError.username}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium text-foreground">
                  {translate("ra.auth.password", { _: "Kata Sandi" })} <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldError.password) setFieldError((prev) => ({ ...prev, password: undefined }));
                    }}
                    className={`h-9 text-sm pr-9 shadow-none ${fieldError.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldError.password && (
                  <p className="text-[11px] text-destructive font-medium">{fieldError.password}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all cursor-pointer shadow-none h-9 mt-2 gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <Translate i18nKey="ra.page.loading">Memuat...</Translate>
                  </>
                ) : (
                  <Translate i18nKey="ra.auth.sign_in">Masuk</Translate>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
      <Notification />
    </div>
  );
};
