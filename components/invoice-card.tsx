"use client";

import * as React from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale/id";
import { enUS as localeEn } from "date-fns/locale/en-US";
import {
  Share2,
  Printer,
  Copy,
  Check,
  Phone,
  Calendar,
  Clock,
  MapPin,
} from "lucide-react";
import { useLocaleState } from "ra-core";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useBrandSettings, cleanWhatsAppNumber } from "@/lib/brand-settings";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface InvoiceData {
  id?: number | string;
  invoice_number: string;
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
  total_amount: number;
  payment_method?: string;
  payment_status?: string;
  notes?: string;
  created_at?: string;
}

export interface InvoiceCardProps {
  invoice: InvoiceData;
  showShareActions?: boolean;
  className?: string;
  publicMode?: boolean;
  forcedLocale?: "id" | "en";
}

/**
 * Minimalist luxury watermark background with repeating Serena Raga emblems
 * tilted diagonally from bottom-left to top-right (-28deg).
 */
const InvoiceWatermark = () => {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0"
    >
      <svg
        className="w-full h-full opacity-[0.04] dark:opacity-[0.055] text-foreground"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="serena-diagonal-watermark"
            width="220"
            height="110"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-28)"
          >
            {/* Serena Logo Lotus Symbol */}
            <g transform="translate(16, 24) scale(0.065)">
              <path
                fill="currentColor"
                d="M 95.3125 855.527344 C 131.660156 845.808594 172.097656 849.09375 216.457031 864.730469 C 262.976562 881.144531 268.746094 881.65625 310.886719 859.035156 C 336.074219 845.503906 362.039062 834.925781 392.230469 840.402344 C 418.679688 845.199219 426.027344 856.898438 450.300781 835.328125 C 497.210938 793.660156 527.417969 825.917969 512.683594 874.558594 C 540.046875 833.832031 502.882812 767.515625 442.496094 828.355469 C 425.515625 845.460938 412.554688 834.636719 393.089844 829.839844 C 362.425781 822.296875 331.417969 831.238281 300.269531 846.253906 C 261.246094 865.0625 261.703125 866.046875 217.871094 853.171875 C 166.136719 837.992188 126.75 840.945312 95.3125 855.527344 "
              />
              <path
                fill="currentColor"
                d="M 417.03125 854.710938 C 465.464844 864.355469 505.292969 905.792969 545.453125 881.1875 C 500.164062 890.722656 464.96875 849.636719 417.03125 854.710938 "
              />
              <path
                fill="currentColor"
                d="M 230.46875 851.175781 C 256.214844 828.507812 252.554688 774.585938 253.109375 754.136719 C 253.523438 738.570312 256.0625 724.472656 270.589844 716.070312 C 295.527344 701.652344 296.511719 709.070312 303.664062 677.90625 C 305.730469 668.898438 307.367188 659.304688 309.722656 650.683594 C 322.03125 605.644531 379.867188 630.136719 361.316406 676.703125 C 351.78125 700.613281 326.675781 729.449219 308.140625 697.425781 C 315.171875 737.667969 357.671875 713.367188 370.039062 680.265625 C 389.792969 627.40625 318.511719 594.207031 302.777344 649.824219 C 300.378906 658.304688 298.5625 667.273438 296.304688 675.855469 C 290.648438 697.246094 290.09375 694.570312 271.726562 702.582031 C 247.078125 713.328125 243.640625 730.390625 242.808594 754.648438 C 242.046875 777.175781 244.402344 820.511719 230.46875 851.175781 "
              />
            </g>
            {/* Minimalist Watermark Brand Text */}
            <text
              x="58"
              y="48"
              fontSize="9"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="700"
              letterSpacing="0.22em"
              fill="currentColor"
            >
              SERENA RAGA
            </text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#serena-diagonal-watermark)" />
      </svg>
    </div>
  );
};

/**
 * Clean & Minimalist Serena Raga Invoice & Nota Card component.
 * Unified with shadcn/ui dashboard design system with shadow-none flat luxury style.
 */
