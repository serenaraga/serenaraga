"use client";

import * as React from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale/id";
import { enUS as localeEn } from "date-fns/locale/en-US";
import {
  Share2,
  Download,
  Copy,
  Check,
  Loader2,
  Tag,
} from "lucide-react";
import { useLocaleState } from "ra-core";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useBrandSettings, cleanWhatsAppNumber } from "@/lib/brand-settings";
import { BrandLogo } from "@/components/brand-logo";
import { cn, formatIDR, localizePromoName, formatDeduplicatedDescription, resolveInvoiceLineItems } from "@/lib/utils";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import { InvoiceCardSkeleton } from "@/components/ui/skeleton";
import { SerenaWatermark } from "@/components/serena-watermark";

export interface InvoiceData {
  id?: number | string;
  invoice_number: string;
  public_token?: string | null;
  booking_id?: number | string | null;
  customer_id?: number | string | null;
  customer_name: string;
  customer_phone?: string;
  service_id?: number | string | null;
  service_name: string;
  therapist_id?: number | string | null;
  therapist_name?: string;
  booking_date?: string;
  booking_time?: string;
  service_address?: string;
  subtotal: number;
  discount?: number;
  transport_fee?: number;
  additional_charge?: number;
  additional_charge_description?: string;
  total_amount: number;
  payment_method?: string;
  payment_status?: string;
  booking_status?: string;
  notes?: string;
  discount_name?: string;
  applied_promo_name?: string;
  created_at?: string;
}

export interface InvoiceCardProps {
  invoice: InvoiceData;
  showShareActions?: boolean;
  className?: string;
  cardClassName?: string;
  borderless?: boolean;
  publicMode?: boolean;
  forcedLocale?: string;
}



/**
 * Clean & Minimalist Serena Raga Invoice & Nota Card component.
 * Unified with shadcn/ui dashboard design system with shadow-none flat luxury style.
 */
