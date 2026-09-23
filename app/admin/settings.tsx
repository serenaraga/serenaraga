"use client";

import * as React from "react";
import { useLocaleState } from "ra-core";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Building2,
  PhoneCall,
  MessageCircle,
  CreditCard,
  FileText,
  Save,
  RotateCcw,
  Sparkles,
  Globe,
  AtSign,
  Mail,
  Clock,
  MapPin,
  CheckCircle2,
  ExternalLink,
  Send,
  SlidersHorizontal,
  Check,
  Info,
} from "lucide-react";
import {
  useBrandSettings,
  cleanWhatsAppNumber,
  formatDisplayPhone,
  BrandSettings,
  DEFAULT_BRAND_SETTINGS,
} from "@/lib/brand-settings";

import { Breadcrumb, BreadcrumbItem, BreadcrumbPage } from "@/components/breadcrumb";
import { LinkBase, Translate } from "ra-core";

export function BrandSettingsPage() {
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const { settings, updateSettings, resetToDefault } = useBrandSettings();

  const [formData, setFormData] = React.useState<BrandSettings>(settings);
  const [isSaving, setIsSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<
    "contact" | "identity" | "payment" | "templates"
  >("contact");

  // Keep form in sync when settings are loaded from server
  React.useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (field: keyof BrandSettings, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      // Auto normalize phone format
      const cleanedWa = cleanWhatsAppNumber(formData.whatsapp_number);
      const dataToSave: BrandSettings = {
        ...formData,
        whatsapp_number: cleanedWa,
      };

      await updateSettings(dataToSave);
      setFormData(dataToSave);
      toast.success(
        isEn
          ? "Settings saved successfully! All WhatsApp numbers and invoice links updated."
          : "Pengaturan berhasil disimpan! Seluruh nomor WhatsApp dan tautan nota telah diperbarui."
      );
    } catch (err) {
      toast.error(
        isEn
          ? "Failed to save settings. Please try again."
          : "Gagal menyimpan pengaturan. Silakan coba lagi."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (
      window.confirm(
        isEn
          ? "Are you sure you want to reset all settings to default values?"
          : "Apakah Anda yakin ingin mengembalikan semua pengaturan ke nilai awal bawaan?"
      )
    ) {
      setIsSaving(true);
      await resetToDefault();
      setFormData(DEFAULT_BRAND_SETTINGS);
      setIsSaving(false);
      toast.info(
        isEn
          ? "Settings restored to default."
          : "Pengaturan telah dikembalikan ke nilai awal."
      );
    }
  };

  // Live preview values
  const previewCleanWa = cleanWhatsAppNumber(formData.whatsapp_number);
  const previewFormattedPhone = formatDisplayPhone(formData.whatsapp_number);
  const previewWaUrl = `https://wa.me/${previewCleanWa}?text=${encodeURIComponent(
    (formData.wa_support_default_message || "").replace(
      /\{brand_name\}/g,
      formData.brand_name || "Serena Raga"
    )
  )}`;

  return (
    <div className="space-y-4 pb-16">
      {/* Portal Breadcrumb into top app header */}
      <Breadcrumb>
        <BreadcrumbItem>
          <LinkBase to="/">
            <Translate i18nKey="ra.page.dashboard">Home</Translate>
          </LinkBase>
        </BreadcrumbItem>
        <BreadcrumbPage>{isEn ? "Settings" : "Pengaturan"}</BreadcrumbPage>
      </Breadcrumb>

      {/* Clean Minimalist Page Header matching Dashboard & Lists */}
      <div className="flex justify-between items-start flex-wrap gap-2 my-2">
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          {isEn ? "Settings" : "Pengaturan"}
        </h2>

        {/* Action Buttons Top */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
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

      {/* Segmented Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-border/70 pb-2 overflow-x-auto text-xs no-scrollbar">
        <Button
          type="button"
          variant={activeTab === "contact" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("contact")}
          className="h-8 gap-2 px-3.5 rounded-lg shrink-0"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>{isEn ? "WhatsApp & Contacts" : "WhatsApp & Kontak Admin"}</span>
        </Button>

        <Button
          type="button"
          variant={activeTab === "identity" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("identity")}
          className="h-8 gap-2 px-3.5 rounded-lg shrink-0"
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>{isEn ? "Business Profile" : "Profil Bisnis & Brand"}</span>
        </Button>

        <Button
          type="button"
          variant={activeTab === "payment" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("payment")}
          className="h-8 gap-2 px-3.5 rounded-lg shrink-0"
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>{isEn ? "Bank & Payment" : "Rekening & Pembayaran"}</span>
        </Button>

        <Button
          type="button"
          variant={activeTab === "templates" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("templates")}
          className="h-8 gap-2 px-3.5 rounded-lg shrink-0"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{isEn ? "Invoice & Message Templates" : "Template Nota & Pesan"}</span>
        </Button>
      </div>

      {/* Main Grid: Form Left (2 Columns on Desktop) + Live Preview Right (1 Column) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Container */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* TAB 1: WhatsApp & Contacts */}
            {activeTab === "contact" && (
              <Card className="border border-border/70 shadow-none bg-card">
                <CardHeader className="pb-4 border-b border-border/50">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-muted text-foreground">
                      <MessageCircle className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-foreground">
                        {isEn ? "WhatsApp & Customer Support Contacts" : "Nomor WhatsApp & Layanan CS"}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {isEn
                          ? "This WhatsApp number is dynamically linked across all invoices, customer share links, and support buttons."
                          : "Nomor WhatsApp ini otomatis terpasang pada nota invoice pelanggan, tombol bantuan CS, dan link share."}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="whatsapp_number" className="text-xs font-semibold flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{isEn ? "Primary Admin WhatsApp" : "Nomor WhatsApp Utama Admin"}</span>
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="whatsapp_number"
                        placeholder={isEn ? "e.g. 081234567890 or 6281234567890" : "Contoh: 081234567890 atau 6281234567890"}
                        value={formData.whatsapp_number}
                        onChange={(e) => handleChange("whatsapp_number", e.target.value)}
                        className="text-xs font-mono h-9 shadow-none"
                        required
                      />
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Info className="w-3 h-3 text-muted-foreground shrink-0" />
                        {isEn
                          ? "Accepts 08xx or 628xx format. Auto-formatted to international WhatsApp standard."
                          : "Bisa format 08xx atau 628xx. Otomatis diformat ke standar WhatsApp internasional."}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="phone_number" className="text-xs font-semibold flex items-center gap-1.5">
                        <PhoneCall className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{isEn ? "Alternative Phone / Hotline" : "Nomor Telepon / Hotline Cadangan"}</span>
                      </Label>
                      <Input
                        id="phone_number"
                        placeholder={isEn ? "e.g. (021) 555-0199 / 0812-3456-7890" : "Contoh: (021) 555-0199 / 0812-3456-7890"}
                        value={formData.phone_number}
                        onChange={(e) => handleChange("phone_number", e.target.value)}
                        className="text-xs h-9 shadow-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-semibold flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{isEn ? "Support Email" : "Email Resmi Dukungan"}</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="support@serenaraga.com"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        className="text-xs h-9 shadow-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="operational_hours" className="text-xs font-semibold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{isEn ? "Operating Hours" : "Jam Operasional Layanan"}</span>
                      </Label>
                      <Input
                        id="operational_hours"
                        placeholder={isEn ? "08:00 AM - 10:00 PM (Daily)" : "08:00 - 22:00 WIB (Setiap Hari)"}
                        value={formData.operational_hours}
                        onChange={(e) => handleChange("operational_hours", e.target.value)}
                        className="text-xs h-9 shadow-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="wa_support_default_message" className="text-xs font-semibold">
                      {isEn ? "Default Customer Inbound Message" : "Pesan Pembuka Otomatis Tombol Bantuan CS"}
                    </Label>
                    <Textarea
                      id="wa_support_default_message"
                      rows={2}
                      placeholder={
                        isEn
                          ? "Hello Customer Support {brand_name}, I need help regarding my booking / invoice..."
                          : "Halo Customer Service {brand_name}, saya butuh bantuan mengenai nota saya..."
                      }
                      value={formData.wa_support_default_message}
                      onChange={(e) => handleChange("wa_support_default_message", e.target.value)}
                      className="text-xs shadow-none resize-none"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      {isEn
                        ? "Pre-filled message when a client clicks 'Support' on their online receipt."
                        : "Teks yang otomatis terisi saat pelanggan menekan tombol 'Bantuan CS' pada nota digital."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TAB 2: Business Profile */}
            {activeTab === "identity" && (
              <Card className="border border-border/70 shadow-none bg-card">
                <CardHeader className="pb-4 border-b border-border/50">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-muted text-foreground">
                      <Building2 className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-foreground">
                        {isEn ? "Business Profile & Brand Identity" : "Profil Bisnis & Identitas Brand"}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {isEn
                          ? "Brand name, tagline, service areas, and social media handles."
                          : "Nama brand, tagline/slogan, jangkauan area layanan, dan media sosial."}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="brand_name" className="text-xs font-semibold flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{isEn ? "Brand / Company Name" : "Nama Brand / Bisnis"}</span>
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="brand_name"
                        placeholder="Serena Raga"
                        value={formData.brand_name}
                        onChange={(e) => handleChange("brand_name", e.target.value)}
                        className="text-xs h-9 shadow-none font-medium"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="tagline" className="text-xs font-semibold">
                        {isEn ? "Tagline / Slogan" : "Tagline / Slogan Layanan"}
                      </Label>
                      <Input
                        id="tagline"
                        placeholder="Comfortable Home Massage & Spa"
                        value={formData.tagline}
                        onChange={(e) => handleChange("tagline", e.target.value)}
                        className="text-xs h-9 shadow-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="description" className="text-xs font-semibold">
                      {isEn ? "Business Summary" : "Deskripsi Singkat Usaha"}
                    </Label>
                    <Textarea
                      id="description"
                      rows={2}
                      placeholder={
                        isEn
                          ? "Professional home massage and spa therapy services delivered to your doorstep..."
                          : "Layanan pijat dan spa panggilan profesional langsung ke tempat Anda..."
                      }
                      value={formData.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                      className="text-xs shadow-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="website_url" className="text-xs font-semibold flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Website</span>
                      </Label>
                      <Input
                        id="website_url"
                        placeholder="https://serenaraga.com"
                        value={formData.website_url || ""}
                        onChange={(e) => handleChange("website_url", e.target.value)}
                        className="text-xs h-9 shadow-none font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="service_areas" className="text-xs font-semibold flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{isEn ? "Coverage Area" : "Area Jangkauan Layanan"}</span>
                      </Label>
                      <Input
                        id="service_areas"
                        placeholder="Yogyakarta, Sleman, Bantul, & Sekitarnya"
                        value={formData.service_areas || ""}
                        onChange={(e) => handleChange("service_areas", e.target.value)}
                        className="text-xs h-9 shadow-none"
                      />
                    </div>
                  </div>

                  {/* Social Media Channels */}
                  <div className="pt-2 border-t border-border/50 space-y-3">
                    <div>
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{isEn ? "Official Social Media Accounts" : "Akun & Media Sosial Resmi"}</span>
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        {isEn
                          ? "These links and handles will be displayed on the landing page footer and digital invoices."
                          : "Tautan dan username ini otomatis ditampilkan pada tombol sosmed di footer landing page dan nota digital."}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Instagram */}
                      <div className="space-y-1.5">
                        <Label htmlFor="instagram_handle" className="text-xs font-semibold flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2 text-muted-foreground shrink-0" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                          </svg>
                          <span>Instagram</span>
                        </Label>
                        <Input
                          id="instagram_handle"
                          placeholder="@serenaraga"
                          value={formData.instagram_handle || ""}
                          onChange={(e) => handleChange("instagram_handle", e.target.value)}
                          className="text-xs h-9 shadow-none font-mono"
                        />
                      </div>

                      {/* TikTok */}
                      <div className="space-y-1.5">
                        <Label htmlFor="tiktok_handle" className="text-xs font-semibold flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 fill-current text-muted-foreground shrink-0" viewBox="0 0 24 24">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.27 6.27 0 0 0 1.86-4.49V8.62a8.3 8.3 0 0 0 4.91 1.6V6.77a4.87 4.87 0 0 1-1-.08z" />
                          </svg>
                          <span>TikTok</span>
                        </Label>
                        <Input
                          id="tiktok_handle"
                          placeholder="@serenaraga"
                          value={formData.tiktok_handle || ""}
                          onChange={(e) => handleChange("tiktok_handle", e.target.value)}
                          className="text-xs h-9 shadow-none font-mono"
                        />
                      </div>

                      {/* Facebook */}
                      <div className="space-y-1.5">
                        <Label htmlFor="facebook_url" className="text-xs font-semibold flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 fill-current text-muted-foreground shrink-0" viewBox="0 0 24 24">
                            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                          </svg>
                          <span>Facebook</span>
                        </Label>
                        <Input
                          id="facebook_url"
                          placeholder="https://facebook.com/serenaraga"
                          value={formData.facebook_url || ""}
                          onChange={(e) => handleChange("facebook_url", e.target.value)}
                          className="text-xs h-9 shadow-none font-mono"
                        />
                      </div>

                      {/* Threads */}
                      <div className="space-y-1.5">
                        <Label htmlFor="threads_handle" className="text-xs font-semibold flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 fill-current text-muted-foreground shrink-0" viewBox="0 0 512 512">
                            <path d="M363.2 239.6c-1.9-.9-3.9-1.8-5.9-2.7c-3.5-63.7-38.3-100.2-96.7-100.6h-.8c-35 0-64 14.9-81.9 42.1l32.2 22.1c13.4-20.3 34.4-24.6 49.8-24.6h.5c19.2.1 33.8 5.7 43.2 16.6c6.8 7.9 11.4 18.9 13.7 32.8c-17.1-2.9-35.5-3.8-55.3-2.7c-55.6 3.2-91.3 35.6-88.9 80.7c1.2 22.8 12.6 42.5 32 55.3c16.4 10.9 37.6 16.2 59.6 15c29.1-1.6 51.9-12.7 67.8-33c12.1-15.4 19.7-35.4 23.1-60.5c13.9 8.4 24.1 19.4 29.8 32.6c9.6 22.5 10.2 59.4-19.9 89.5c-26.4 26.4-58.2 37.8-106.1 38.2c-53.2-.4-93.5-17.5-119.6-50.7c-24.5-31.2-37.2-76.1-37.6-133.7c.5-57.6 13.1-102.6 37.6-133.7C166 89 206.2 72 259.4 71.6c53.6.4 94.6 17.5 121.7 51c13.3 16.4 23.4 37 30 61l37.7-10.1c-8-29.6-20.7-55.1-37.8-76.2c-34.8-42.9-85.8-64.8-151.4-65.3h-.3c-65.5.5-115.9 22.5-149.7 65.5c-30.1 38.3-45.6 91.6-46.2 158.3v.4c.5 66.8 16.1 120 46.2 158.3c33.8 43 84.2 65.1 149.7 65.5h.3c58.2-.4 99.3-15.7 133.1-49.4C436.9 386.4 435.6 331 421 297c-10.5-24.4-30.4-44.2-57.7-57.3Zm-100.6 94.6c-24.4 1.4-49.7-9.6-50.9-33c-.9-17.4 12.4-36.7 52.4-39c4.6-.3 9.1-.4 13.5-.4c14.5 0 28.2 1.4 40.5 4.1c-4.6 57.6-31.7 67-55.5 68.3" />
                          </svg>
                          <span>Threads</span>
                        </Label>
                        <Input
                          id="threads_handle"
                          placeholder="@serenaraga"
                          value={formData.threads_handle || ""}
                          onChange={(e) => handleChange("threads_handle", e.target.value)}
                          className="text-xs h-9 shadow-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TAB 3: Bank & Payment */}
            {activeTab === "payment" && (
              <Card className="border border-border/70 shadow-none bg-card">
                <CardHeader className="pb-4 border-b border-border/50">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-muted text-foreground">
                      <CreditCard className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-foreground">
                        {isEn ? "Bank Account & Payment Details" : "Rekening Bank & Pembayaran"}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {isEn
                          ? "Official banking details shown for non-cash bank transfer payments."
                          : "Rincian rekening bank resmi untuk pelanggan yang memilih metode transfer bank."}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="bank_name" className="text-xs font-semibold">
                        {isEn ? "Bank Name" : "Nama Bank"}
                      </Label>
                      <Input
                        id="bank_name"
                        placeholder={isEn ? "e.g. BCA / Mandiri / BNI" : "Contoh: BCA / Mandiri / BNI"}
                        value={formData.bank_name}
                        onChange={(e) => handleChange("bank_name", e.target.value)}
                        className="text-xs h-9 shadow-none font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="bank_account_number" className="text-xs font-semibold">
                        {isEn ? "Account Number" : "Nomor Rekening"}
                      </Label>
                      <Input
                        id="bank_account_number"
                        placeholder="8720-1928-33"
                        value={formData.bank_account_number}
                        onChange={(e) => handleChange("bank_account_number", e.target.value)}
                        className="text-xs h-9 shadow-none font-mono font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="bank_account_holder" className="text-xs font-semibold">
                        {isEn ? "Account Holder Name" : "Atas Nama Pemilik"}
                      </Label>
                      <Input
                        id="bank_account_holder"
                        placeholder="PT Serena Raga Indonesia"
                        value={formData.bank_account_holder}
                        onChange={(e) => handleChange("bank_account_holder", e.target.value)}
                        className="text-xs h-9 shadow-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="qris_image_url" className="text-xs font-semibold">
                      {isEn ? "QRIS Image URL (Optional)" : "URL Gambar QRIS (Opsional)"}
                    </Label>
                    <Input
                      id="qris_image_url"
                      placeholder="https://.../qris.jpg"
                      value={formData.qris_image_url}
                      onChange={(e) => handleChange("qris_image_url", e.target.value)}
                      className="text-xs h-9 shadow-none font-mono"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TAB 4: Invoice & WA Templates */}
            {activeTab === "templates" && (
              <Card className="border border-border/70 shadow-none bg-card">
                <CardHeader className="pb-4 border-b border-border/50">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-muted text-foreground">
                      <FileText className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-foreground">
                        {isEn ? "Invoice Footer & Message Templates" : "Catatan Invoice & Template Pesan"}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {isEn
                          ? "Customize the footer notes on invoices and WhatsApp sharing messages."
                          : "Kustomisasi tulisan di bagian bawah nota dan template pesan saat membagikan invoice via WhatsApp."}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4 text-xs">
                  <div className="space-y-1.5">
                    <Label htmlFor="invoice_footer_note" className="text-xs font-semibold">
                      {isEn ? "Invoice Appreciation Note (Footer)" : "Kalimat Ucapan Terima Kasih (Footer Nota)"}
                    </Label>
                    <Input
                      id="invoice_footer_note"
                      placeholder={
                        isEn
                          ? "Thank you for relaxing with Serena Raga."
                          : "Terima kasih telah mempercayakan relaksasi Anda pada Serena Raga."
                      }
                      value={formData.invoice_footer_note}
                      onChange={(e) => handleChange("invoice_footer_note", e.target.value)}
                      className="text-xs h-9 shadow-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="invoice_support_text" className="text-xs font-semibold">
                      {isEn ? "Official Support Notice (Footer)" : "Keterangan Bukti Transaksi Resmi (Footer)"}
                    </Label>
                    <Input
                      id="invoice_support_text"
                      placeholder="Dokumen ini merupakan bukti transaksi resmi. Layanan pelanggan WhatsApp {whatsapp}."
                      value={formData.invoice_support_text}
                      onChange={(e) => handleChange("invoice_support_text", e.target.value)}
                      className="text-xs h-9 shadow-none"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      {isEn ? "Use tag " : "Gunakan tag "}
                      <code className="bg-muted px-1 py-0.5 rounded font-mono text-[10px]">
                        &#123;whatsapp&#125;
                      </code>
                      {isEn ? " to auto-insert the admin WhatsApp number." : " untuk disisipkan otomatis dengan nomor WhatsApp admin."}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="wa_invoice_message_template" className="text-xs font-semibold">
                      {isEn ? "WhatsApp Share Invoice Template" : "Template Pesan WhatsApp Kirim Nota ke Pelanggan"}
                    </Label>
                    <Textarea
                      id="wa_invoice_message_template"
                      rows={6}
                      value={formData.wa_invoice_message_template}
                      onChange={(e) => handleChange("wa_invoice_message_template", e.target.value)}
                      className="text-xs font-mono shadow-none leading-relaxed"
                    />
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      {isEn ? "Available placeholders: " : "Placeholder yang dapat digunakan: "}
                      <code className="bg-muted px-1 py-0.5 rounded text-[10px] font-mono mr-1">&#123;customer_name&#125;</code>
                      <code className="bg-muted px-1 py-0.5 rounded text-[10px] font-mono mr-1">&#123;invoice_number&#125;</code>
                      <code className="bg-muted px-1 py-0.5 rounded text-[10px] font-mono mr-1">&#123;total_amount&#125;</code>
                      <code className="bg-muted px-1 py-0.5 rounded text-[10px] font-mono mr-1">&#123;service_name&#125;</code>
                      <code className="bg-muted px-1 py-0.5 rounded text-[10px] font-mono mr-1">&#123;booking_date&#125;</code>
                      <code className="bg-muted px-1 py-0.5 rounded text-[10px] font-mono">&#123;invoice_url&#125;</code>
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bottom Save Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="submit"
                disabled={isSaving}
                className="gap-2 shadow-none font-semibold text-xs cursor-pointer"
              >
                <Save className="w-4 h-4" />
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
          </form>
        </div>

        {/* Right Preview Column (1 Column on Desktop) */}
        <div className="space-y-6">
          {/* WhatsApp Direct Test Card */}
          <Card className="border border-border/70 shadow-none bg-card overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-foreground" />
                  {isEn ? "Live WhatsApp Status" : "Status WhatsApp Aktif"}
                </span>
                <Badge variant="outline" className="text-[10px] font-mono text-foreground font-semibold bg-muted border-border">
                  ONLINE
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                  {isEn ? "Configured Admin WhatsApp" : "Nomor WhatsApp Terhubung"}
                </span>
                <div className="text-sm font-mono font-bold text-foreground">
                  {previewFormattedPhone}
                </div>
                <div className="text-[11px] font-mono text-muted-foreground">
                  ID: +{previewCleanWa}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-muted/40 border border-border space-y-1">
                <span className="text-[10px] font-semibold text-foreground flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
                  {isEn ? "Automatically updates:" : "Otomatis memperbarui:"}
                </span>
                <ul className="text-[11px] text-muted-foreground space-y-0.5 list-disc list-inside">
                  <li>{isEn ? "Official Invoice Header & Footer" : "Header & Footer Nota Invoice Resmi"}</li>
                  <li>{isEn ? "Online Support Button on Invoices" : "Tombol Bantuan CS di Nota Pelanggan"}</li>
                  <li>{isEn ? "WhatsApp Share Invoice Message" : "Pesan Share Nota ke WhatsApp"}</li>
                  <li>{isEn ? "Review Response WhatsApp Links" : "Balasan Ulasan Pelanggan"}</li>
                </ul>
              </div>

              <a
                href={previewWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-xs gap-2 border-border text-foreground hover:bg-accent shadow-none cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isEn ? "Test Direct WhatsApp Link" : "Uji Coba Kirim Pesan WA"}</span>
                  <ExternalLink className="w-3 h-3 ml-auto opacity-70" />
                </Button>
              </a>
            </CardContent>
          </Card>

          {/* Invoice Header Mockup Card */}
          <Card className="border border-border/70 shadow-none bg-card p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
              <span className="text-xs font-bold text-foreground">
                {isEn ? "Invoice Header Preview" : "Pratinjau Kop Nota"}
              </span>
              <Badge variant="outline" className="text-[9px] uppercase font-mono text-muted-foreground">
                Live Preview
              </Badge>
            </div>

            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-2">
              <div className="font-bold text-sm text-foreground">
                {formData.brand_name || "Serena Raga"}
              </div>
              <div className="text-[10px] tracking-wider text-muted-foreground uppercase font-medium">
                {formData.tagline || "comfortable home massage"}
              </div>
              <div className="text-[11px] text-muted-foreground/90 font-mono">
                WhatsApp: {previewFormattedPhone} •{" "}
                {formData.website_url
                  ? formData.website_url.replace(/^https?:\/\//, "")
                  : "serenaraga.com"}
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase">
                {isEn ? "Invoice Footer Preview" : "Pratinjau Catatan Bawah Nota"}
              </span>
              <div className="p-2.5 rounded-lg border border-border/40 bg-muted/10 text-center space-y-1">
                <p className="text-[11px] font-medium text-foreground">
                  {formData.invoice_footer_note ||
                    (isEn
                      ? "Thank you for relaxing with Serena Raga."
                      : "Terima kasih telah mempercayakan relaksasi Anda pada Serena Raga.")}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {(
                    formData.invoice_support_text ||
                    (isEn
                      ? "This is an official transaction record. For support, WhatsApp {whatsapp}."
                      : "Dokumen ini merupakan bukti transaksi resmi. Layanan pelanggan WhatsApp {whatsapp}.")
                  ).replace(/\{whatsapp\}/g, previewFormattedPhone)}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
