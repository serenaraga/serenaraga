"use client";

import * as React from "react";
import { useLocaleState, LinkBase, Translate, useNavigate } from "ra-core";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Save,
  RotateCcw,
  LayoutGrid,
} from "lucide-react";
import {
  useBrandSettings,
  BrandSettings,
  FeaturedServiceCard,
  DEFAULT_FEATURED_SERVICES,
} from "@/lib/brand-settings";
import { Breadcrumb, BreadcrumbItem, BreadcrumbPage } from "@/components/breadcrumb";
import { ServicesSectionSettings } from "@/components/landing-settings";

export function LandingPageSettingsPage() {
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const navigate = useNavigate();
  const { settings, updateSettings } = useBrandSettings();

  const [servicesCards, setServicesCards] = React.useState<FeaturedServiceCard[]>(
    settings.landing_services_section || settings.featured_services || DEFAULT_FEATURED_SERVICES
  );
  const [isSaving, setIsSaving] = React.useState(false);

  // Sync state when settings are loaded/updated from database
  const lastCardsRef = React.useRef(servicesCards);
  React.useEffect(() => {
    const cards = settings.landing_services_section || settings.featured_services;
    if (
      cards &&
      cards.length === 4 &&
      JSON.stringify(lastCardsRef.current) !== JSON.stringify(cards)
    ) {
      lastCardsRef.current = cards;
      setServicesCards(cards);
    }
  }, [settings.landing_services_section, settings.featured_services]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const dataToSave: BrandSettings = {
        ...settings,
        landing_services_section: servicesCards,
      };

      const res = await updateSettings(dataToSave);
      if (!res.success) {
        throw res.error || new Error("Failed to save landing page settings");
      }
      toast.success(
        isEn
          ? "Landing page settings saved successfully!"
          : "Pengaturan landing page berhasil disimpan!"
      );
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(
        isEn
          ? `Failed to save settings: ${err?.message || "Please try again"}`
          : `Gagal menyimpan pengaturan: ${err?.message || "Silakan coba lagi"}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetAll = async () => {
    if (
      window.confirm(
        isEn
          ? "Reset all landing page sections to default values?"
          : "Kembalikan semua bagian landing page ke nilai bawaan?"
      )
    ) {
      setServicesCards(DEFAULT_FEATURED_SERVICES);
      setIsSaving(true);
      await updateSettings({
        ...settings,
        landing_services_section: DEFAULT_FEATURED_SERVICES,
      });
      setIsSaving(false);
      toast.info(
        isEn
          ? "Landing page restored to default."
          : "Landing page telah dikembalikan ke nilai awal."
      );
    }
  };

  return (
    <div className="space-y-4 pb-16 max-w-5xl">
      {/* 1. Proper Structured Breadcrumb: Dashboard > Settings > Landing Page */}
      <Breadcrumb>
        <BreadcrumbItem>
          <LinkBase to="/">
            <Translate i18nKey="ra.page.dashboard">Home</Translate>
          </LinkBase>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <LinkBase to="/settings">
            {isEn ? "Settings" : "Pengaturan"}
          </LinkBase>
        </BreadcrumbItem>
        <BreadcrumbPage>
          {isEn ? "Landing Page" : "Landing Page"}
        </BreadcrumbPage>
      </Breadcrumb>

      {/* 2. Standard Page Header with Action Controls */}
      <div className="flex justify-between items-center flex-wrap gap-3 my-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Landing Page
        </h2>

        {/* Action Buttons Top */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetAll}
            disabled={isSaving}
            className="text-xs gap-1.5 shadow-none border-border"
          >
            <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{isEn ? "Reset Defaults" : "Reset Bawaan"}</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="text-xs gap-1.5 shadow-none font-semibold cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>
              {isSaving
                ? isEn
                  ? "Saving..."
                  : "Menyimpan..."
                : isEn
                ? "Save Settings"
                : "Simpan Pengaturan"}
            </span>
          </Button>
        </div>
      </div>

      {/* 3. Main Modular Section Container */}
      <div className="space-y-6 pt-2">
        {/* Module 1: Our Services Section */}
        <Card className="border border-border shadow-none bg-card">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-bold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-primary" />
                <span>{isEn ? "1. Our Services Section" : "1. Bagian Layanan Unggulan (Our Services)"}</span>
              </span>
              <span className="text-[10px] bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
                {isEn ? "Homepage Section #5" : "Bagian Halaman Utama"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 text-xs">
            <ServicesSectionSettings
              value={servicesCards}
              onChange={(newCards) => setServicesCards(newCards)}
              isEn={isEn}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
