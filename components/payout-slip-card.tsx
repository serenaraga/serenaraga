"use client";

import * as React from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale/id";
import { enUS as localeEn } from "date-fns/locale/en-US";
import {
  Share2,
  Download,
  Loader2,
  Copy,
  Check,
  Phone,
  Calendar,
  Building,
  User,
  Wallet,
  ReceiptText,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { toPng } from "html-to-image";
import { useLocaleState } from "ra-core";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBrandSettings, cleanWhatsAppNumber } from "@/lib/brand-settings";
import { BrandLogo } from "@/components/brand-logo";
import { cn, formatIDR } from "@/lib/utils";
import { toast } from "sonner";

export interface BookingBreakdownItem {
  id: number | string;
  booking_date: string;
  booking_time?: string;
  service_name?: string;
  customer_name?: string;
  total_price: number;
  discount_amount?: number;
  applied_promo_name?: string;
  is_post_discount?: boolean;
  commission_base?: number;
  therapist_fee: number;
  invoice_number?: string;
}

export interface PayoutSlipData {
  id?: number | string;
  payout_number: string;
  therapist_id?: number | string | null;
  therapist_name: string;
  therapist_phone?: string;
  period_type?: string; // 'daily' | 'weekly' | 'monthly' | 'custom'
  period_start: string;
  period_end: string;
  total_bookings: number;
  gross_amount: number;
  commission_rate: number;
  therapist_fee: number;
  company_fee?: number;
  bonus_amount?: number;
  deduction_amount?: number;
  net_amount: number;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  payment_status?: string; // 'paid' | 'pending'
  payment_date?: string;
  notes?: string;
  created_at?: string;
  bookings_breakdown?: BookingBreakdownItem[];
}

export interface PayoutSlipCardProps {
  payout: PayoutSlipData;
  showShareActions?: boolean;
  className?: string;
  forcedLocale?: "id" | "en";
}