export const InvoiceCard = ({
  invoice,
  showShareActions = true,
  className,
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

  const formattedTotal = new Intl.NumberFormat(isEn ? "en-US" : "id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(invoice.total_amount) || 0);

  const formattedSubtotal = new Intl.NumberFormat(isEn ? "en-US" : "id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(invoice.subtotal) || 0);

  const formattedDiscount = new Intl.NumberFormat(isEn ? "en-US" : "id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(invoice.discount) || 0);

  const formattedTransport = new Intl.NumberFormat(isEn ? "en-US" : "id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(invoice.transport_fee) || 0);

  // Date formatting
  const rawDate = invoice.booking_date ? new Date(invoice.booking_date) : new Date();
  const formattedDate = format(rawDate, "dd MMMM yyyy", {
    locale: isEn ? localeEn : localeId,
  });

  // Public Invoice URL
  const publicInvoiceUrl = React.useMemo(() => {
    if (typeof window === "undefined") return "";
    const origin = window.location.origin;
    return `${origin}/invoice/${invoice.invoice_number || invoice.id || "preview"}`;
  }, [invoice.invoice_number, invoice.id]);

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
      .replace(/\{booking_time\}/g, invoice.booking_time ? `${invoice.booking_time} WIB` : "")
      .replace(/\{payment_status\}/g, invoice.payment_status === "paid" ? (isEn ? "PAID / LUNAS" : "LUNAS") : (isEn ? "UNPAID" : "BELUM LUNAS"))
      .replace(/\{invoice_url\}/g, publicInvoiceUrl)
      .replace(/\{admin_phone\}/g, formattedPhone);

    const waUrl = rawPhone
      ? `https://wa.me/${rawPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(waUrl, "_blank");
  };

  const handlePrint = () => {
    window.print();
  };

  const isPaid = invoice.payment_status === "paid";

  return (
    <div className={cn("space-y-4", className)}>
      {/* Top Action Bar (Flat shadcn styling matching Dashboard) */}
      {showShareActions && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-muted/40 border border-border/70 rounded-xl shadow-none print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-foreground px-2 py-0.5 rounded-md border border-border bg-background shadow-none">
              {invoice.invoice_number}
            </span>
            <span className="text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-md border border-border bg-background text-muted-foreground shadow-none">
              {isPaid ? (isEn ? "Paid" : "Lunas") : isEn ? "Unpaid" : "Belum Lunas"}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="h-8 text-xs gap-1.5 shadow-none border-border"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-foreground" /> : <Copy className="w-3.5 h-3.5" />}
              {isEn ? "Copy Link" : "Salin Link"}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-8 text-xs gap-1.5 shadow-none border-border"
            >
              <Printer className="w-3.5 h-3.5" />
              {isEn ? "Print / PDF" : "Cetak Nota"}
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleShareWhatsApp}
              className="h-8 text-xs gap-1.5 bg-foreground hover:bg-foreground/90 text-background font-medium shadow-none"
            >
              <Share2 className="w-3.5 h-3.5" />
              {isEn ? "Share WA" : "Kirim WhatsApp"}
            </Button>
          </div>
        </div>
      )}

      {/* Clean Minimalist Nota Card (Shadow-none flat shadcn Card) */}
      <Card
        id="invoice-document"
        className="relative bg-card text-card-foreground border border-border/70 rounded-xl p-6 sm:p-8 shadow-none overflow-hidden print:border-none print:shadow-none print:p-0"
      >
        {/* Subtle Watermark Background */}
        <InvoiceWatermark />

        {/* Content Container (z-10 over watermark) */}
        <div className="relative z-10 space-y-6">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-border/60">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <BrandLogo variant="full" className="h-7 w-auto text-foreground" />
              </div>
              <p className="text-[11px] tracking-wider text-muted-foreground uppercase font-medium">
                {settings.tagline || "comfortable home massage"}
              </p>
              <p className="text-[11px] text-muted-foreground/80 mt-0.5 font-sans">
                WhatsApp: {formattedPhone} • {settings.website_url ? settings.website_url.replace(/^https?:\/\//, "") : "serenaraga.com"}
              </p>
            </div>

            <div className="sm:text-right space-y-0.5">
              <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase block">
                {isEn ? "INVOICE NUMBER" : "NOMOR INVOICE"}
              </span>
              <div className="text-base font-bold tracking-tight text-foreground">
                {invoice.invoice_number}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {isEn ? "Issued:" : "Diterbitkan:"}{" "}
                <span className="text-foreground font-medium">{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Client & Appointment Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            {/* Left: Client */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                {isEn ? "CLIENT" : "PELANGGAN"}
              </span>
              <p className="text-sm font-semibold text-foreground pt-0.5">
                {invoice.customer_name || (isEn ? "General Client" : "Pelanggan")}
              </p>
              {invoice.customer_phone && (
                <p className="text-xs text-muted-foreground">
                  {invoice.customer_phone}
                </p>
              )}
              {invoice.service_address && (
                <p className="text-xs text-muted-foreground pt-0.5 leading-relaxed">
                  {invoice.service_address}
                </p>
              )}
            </div>

            {/* Right: Appointment Schedule & Status */}
            <div className="space-y-1 sm:text-right">
              <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                {isEn ? "APPOINTMENT DETAILS" : "DETAIL JADWAL"}
              </span>
              <p className="text-sm font-semibold text-foreground pt-0.5">
                {formattedDate} {invoice.booking_time ? `• ${invoice.booking_time} WIB` : ""}
              </p>
              <div className="pt-1.5 flex sm:justify-end">
                <span className="text-[10px] font-medium tracking-wider uppercase px-2 py-0.5 rounded-md border border-border/70 bg-muted/40 text-muted-foreground inline-block shadow-none">
                  {isPaid ? (isEn ? "Paid" : "Lunas") : isEn ? "Unpaid" : "Belum Lunas"}
                </span>
              </div>
            </div>
          </div>

          {/* Clean Itemized Table */}
          <div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/60 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                  <th className="pb-2.5">{isEn ? "ITEM DESCRIPTION" : "RINCIAN LAYANAN"}</th>
                  <th className="pb-2.5 text-right">{isEn ? "AMOUNT" : "JUMLAH"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                <tr>
                  <td className="py-3 pr-4">
                    <p className="font-medium text-foreground text-xs sm:text-sm">
                      {invoice.service_name || (isEn ? "Home Massage Service" : "Layanan Pijat di Rumah")}
                    </p>
                    {invoice.notes && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        {invoice.notes}
                      </p>
                    )}
                  </td>
                  <td className="py-3 text-right font-semibold text-xs sm:text-sm text-foreground align-top">
                    {formattedSubtotal}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pricing Summary & Payment Method */}
          <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row justify-between items-start gap-6 text-xs">
            {/* Payment Method */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                {isEn ? "PAYMENT METHOD" : "METODE PEMBAYARAN"}
              </span>
              <p className="text-xs font-medium text-foreground capitalize">
                {invoice.payment_method === "qris"
                  ? "QRIS (Instant Pay)"
                  : invoice.payment_method === "bank_transfer"
                    ? isEn ? "Bank Transfer" : "Transfer Bank"
                    : isEn ? "Cash on Service" : "Tunai (Cash)"}
              </p>
            </div>

            {/* Totals Breakdown */}
            <div className="w-full sm:w-60 space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span className="text-[11px]">{isEn ? "Subtotal" : "Subtotal"}</span>
                <span className="font-medium">{formattedSubtotal}</span>
              </div>

              {Number(invoice.transport_fee || 0) > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span className="text-[11px]">{isEn ? "Transport" : "Biaya Transport"}</span>
                  <span className="font-medium">+{formattedTransport}</span>
                </div>
              )}

              {Number(invoice.discount || 0) > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span className="text-[11px]">{isEn ? "Discount" : "Diskon"}</span>
                  <span className="font-medium">-{formattedDiscount}</span>
                </div>
              )}

              <div className="flex justify-between items-baseline pt-2.5 border-t border-border text-sm font-bold text-foreground">
                <span className="text-xs uppercase tracking-wider">{isEn ? "Total" : "Total Biaya"}</span>
                <span className="text-base text-foreground font-bold">{formattedTotal}</span>
              </div>
            </div>
          </div>

          {/* Minimalist Footer */}
          <div className="pt-5 border-t border-border/40 text-center space-y-1">
            <p className="text-[11px] font-medium text-foreground">
              {settings.invoice_footer_note ||
                (isEn
                  ? "Thank you for relaxing with Serena Raga."
                  : "Terima kasih telah mempercayakan relaksasi Anda pada Serena Raga.")}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {(
                settings.invoice_support_text ||
                (isEn
                  ? "This is an official transaction record. For support, WhatsApp {whatsapp}."
                  : "Dokumen ini merupakan bukti transaksi resmi. Layanan pelanggan WhatsApp {whatsapp}.")
              ).replace(/\{whatsapp\}/g, formattedPhone)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