export const InvoiceCard = ({
  invoice,
  showShareActions = true,
  className,
  cardClassName,
  borderless = false,
  publicMode = false,
  forcedLocale,
}: InvoiceCardProps) => {
  // Use React Admin locale state or fallback if inside standalone page
  let adminLocale = "en";
  try {
    const [loc] = useLocaleState();
    adminLocale = loc || "en";
  } catch (e) {
    adminLocale = "en";
  }

  const activeLocale = forcedLocale || adminLocale;
  const isEn = activeLocale === "en";
  const [copied, setCopied] = React.useState(false);
  const { settings, formattedPhone } = useBrandSettings();

  const formattedTotal = formatIDR(invoice.total_amount);
  const formattedSubtotal = formatIDR(invoice.subtotal);
  const formattedDiscount = formatIDR(invoice.discount);
  const formattedTransport = formatIDR(invoice.transport_fee);

  // Date formatting
  const rawDate = invoice.booking_date ? new Date(invoice.booking_date) : new Date();
  const formattedDate = format(rawDate, "dd MMMM yyyy", {
    locale: isEn ? localeEn : localeId,
  });

  // Public Invoice URL (Strictly uses secure public_token)
  const publicInvoiceUrl = React.useMemo(() => {
    if (typeof window === "undefined") return "";
    const origin = window.location.origin;
    const identifier = invoice.public_token || "preview";
    return `${origin}/invoice/${identifier}`;
  }, [invoice.public_token]);

  const handleCopyLink = () => {
    if (!publicInvoiceUrl) return;
    navigator.clipboard.writeText(publicInvoiceUrl);
    setCopied(true);
    toast.success(isEn ? "Invoice link copied to clipboard!" : "Tautan nota berhasil disalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const rawPhone = invoice.customer_phone ? cleanWhatsAppNumber(invoice.customer_phone) : "";

    let message = settings.wa_invoice_message_template || "";
    message = message
      .replace(/\{customer_name\}/g, invoice.customer_name || (isEn ? "Customer" : "Pelanggan"))
      .replace(/\{brand_name\}/g, settings.brand_name || "Serena Raga")
      .replace(/\{service_name\}/g, invoice.service_name || (isEn ? "Home Massage" : "Layanan Pijat"))
      .replace(/\{invoice_number\}/g, invoice.invoice_number || "-")
      .replace(/\{total_amount\}/g, formattedTotal)
      .replace(/\{booking_date\}/g, formattedDate)
      .replace(/\{booking_time\}/g, invoice.booking_time ? String(invoice.booking_time).replace(/\s*WIB/i, "").trim() : "10:00")
      .replace(/\{payment_status\}/g, invoice.payment_status === "paid" ? (isEn ? "Paid" : "Lunas") : (isEn ? "Unpaid" : "Belum Lunas"))
      .replace(/\{invoice_url\}/g, publicInvoiceUrl)
      .replace(/\{admin_phone\}/g, formattedPhone);

    const waUrl = rawPhone
      ? `https://wa.me/${rawPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(waUrl, "_blank");
  };

  const [isDownloading, setIsDownloading] = React.useState(false);
  const [invoiceImageUrl, setInvoiceImageUrl] = React.useState<string | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(true);
  const hiddenDocRef = React.useRef<HTMLDivElement>(null);

  // Auto-generate high-DPI image of the invoice on mount or state change
  const generateImage = React.useCallback(async () => {
    if (!hiddenDocRef.current) return;
    try {
      if (typeof document !== "undefined" && document.fonts) {
        await document.fonts.ready;
      }
      await new Promise((resolve) => setTimeout(resolve, 80));

      const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
      const backgroundColor = isDark ? "#18181b" : "#ffffff";

      // 2.5x high-DPI scaling: razor-sharp typography while keeping file size lightweight (~120KB)
      const dataUrl = await toPng(hiddenDocRef.current, {
        quality: 0.98,
        pixelRatio: 2.5,
        backgroundColor: backgroundColor,
        cacheBust: true,
        style: {
          border: "none",
          borderWidth: "0px",
          boxShadow: "none",
          outline: "none",
          borderRadius: "0px",
          margin: "0",
          transform: "none",
          transformOrigin: "top left",
          width: "540px",
        },
      });

      setInvoiceImageUrl(dataUrl);
    } catch (err) {
      console.error("Failed to generate invoice image on mount:", err);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  React.useEffect(() => {
    setIsGenerating(true);
    generateImage();
  }, [
    generateImage,
    invoice.invoice_number,
    invoice.total_amount,
    invoice.subtotal,
    invoice.discount,
    invoice.payment_status,
    invoice.customer_name,
    invoice.service_name,
    isEn,
  ]);

  const handleDownloadPng = async () => {
    setIsDownloading(true);
    const toastId = toast.loading(
      isEn ? "Downloading high-resolution invoice image..." : "Mengunduh gambar nota resolusi tinggi..."
    );

    try {
      let dataUrl = invoiceImageUrl;
      if (!dataUrl && hiddenDocRef.current) {
        if (typeof document !== "undefined" && document.fonts) {
          await document.fonts.ready;
        }
        const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
        const backgroundColor = isDark ? "#18181b" : "#ffffff";
        dataUrl = await toPng(hiddenDocRef.current, {
          quality: 0.98,
          pixelRatio: 2.5,
          backgroundColor: backgroundColor,
          cacheBust: true,
        });
      }

      if (!dataUrl) throw new Error("Image data URL not available");

      const fileName = `Invoice-${invoice.invoice_number || "SR"}.png`;
      const link = document.createElement("a");
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(
        isEn ? "Invoice PNG downloaded!" : "Nota berhasil diunduh sebagai gambar PNG!",
        { id: toastId }
      );
    } catch (error) {
      console.error("Failed to download invoice PNG:", error);
      toast.error(
        isEn ? "Failed to download invoice image." : "Gagal mengunduh gambar nota.",
        { id: toastId }
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const isPaid = invoice.payment_status === "paid";

  // Footer Notes & Support Texts directly from Settings with robust multilingual translation
  const defaultIdFooterNote = "Terima kasih telah mempercayakan relaksasi Anda pada Serena Raga.";
  const defaultEnFooterNote = "Thank you for choosing Serena Raga for your wellness and relaxation.";
  let displayFooterNote = settings.invoice_footer_note;
  if (
    !displayFooterNote ||
    displayFooterNote.trim() === defaultIdFooterNote ||
    displayFooterNote.toLowerCase().includes("terima kasih telah mempercayakan")
  ) {
    displayFooterNote = isEn ? defaultEnFooterNote : defaultIdFooterNote;
  }

  const defaultIdSupportText = "Dokumen ini merupakan bukti transaksi resmi. Layanan pelanggan WhatsApp {whatsapp}.";
  const defaultEnSupportText = "This document is an official transaction record. For customer support, WhatsApp {whatsapp}.";
  let rawSupportText = settings.invoice_support_text;
  if (
    !rawSupportText ||
    rawSupportText.trim() === defaultIdSupportText ||
    rawSupportText.toLowerCase().includes("dokumen ini merupakan bukti transaksi resmi")
  ) {
    rawSupportText = isEn ? defaultEnSupportText : defaultIdSupportText;
  }
  const displaySupportText = rawSupportText.replace(/\{whatsapp\}/g, formattedPhone);

  // Extract promo name and parse JSON metadata from notes if present
  let meta: any = null;
  let rawNotesText = invoice.notes || "";
  if (rawNotesText.trim().startsWith("{") && rawNotesText.trim().endsWith("}")) {
    try {
      meta = JSON.parse(rawNotesText.trim());
      rawNotesText = meta.raw_notes || "";
    } catch (e) {}
  }

  const effectiveAdditionalCharge = Number(
    invoice.additional_charge !== undefined
      ? invoice.additional_charge
      : meta?.additional_charge !== undefined
      ? meta.additional_charge
      : Array.isArray(meta?.items)
      ? meta.items.reduce((acc: number, it: any) => acc + (Number(it.additional_charge) || 0), 0)
      : 0
  );

  const effectiveAdditionalChargeDesc = formatDeduplicatedDescription(
    invoice.additional_charge_description ||
    meta?.additional_charge_description ||
    (Array.isArray(meta?.items)
      ? meta.items.map((it: any) => it.additional_charge_description)
      : "")
  );

  const formattedAdditionalCharge = formatIDR(effectiveAdditionalCharge);

  const promoMatch = rawNotesText?.match(/\[Promo:\s*([^\]]+)\]/i);
  const promoNameFromNotes = promoMatch ? promoMatch[1].trim() : (meta?.promo_name || null);
  const cleanNotes = rawNotesText
    ? rawNotesText
        .replace(/\[Invoice:\s*[^\]]+\]/gi, "")
        .replace(/\[Promo:\s*[^\]]+\]/gi, "")
        .trim()
    : "";

  const resolvedItems = React.useMemo(() => {
    return resolveInvoiceLineItems({
      meta,
      items: (invoice as any).items,
      serviceName: invoice.service_name,
      subtotal: invoice.subtotal,
      totalAmount: invoice.total_amount,
      fallbackName: isEn ? "Home Massage Service" : "Layanan Pijat di Rumah",
    });
  }, [meta, invoice.service_name, invoice.subtotal, invoice.total_amount, (invoice as any).items, isEn]);

  const rawDiscountName =
    invoice.discount_name || invoice.applied_promo_name || promoNameFromNotes;
  const displayDiscountName = rawDiscountName
    ? localizePromoName(rawDiscountName, isEn)
    : null;

  return (
    <div className={cn("space-y-3 sm:space-y-4 max-w-xl mx-auto w-full", className)}>
      {/* Top Action Bar (Flat shadcn styling matching Dashboard with subtle Serena accents) */}
      {showShareActions && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 sm:p-3 bg-card border border-border rounded-xl shadow-none print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground">
              {invoice.invoice_number}
            </span>
            {!publicMode && (
              <span
                className={cn(
                  "text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase",
                  isPaid
                    ? "text-[#8b5e3c] dark:text-[#d49b6a]"
                    : "text-muted-foreground"
                )}
              >
                {isPaid ? (isEn ? "PAID" : "LUNAS") : isEn ? "UNPAID" : "BELUM LUNAS"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="h-7 sm:h-8 text-[11px] sm:text-xs gap-1 sm:gap-1.5 shadow-none border-border hover:border-[#8b5e3c]/30 hover:text-[#8b5e3c] dark:hover:text-[#d49b6a] cursor-pointer px-2 sm:px-3"
            >
              {copied ? <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#8b5e3c] dark:text-[#d49b6a]" /> : <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" />}
              {isEn ? "Copy Link" : "Salin Link"}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadPng}
              disabled={isDownloading}
              className="h-7 sm:h-8 text-[11px] sm:text-xs gap-1 sm:gap-1.5 shadow-none border-border hover:border-[#8b5e3c]/30 hover:text-[#8b5e3c] dark:hover:text-[#d49b6a] cursor-pointer px-2 sm:px-3"
            >
              {isDownloading ? (
                <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin text-[#8b5e3c] dark:text-[#d49b6a]" />
              ) : (
                <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" />
              )}
              {isDownloading
                ? (isEn ? "Exporting..." : "Mengunduh...")
                : (isEn ? "Download PNG" : "Unduh PNG")}
            </Button>

            {!publicMode && (
              <Button
                type="button"
                size="sm"
                onClick={handleShareWhatsApp}
                className="h-7 sm:h-8 text-[11px] sm:text-xs gap-1 sm:gap-1.5 bg-[#8b5e3c] hover:bg-[#785033] dark:bg-[#d49b6a] dark:hover:bg-[#c28a5a] text-white dark:text-zinc-950 font-medium shadow-none transition-colors cursor-pointer px-2.5 sm:px-3"
              >
                <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                {isEn ? "Share WA" : "Kirim WhatsApp"}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. VISIBLE RENDERED INVOICE: Real <img> Tag with Right-Click Menu Support */}
      {/* ========================================================================= */}
      <div className="w-full flex justify-center">
        {invoiceImageUrl ? (
          <div
            className={cn(
              "w-full max-w-[540px] rounded-xl overflow-hidden border border-border bg-card shadow-none flex items-center justify-center p-0",
              borderless && "border-0 shadow-none bg-transparent rounded-none",
              cardClassName
            )}
          >
            <img
              src={invoiceImageUrl}
              alt={`Invoice ${invoice.invoice_number}`}
              className="w-full h-auto object-contain block select-auto rounded-xl cursor-default"
            />
          </div>
        ) : (
          <InvoiceCardSkeleton showActions={false} className={cn("w-full max-w-[540px]", cardClassName)} />
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. MASTER TEMPLATE: Offscreen Document used for Rasterizing High-DPI PNG  */}
      {/* ========================================================================= */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          left: "-9999px",
          top: "0px",
          width: "540px",
          pointerEvents: "none",
          zIndex: -100,
          opacity: 0,
        }}
      >
        <Card
          ref={hiddenDocRef}
          id="invoice-document"
          className={cn(
            "relative bg-card text-card-foreground overflow-hidden w-[540px] ring-0 border-0 shadow-none rounded-none",
            cardClassName
          )}
        >
          {/* Subtle Watermark Background */}
          <SerenaWatermark />

          {/* Content Container (z-10 over watermark) */}
          <CardContent className="relative z-10 p-6 md:p-7 space-y-6">
            {/* Header Section (Seamless without divider border) */}
            <div className="flex flex-row items-start justify-between gap-4 pb-1">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <BrandLogo variant="full" className="h-8 w-auto text-foreground" />
                </div>
                <p className="text-[10px] tracking-[0.18em] font-semibold text-[#8b5e3c] dark:text-[#d49b6a] uppercase">
                  {(settings.tagline || "Comfortable Home Massage").toUpperCase()}
                </p>
              </div>

              <div className="text-right space-y-0.5 shrink-0">
                <span className="inline-block px-2.5 py-0.5 bg-[#8b5e3c] text-white text-[10px] font-bold italic tracking-wider rounded-md shadow-xs">
                  INVOICE
                </span>
                <p className="text-xs font-semibold text-foreground tracking-tight pt-0.5">
                  {invoice.invoice_number}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {formattedDate}
                </p>
              </div>
            </div>

            {/* Billed To (Destination) */}
            <div className="border-l-[3px] border-[#8b5e3c] dark:border-[#d49b6a] pl-3 py-0.5 space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b5e3c] dark:text-[#d49b6a]">
                {isEn ? "BILLED TO:" : "DITUJUKAN UNTUK:"}
              </p>
              <h3 className="text-lg sm:text-xl font-bold text-foreground leading-snug tracking-tight">
                {invoice.customer_name || (isEn ? "General Client" : "Pelanggan")}
              </h3>
            </div>

            {/* Itemized Table & Line */}
            <div className="space-y-2 w-full pt-1">
              {/* Table Header Strip */}
              <div className="border-b border-border/70 pb-1.5 flex justify-between items-center text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
                <span>{isEn ? "ITEM & SERVICE" : "ITEM & LAYANAN"}</span>
                <span>{isEn ? "PRICE" : "HARGA"}</span>
              </div>

              {/* Item Rows */}
              <div className="divide-y divide-border/25">
                {resolvedItems.map((it, idx) => (
                  <div key={idx} className="py-1.5 flex justify-between items-start gap-3">
                    <div className="flex items-baseline gap-1.5 min-w-0 pr-2">
                      {resolvedItems.length > 1 && (
                        <span className="text-xs font-medium text-muted-foreground select-none shrink-0">
                          {idx + 1}.
                        </span>
                      )}
                      <p className="font-semibold text-[13px] text-foreground leading-snug">
                        {it.name}
                      </p>
                    </div>
                    <span className="font-semibold text-[13px] text-foreground shrink-0 whitespace-nowrap">
                      {formatIDR(it.price)}
                    </span>
                  </div>
                ))}
              </div>

              {cleanNotes && !cleanNotes.startsWith("{") ? (
                <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                  {cleanNotes}
                </p>
              ) : null}
            </div>

            {/* Pricing Breakdown (Subtotal, Discounts, Total) */}
            <div className="space-y-2.5 pt-1">
              <div className="border-b border-dashed border-border/60 my-1" />

              {/* Subtotal */}
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span className="font-semibold tracking-wider uppercase text-[11px]">
                  SUBTOTAL
                </span>
                <span className="font-semibold text-foreground text-xs">
                  {formattedSubtotal}
                </span>
              </div>

              {/* Transport Fee if any */}
              {Number(invoice.transport_fee || 0) > 0 && (
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span className="font-medium tracking-wider uppercase text-[10.5px]">
                    {isEn ? "TRANSPORT FEE" : "BIAYA TRANSPORT"}
                  </span>
                  <span className="font-semibold text-foreground text-xs">
                    {formattedTransport}
                  </span>
                </div>
              )}

              {/* Additional Charge if any */}
              {effectiveAdditionalCharge > 0 && (
                <div className="space-y-0.5 text-xs">
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span className="font-medium tracking-wider uppercase text-[10.5px]">
                      {isEn ? "ADDITIONAL CHARGE" : "BIAYA TAMBAHAN"}
                    </span>
                    <span className="font-semibold text-foreground text-xs">
                      {formattedAdditionalCharge}
                    </span>
                  </div>
                  {effectiveAdditionalChargeDesc ? (
                    <div className="pl-2 text-[10.5px] text-muted-foreground font-medium">
                      └ {effectiveAdditionalChargeDesc}
                    </div>
                  ) : null}
                </div>
              )}

              {/* Discount Applied */}
              {Number(invoice.discount || 0) > 0 && (
                <div className="space-y-0.5 text-xs">
                  <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
                    <span className="inline-flex items-center gap-1 uppercase tracking-wider text-[10.5px]">
                      <Tag className="w-3 h-3" /> {isEn ? "DISCOUNT APPLIED" : "DISKON DIGUNAKAN"}
                    </span>
                    <span className="font-bold">-{formattedDiscount}</span>
                  </div>
                  {displayDiscountName && (
                    <div className="pl-4 text-[10.5px] text-emerald-600 dark:text-emerald-400 font-medium">
                      └ {displayDiscountName}
                    </div>
                  )}
                </div>
              )}

              {/* Prominent TOTAL BAYAR Banner (Signature Brand Terracotta Brown) */}
              <div className="w-full bg-[#8b5e3c] text-white px-4 py-3 rounded-xl rounded-bl-none flex items-center justify-between shadow-xs mt-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-0.5 h-4 bg-white/40 rounded-full" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    {isEn ? "TOTAL AMOUNT" : "TOTAL BAYAR"}
                  </span>
                </div>
                <span className="text-xl font-bold italic tracking-tight text-white">
                  {formattedTotal}
                </span>
              </div>
            </div>

            {/* Minimalist Footer */}
            <div className="pt-3 border-t border-border/60 text-center space-y-1">
              <p className="text-[11px] font-medium text-foreground">
                {displayFooterNote}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {displaySupportText}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
