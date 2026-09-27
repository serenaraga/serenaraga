"use client";

import * as React from "react";
import { useLocaleState, LinkBase, Translate } from "ra-core";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  Mail,
  Clock,
  MapPin,
} from "lucide-react";
import {
  useBrandSettings,
  cleanWhatsAppNumber,
  BrandSettings,
  DEFAULT_BRAND_SETTINGS,
} from "@/lib/brand-settings";
import { Breadcrumb, BreadcrumbItem, BreadcrumbPage } from "@/components/breadcrumb";

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
      const cleanedWa = cleanWhatsAppNumber(formData.whatsapp_number);
      const dataToSave: BrandSettings = {
        ...formData,
        whatsapp_number: cleanedWa,
      };

      await updateSettings(dataToSave);
      setFormData(dataToSave);
      toast.success(
        isEn
          ? "Settings saved successfully!"
          : "Pengaturan berhasil disimpan!"
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

  return (
    <div className="space-y-4 pb-16 max-w-5xl">
      {/* Portal Breadcrumb into top app header */}
      <Breadcrumb>
        <BreadcrumbItem>
          <LinkBase to="/">
            <Translate i18nKey="ra.page.dashboard">Home</Translate>
          </LinkBase>
        </BreadcrumbItem>
        <BreadcrumbPage>{isEn ? "Settings" : "Pengaturan"}</BreadcrumbPage>
      </Breadcrumb>

      {/* Clean Minimalist Page Header */}
      <div className="flex justify-between items-center flex-wrap gap-3 my-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
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
          className="h-8 gap-2 px-3.5 rounded-lg shrink-0 cursor-pointer"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>{isEn ? "WhatsApp & Contacts" : "WhatsApp & Kontak"}</span>
        </Button>

        <Button
          type="button"
          variant={activeTab === "identity" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("identity")}
          className="h-8 gap-2 px-3.5 rounded-lg shrink-0 cursor-pointer"
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>{isEn ? "Business Profile" : "Profil Bisnis & Brand"}</span>
        </Button>

        <Button
          type="button"
          variant={activeTab === "payment" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("payment")}
          className="h-8 gap-2 px-3.5 rounded-lg shrink-0 cursor-pointer"
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>{isEn ? "Bank & Payment" : "Rekening & Pembayaran"}</span>
        </Button>

        <Button
          type="button"
          variant={activeTab === "templates" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("templates")}
          className="h-8 gap-2 px-3.5 rounded-lg shrink-0 cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{isEn ? "Invoice & Message Templates" : "Template Nota & Pesan"}</span>
        </Button>
      </div>

      {/* Main Clean Form Container */}
      <form onSubmit={handleSave} className="space-y-4">
        {/* TAB 1: WhatsApp & Contacts */}
        {activeTab === "contact" && (
          <Card className="border border-border shadow-none bg-card">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-primary" />
                <span>{isEn ? "WhatsApp & Customer Support Contacts" : "Nomor WhatsApp & Layanan CS"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="whatsapp_number" className="text-xs font-semibold">
                    {isEn ? "Primary Admin WhatsApp" : "Nomor WhatsApp Utama Admin"}
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Input
                    id="whatsapp_number"
                    placeholder="081234567890"
                    value={formData.whatsapp_number}
                    onChange={(e) => handleChange("whatsapp_number", e.target.value)}
                    className="text-xs h-9 shadow-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone_number" className="text-xs font-semibold">
                    {isEn ? "Alternative Phone / Hotline" : "Nomor Telepon / Hotline Cadangan"}
                  </Label>
                  <Input
                    id="phone_number"
                    placeholder="+62 895-1835-9037"
                    value={formData.phone_number}
                    onChange={(e) => handleChange("phone_number", e.target.value)}
                    className="text-xs h-9 shadow-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold">
                    {isEn ? "Support Email" : "Email Dukungan"}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ragaserena@gmail.com"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="text-xs h-9 shadow-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="operational_hours" className="text-xs font-semibold">
                    {isEn ? "Operating Hours" : "Jam Operasional"}
                  </Label>
                  <Input
                    id="operational_hours"
                    placeholder="08:00 - 22:00 WIB (Setiap Hari)"
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
              </div>
            </CardContent>
          </Card>
        )}

        {/* TAB 2: Business Profile */}
        {activeTab === "identity" && (
          <Card className="border border-border shadow-none bg-card">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <span>{isEn ? "Business Profile & Brand Identity" : "Profil Bisnis & Identitas Brand"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="brand_name" className="text-xs font-semibold">
                    {isEn ? "Brand / Company Name" : "Nama Brand / Bisnis"}
                    <span className="text-destructive ml-1">*</span>
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
                    {isEn ? "Tagline / Slogan" : "Tagline / Slogan"}
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
                  <Label htmlFor="website_url" className="text-xs font-semibold">
                    Website
                  </Label>
                  <Input
                    id="website_url"
                    placeholder="https://serenaraga.com"
                    value={formData.website_url || ""}
                    onChange={(e) => handleChange("website_url", e.target.value)}
                    className="text-xs h-9 shadow-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="service_areas" className="text-xs font-semibold">
                    {isEn ? "Coverage Area" : "Area Jangkauan Layanan"}
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
              <div className="pt-3 border-t border-border/50 space-y-3">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>{isEn ? "Official Social Media Accounts" : "Akun Media Sosial Resmi"}</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Instagram */}
                  <div className="space-y-1.5">
                    <Label htmlFor="instagram_handle" className="text-xs font-semibold">
                      Instagram
                    </Label>
                    <Input
                      id="instagram_handle"
                      placeholder="@serena.raga"
                      value={formData.instagram_handle || ""}
                      onChange={(e) => handleChange("instagram_handle", e.target.value)}
                      className="text-xs h-9 shadow-none"
                    />
                  </div>

                  {/* TikTok */}
                  <div className="space-y-1.5">
                    <Label htmlFor="tiktok_handle" className="text-xs font-semibold">
                      TikTok
                    </Label>
                    <Input
                      id="tiktok_handle"
                      placeholder="@serenaraga"
                      value={formData.tiktok_handle || ""}
                      onChange={(e) => handleChange("tiktok_handle", e.target.value)}
                      className="text-xs h-9 shadow-none"
                    />
                  </div>

                  {/* Facebook */}
                  <div className="space-y-1.5">
                    <Label htmlFor="facebook_url" className="text-xs font-semibold">
                      Facebook
                    </Label>
                    <Input
                      id="facebook_url"
                      placeholder="https://facebook.com/serenaraga"
                      value={formData.facebook_url || ""}
                      onChange={(e) => handleChange("facebook_url", e.target.value)}
                      className="text-xs h-9 shadow-none"
                    />
                  </div>

                  {/* Threads */}
                  <div className="space-y-1.5">
                    <Label htmlFor="threads_handle" className="text-xs font-semibold">
                      Threads
                    </Label>
                    <Input
                      id="threads_handle"
                      placeholder="@serena.raga"
                      value={formData.threads_handle || ""}
                      onChange={(e) => handleChange("threads_handle", e.target.value)}
                      className="text-xs h-9 shadow-none"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* TAB 3: Bank & Payment */}
        {activeTab === "payment" && (
          <Card className="border border-border shadow-none bg-card">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                <span>{isEn ? "Bank Account & Payment Details" : "Rekening Bank & Pembayaran"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bank_name" className="text-xs font-semibold">
                    {isEn ? "Bank Name" : "Nama Bank"}
                  </Label>
                  <Input
                    id="bank_name"
                    placeholder="BCA / Mandiri / BNI"
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
                    className="text-xs h-9 shadow-none font-medium"
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
                  className="text-xs h-9 shadow-none"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* TAB 4: Invoice & WA Templates */}
        {activeTab === "templates" && (
          <Card className="border border-border shadow-none bg-card">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span>{isEn ? "Invoice Footer & Message Templates" : "Catatan Invoice & Template Pesan"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="invoice_footer_note" className="text-xs font-semibold">
                  {isEn ? "Invoice Appreciation Note (Footer)" : "Kalimat Ucapan Terima Kasih (Footer Nota)"}
                </Label>
                <Input
                  id="invoice_footer_note"
                  placeholder="Terima kasih telah mempercayakan relaksasi Anda pada Serena Raga."
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
                  className="text-xs shadow-none leading-relaxed"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
}