export const PayoutSlipCard = ({
  payout,
  showShareActions = true,
  className,
  forcedLocale,
}: PayoutSlipCardProps) => {
  const [globalLocale] = useLocaleState();
  const activeLocale = forcedLocale || globalLocale || "id";
  const isEn = activeLocale === "en";
  const { settings } = useBrandSettings();

  const [copiedBank, setCopiedBank] = React.useState(false);
  const [copiedText, setCopiedText] = React.useState(false);

  const brandName = settings.brand_name || "Serena Raga";
  const gross = Number(payout.gross_amount || 0);
  const rate = Number(payout.commission_rate || 60);
  const therapistFee = Number(payout.therapist_fee || (gross * rate) / 100);
  const companyFee = Number(payout.company_fee || Math.max(0, gross - therapistFee));
  const bonus = Number(payout.bonus_amount || 0);
  const deduction = Number(payout.deduction_amount || 0);
  const netAmount = Number(payout.net_amount || therapistFee + bonus - deduction);

  const formatCurrency = formatIDR;

  const cardRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);
  const [wrapperHeight, setWrapperHeight] = React.useState<number | undefined>(undefined);
  const [isDownloading, setIsDownloading] = React.useState(false);

  const updateScale = React.useCallback(() => {
    if (containerRef.current && cardRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const targetWidth = 540;
      if (containerWidth < targetWidth && containerWidth > 0) {
        const newScale = containerWidth / targetWidth;
        setScale(newScale);
        setWrapperHeight(cardRef.current.offsetHeight * newScale);
      } else {
        setScale(1);
        setWrapperHeight(undefined);
      }
    }
  }, []);

  React.useEffect(() => {
    updateScale();
    window.addEventListener("resize", updateScale);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && cardRef.current) {
      ro = new ResizeObserver(updateScale);
      ro.observe(cardRef.current);
      if (containerRef.current) ro.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateScale);
      ro?.disconnect();
    };
  }, [updateScale]);

  const handleDownloadPng = async () => {
    if (!cardRef.current) return;

    setIsDownloading(true);
    const toastId = toast.loading(
      isEn
        ? "Generating high-resolution payout slip..."
        : "Membuat slip bagi hasil gambar resolusi tajam..."
    );

    try {
      // Short delay to ensure DOM and fonts settle
      await new Promise((resolve) => setTimeout(resolve, 100));

      const isDark = document.documentElement.classList.contains("dark");
      const backgroundColor = isDark ? "#18181b" : "#ffffff";

      // 3x HD scaling for ultra crisp & clean text rendering
      const dataUrl = await toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 3,
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

      const safeTherapistName = (payout.therapist_name || "Terapis")
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, "_");
      const safeSlipNumber = (payout.payout_number || "Slip")
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, "_");
      const fileName = `Slip-Bagi-Hasil-${safeSlipNumber}-${safeTherapistName}.png`;

      const link = document.createElement("a");
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(
        isEn
          ? "Payout slip PNG downloaded successfully!"
          : "Slip bagi hasil berhasil diunduh (PNG resolusi tajam)!",
        { id: toastId }
      );
    } catch (err) {
      console.error("Payout PNG export error:", err);
      toast.error(
        isEn ? "Failed to download image" : "Gagal mengunduh gambar slip bagi hasil",
        { id: toastId }
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyBankAccount = () => {
    if (payout.bank_account_number) {
      navigator.clipboard.writeText(payout.bank_account_number);
      setCopiedBank(true);
      toast.success(isEn ? "Bank account number copied!" : "Nomor rekening berhasil disalin!");
      setTimeout(() => setCopiedBank(false), 2000);
    }
  };

  // Professional date & period range formatting (replaces internal 'custom' label)
  const periodDisplay = React.useMemo(() => {
    if (!payout.period_start) return { title: "-", subtitle: "" };

    try {
      const startDate = new Date(payout.period_start);
      const endDate = payout.period_end ? new Date(payout.period_end) : startDate;
      const currentLocale = isEn ? localeEn : localeId;

      const isSameDay = payout.period_start === payout.period_end;
      const isSameMonth =
        startDate.getFullYear() === endDate.getFullYear() &&
        startDate.getMonth() === endDate.getMonth();
      const isSameYear = startDate.getFullYear() === endDate.getFullYear();

      let formattedRange = "";

      if (isSameDay) {
        formattedRange = format(startDate, "dd MMMM yyyy", { locale: currentLocale });
      } else if (isSameMonth) {
        const startDay = format(startDate, "dd", { locale: currentLocale });
        const endFormatted = format(endDate, "dd MMMM yyyy", { locale: currentLocale });
        formattedRange = `${startDay} – ${endFormatted}`;
      } else if (isSameYear) {
        const startFormatted = format(startDate, "dd MMM", { locale: currentLocale });
        const endFormatted = format(endDate, "dd MMM yyyy", { locale: currentLocale });
        formattedRange = `${startFormatted} – ${endFormatted}`;
      } else {
        const startFormatted = format(startDate, "dd MMM yyyy", { locale: currentLocale });
        const endFormatted = format(endDate, "dd MMM yyyy", { locale: currentLocale });
        formattedRange = `${startFormatted} – ${endFormatted}`;
      }

      // Determine clear, professional period subtitle
      let periodSubtitle = "";
      if (payout.period_type === "daily" || isSameDay) {
        periodSubtitle = isEn ? "Daily Payout" : "Rekap Harian";
      } else if (payout.period_type === "weekly") {
        periodSubtitle = isEn ? "Weekly Payout" : "Rekap Mingguan";
      } else if (payout.period_type === "monthly") {
        periodSubtitle = isEn ? "Monthly Payout" : "Rekap Bulanan";
      } else {
        periodSubtitle = isEn ? "Service Period" : "Periode Rekap Layanan";
      }

      return {
        title: formattedRange,
        subtitle: periodSubtitle,
      };
    } catch (err) {
      return {
        title: `${payout.period_start} – ${payout.period_end || payout.period_start}`,
        subtitle: isEn ? "Service Period" : "Periode Layanan",
      };
    }
  }, [payout.period_start, payout.period_end, payout.period_type, isEn]);

  const generateWhatsAppMessage = () => {
    return (
      `*SLIP BAGI HASIL TERAPIS - ${brandName.toUpperCase()}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📄 *No. Slip:* ${payout.payout_number}\n` +
      `💆 *Terapis:* ${payout.therapist_name}\n` +
      `📅 *Periode:* ${periodDisplay.title} (${periodDisplay.subtitle})\n` +
      `🔢 *Total Booking:* ${payout.total_bookings} Pesanan\n` +
      (bonus > 0 ? `✨ *Bonus / Tips:* +${formatCurrency(bonus)}\n` : "") +
      (deduction > 0 ? `🔻 *Potongan / Kasbon:* -${formatCurrency(deduction)}\n` : "") +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *TOTAL TRANSFER BERSIH:* *${formatCurrency(netAmount)}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🏦 *Bank Tujuan:* ${payout.bank_name || "BCA"}\n` +
      `💳 *No. Rekening:* ${payout.bank_account_number || "-"}\n` +
      `👤 *Atas Nama:* ${payout.bank_account_name || payout.therapist_name}\n` +
      `📅 *Tanggal Transfer:* ${payout.payment_date || new Date().toISOString().split("T")[0]}\n` +
      `✅ *Status:* ${payout.payment_status === "paid" ? "Sudah Ditransfer (LUNAS)" : "Menunggu Proses Transfer"}\n\n` +
      `_Terima kasih atas dedikasi dan kerja keras terbaik Anda bersama ${brandName}._`
    );
  };

  const handleCopyWhatsAppText = () => {
    const text = generateWhatsAppMessage();
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    toast.success(isEn ? "Payout summary copied to clipboard!" : "Rincian slip payout berhasil disalin!");
    setTimeout(() => setCopiedText(false), 2000);
  };

  const cleanPhone = payout.therapist_phone ? cleanWhatsAppNumber(payout.therapist_phone) : "";
  const waDirectUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(generateWhatsAppMessage())}`
    : `https://wa.me/?text=${encodeURIComponent(generateWhatsAppMessage())}`;

  return (
    <div className={cn("space-y-4 max-w-xl mx-auto w-full", className)}>
      {/* Action Toolbar (Hidden when exporting or printing) */}
      {showShareActions && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-muted/30 border border-border/70 rounded-none print:hidden">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <ReceiptText className="w-4 h-4 text-primary" />
            <span>{isEn ? "Payout Slip Actions:" : "Aksi Slip Bagi Hasil:"}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadPng}
              disabled={isDownloading}
              className="h-8 text-xs gap-1.5 shadow-none cursor-pointer"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{isEn ? "Downloading..." : "Mengunduh..."}</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{isEn ? "Download PNG" : "Unduh Gambar (PNG)"}</span>
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyWhatsAppText}
              className="h-8 text-xs gap-1.5 shadow-none cursor-pointer"
            >
              {copiedText ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">{isEn ? "Copied" : "Disalin"}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{isEn ? "Copy Summary" : "Salin Rincian"}</span>
                </>
              )}
            </Button>
            <a href={waDirectUrl} target="_blank" rel="noopener noreferrer">
              <Button
                type="button"
                size="sm"
                className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-none cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{isEn ? "Send WhatsApp" : "Kirim WhatsApp"}</span>
              </Button>
            </a>
          </div>
        </div>
      )}

      {/* Official Payout Slip Card Document (Auto-Scaled on Mobile to prevent horizontal scroll while keeping Desktop Layout & Download Ratio) */}
      <div
        ref={containerRef}
        className="w-full flex justify-center overflow-visible"
        style={{ height: wrapperHeight ? `${wrapperHeight}px` : undefined }}
      >
        <div
          style={{
            width: "540px",
            transform: scale < 1 ? `scale(${scale})` : undefined,
            transformOrigin: "top center",
          }}
          className="shrink-0 transition-transform duration-100 ease-out"
        >
          <Card
            ref={cardRef}
            className="border border-border/80 bg-card shadow-sm rounded-none overflow-hidden print:border-none print:shadow-none w-[540px]"
          >
            <CardContent className="p-6 md:p-7 space-y-5">
            {/* Header Branding */}
            <div className="flex flex-row items-center justify-between gap-4 pb-5 border-b border-border/70">
              <div className="space-y-1">
                <BrandLogo className="h-7 w-auto" />
                <p className="text-[11px] text-muted-foreground">
                  {settings.tagline || (isEn ? "Comfortable Home Massage & Spa" : "Layanan Pijat & Spa Profesional")}
                </p>
              </div>
              <div className="text-right space-y-0.5 shrink-0">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  {isEn ? "Payout Slip" : "Slip Bagi Hasil"}
                </span>
                <span className="text-sm font-bold font-mono text-foreground block">
                  {payout.payout_number}
                </span>
                <div className="pt-0.5 text-xs text-muted-foreground font-medium">
                  <span>
                    {payout.payment_status === "paid"
                      ? isEn ? "Disbursed" : "Sudah Ditransfer"
                      : isEn ? "Pending" : "Menunggu Transfer"}
                  </span>
                </div>
              </div>
            </div>

            {/* Therapist & Period Information */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <div className="px-2.5 py-1.5 bg-[#f6f3ee] dark:bg-[#26211c] text-[10px] font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 w-full">
                  <User className="w-3.5 h-3.5 text-[#8b5e3c] dark:text-[#d49b6a]" />
                  <span>{isEn ? "Therapist Profile" : "Data Terapis"}</span>
                </div>
                <div className="px-1 space-y-0.5">
                  <p className="font-bold text-sm text-foreground">{payout.therapist_name}</p>
                  {payout.therapist_phone && (
                    <p className="text-muted-foreground text-xs">
                      {payout.therapist_phone}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground pt-0.5 flex items-center flex-wrap gap-1">
                    <span className="font-medium text-foreground">{payout.bank_name || "BCA"}</span>
                    <span className="font-mono text-foreground">{payout.bank_account_number || "-"}</span>
                    {payout.bank_account_name && payout.bank_account_name !== payout.therapist_name ? (
                      <span className="opacity-80 text-muted-foreground">(a.n {payout.bank_account_name})</span>
                    ) : null}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="px-2.5 py-1.5 bg-[#f6f3ee] dark:bg-[#26211c] text-[10px] font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 w-full">
                  <Calendar className="w-3.5 h-3.5 text-[#8b5e3c] dark:text-[#d49b6a]" />
                  <span>{isEn ? "Disbursement Period" : "Periode Rekap"}</span>
                </div>
                <div className="px-1 space-y-0.5">
                  <p className="font-bold text-sm text-foreground">
                    {periodDisplay.title}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {periodDisplay.subtitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Calculation Breakdown Table */}
            <div className="space-y-2.5">
              <div className="px-3 py-1.5 bg-[#f6f3ee] dark:bg-[#26211c] text-[11px] font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <ReceiptText className="w-3.5 h-3.5 text-[#8b5e3c] dark:text-[#d49b6a]" />
                <span>{isEn ? "Financial Calculation Breakdown" : "Rincian Perhitungan Bagi Hasil"}</span>
              </div>

              <div className="px-1 text-xs divide-y divide-border/40">
                <div className="flex items-center justify-between py-3">
                  <span className="text-muted-foreground font-medium">
                    {isEn ? "Total Completed Bookings:" : "Total Pesanan Booking Selesai:"}
                  </span>
                  <span className="font-bold text-foreground">
                    {payout.total_bookings} {isEn ? "Bookings" : "Pesanan"}
                  </span>
                </div>

                {bonus > 0 && (
                  <div className="flex items-center justify-between py-3 text-emerald-700 dark:text-emerald-400">
                    <span className="font-medium">
                      {isEn ? "Bonus / Client Tips:" : "Bonus / Tambahan Tips:"}
                    </span>
                    <span className="font-bold">+{formatCurrency(bonus)}</span>
                  </div>
                )}

                {deduction > 0 && (
                  <div className="flex items-center justify-between py-3 text-destructive">
                    <span className="font-medium">
                      {isEn ? "Deductions / Cash Advance:" : "Potongan / Kasbon / Biaya Lain:"}
                    </span>
                    <span className="font-bold">-{formatCurrency(deduction)}</span>
                  </div>
                )}

                {/* Net Payout Highlight Row */}
                <div className="flex flex-row items-center justify-between gap-1.5 py-3.5 border-t border-primary/20">
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      {isEn ? "TOTAL NET TRANSFER AMOUNT:" : "TOTAL TRANSFER BERSIH DITERIMA:"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {isEn ? "Amount successfully disbursed to therapist" : "Total hak bagi hasil bersih yang ditransfer"}
                    </span>
                  </div>
                  <span className="text-xl font-black text-primary">
                    {formatCurrency(netAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Optional Itemized Bookings Breakdown (Compact & Slim Layout with Explicit Calculation Formula) */}
            {payout.bookings_breakdown && payout.bookings_breakdown.length > 0 && (
              <div className="space-y-1.5 w-full">
                <div className="px-3 py-1.5 bg-[#f6f3ee] dark:bg-[#26211c] text-[11px] font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 w-full">
                  <ReceiptText className="w-3.5 h-3.5 text-[#8b5e3c] dark:text-[#d49b6a]" />
                  <span>{isEn ? "Itemized Bookings in Period" : "Daftar Booking Terlayani dalam Periode"}</span>
                </div>

                <div className="w-full px-0.5">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#f6f3ee]/70 dark:bg-[#26211c]/70 text-[10px] text-neutral-800 dark:text-neutral-200 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-1.5 px-2 font-bold">{isEn ? "Booking & Service" : "Booking & Layanan"}</th>
                        <th className="py-1.5 px-2 text-right font-bold">{isEn ? "Price & Promo" : "Harga & Promo"}</th>
                        <th className="py-1.5 px-2 text-right font-bold">{isEn ? "Therapist Fee" : "Hak Komisi"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {payout.bookings_breakdown.map((item, idx) => {
                        const commBase =
                          typeof item.commission_base === "number"
                            ? item.commission_base
                            : item.discount_amount && item.discount_amount > 0
                            ? Math.max(0, item.total_price - item.discount_amount)
                            : item.total_price;

                        return (
                          <tr key={item.id ?? idx} className="hover:bg-muted/20 transition-colors">
                            {/* Column 1: Booking & Service Info (Stacked Vertically Downwards) */}
                            <td className="py-2 px-2 align-top pr-2 space-y-1">
                              <div>
                                <span className="font-bold text-foreground text-xs mr-1.5">#{item.id}</span>
                                <span className="font-semibold text-foreground text-xs">
                                  {item.service_name || "Home Massage"}
                                </span>
                              </div>
                              <div className="space-y-0.5 text-[10.5px] text-muted-foreground leading-tight">
                                <p>
                                  {item.booking_date} {item.booking_time ? `• ${item.booking_time}` : ""}
                                </p>
                                <p className="flex items-center gap-1">
                                  <User className="w-2.5 h-2.5 opacity-70 shrink-0" />
                                  <span>{item.customer_name || (isEn ? "Client" : "Pelanggan")}</span>
                                </p>
                                {item.invoice_number && (
                                  <p className="font-mono text-[9px] text-muted-foreground/80">
                                    {item.invoice_number}
                                  </p>
                                )}
                              </div>
                            </td>

                            {/* Column 2: Price & Promo */}
                            <td className="py-2 px-2 text-right align-top shrink-0 whitespace-nowrap space-y-0.5">
                              <span className="font-medium text-foreground text-xs block leading-tight">
                                {formatCurrency(item.total_price)}
                              </span>
                              {item.discount_amount && item.discount_amount > 0 ? (
                                <div className="leading-tight space-y-0.5">
                                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 block">
                                    -{formatCurrency(item.discount_amount)}
                                  </span>
                                  {item.applied_promo_name && (
                                    <span className="text-[8.5px] text-muted-foreground block truncate max-w-[95px] ml-auto opacity-80">
                                      {item.applied_promo_name}
                                    </span>
                                  )}
                                </div>
                              ) : null}
                            </td>

                            {/* Column 3: Therapist Fee & Multiplier Breakdown */}
                            <td className="py-2 px-2 text-right align-top shrink-0 whitespace-nowrap pl-2 space-y-0.5">
                              <span className="font-bold text-[#8b5e3c] dark:text-[#d49b6a] text-xs block leading-tight">
                                {formatCurrency(item.therapist_fee)}
                              </span>
                              <span className="text-[9.5px] text-muted-foreground font-mono block leading-tight pt-0.5">
                                {payout.commission_rate}% × {formatCurrency(commBase)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          {/* Footer Note */}
          <div className="pt-4 border-t border-border/60 text-center space-y-1">
            <p className="text-[11px] text-muted-foreground font-medium">
              {payout.notes || (isEn ? "Remuneration statement generated by Serena Raga Management." : "Slip rekap bagi hasil diterbitkan oleh Manajemen Serena Raga.")}
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              {brandName} • WhatsApp Support {settings.phone_number || settings.whatsapp_number || "+62 812-3456-7890"}
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
      </div>
    </div>
  );
};
