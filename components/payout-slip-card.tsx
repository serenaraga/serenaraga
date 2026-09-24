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
  cardClassName?: string;
  borderless?: boolean;
  forcedLocale?: "id" | "en";
}

export const PayoutSlipCard = ({
  payout,
  showShareActions = true,
  className,
  cardClassName,
  borderless = false,
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
      (bonus > 0 ? `• *Bonus / Tips:* +${formatCurrency(bonus)}\n` : "") +
      (deduction > 0 ? `• *Potongan / Kasbon:* -${formatCurrency(deduction)}\n` : "") +
      (payout.notes && payout.notes.trim() !== "" ? `• *Catatan / Keterangan:* ${payout.notes}\n` : "") +
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
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-card border border-border rounded-xl shadow-none print:hidden">
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
            className={cn(
              "bg-card overflow-hidden print:border-none print:shadow-none w-[540px] ring-0",
              borderless
                ? "border-0 shadow-none bg-transparent rounded-none ring-0"
                : "border border-border rounded-xl shadow-none ring-0",
              cardClassName
            )}
          >
            <CardContent className="p-6 md:p-7 space-y-6">
              {/* Header Section (Seamless without divider border) */}
              <div className="flex flex-row items-start justify-between gap-4 pb-1">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <BrandLogo variant="full" className="h-8 w-auto text-foreground" />
                  </div>
                  <p className="text-[10px] tracking-[0.18em] font-semibold text-[#8b5e3c] dark:text-[#d49b6a] uppercase">
                    {settings.tagline === "Comfortable Home Massage & Spa" || !settings.tagline
                      ? isEn
                        ? "COMFORTABLE HOME MASSAGE"
                        : "COMFORTABLE HOME MASSAGE"
                      : settings.tagline.toUpperCase()}
                  </p>
                </div>

                <div className="text-right space-y-0.5 shrink-0">
                  <span className="inline-block px-2.5 py-0.5 bg-[#8b5e3c] text-white text-[10px] font-bold italic tracking-wider rounded-md shadow-xs">
                    {isEn ? "PAYOUT SLIP" : "PAYOUT SLIP"}
                  </span>
                  <p className="text-[11px] text-muted-foreground pt-1 font-medium">
                    {periodDisplay.title}
                  </p>
                </div>
              </div>

              {/* Recipient Section (DIBERIKAN KEPADA:) */}
              <div className="border-l-[3px] border-[#8b5e3c] dark:border-[#d49b6a] pl-3 py-0.5 space-y-0.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b5e3c] dark:text-[#d49b6a]">
                  {isEn ? "GIVEN TO:" : "DIBERIKAN KEPADA:"}
                </p>
                <h3 className="text-lg sm:text-xl font-bold uppercase text-foreground leading-snug tracking-tight">
                  {payout.therapist_name.toLowerCase().startsWith("terapis") || payout.therapist_name.toLowerCase().startsWith("therapist")
                    ? payout.therapist_name
                    : `TERAPIS ${payout.therapist_name}`}
                </h3>
                <p className="text-xs text-muted-foreground pt-0.5">
                  <span className="font-medium text-foreground">{payout.bank_name || "BCA"}</span> • {payout.bank_account_number || "-"}
                  {payout.bank_account_name && payout.bank_account_name !== payout.therapist_name ? (
                    <span className="opacity-80"> (a.n {payout.bank_account_name})</span>
                  ) : null}
                </p>
              </div>

              {/* Itemized Job List & Commission Calculation */}
              <div className="space-y-2 w-full pt-1">
                {/* Table Header Strip */}
                <div className="border-b border-border/70 pb-1.5 flex justify-between items-center text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
                  <span>{isEn ? "VISIT DETAILS / JOB" : "RINCIAN KUNJUNGAN / JOB"}</span>
                  <span>{isEn ? "COMMISSION" : "KOMISI"}</span>
                </div>

                {/* Job Items */}
                <div className="divide-y divide-dashed divide-border/60">
                  {payout.bookings_breakdown && payout.bookings_breakdown.length > 0 ? (
                    payout.bookings_breakdown.map((item, idx) => {
                      const commBase =
                        typeof item.commission_base === "number"
                          ? item.commission_base
                          : item.discount_amount && item.discount_amount > 0
                          ? Math.max(0, item.total_price - item.discount_amount)
                          : item.total_price;

                      // Extract clean percentage or formatted amount for formula
                      let discountFormulaPart = "";
                      if (item.discount_amount && item.discount_amount > 0) {
                        const percentMatch = item.applied_promo_name?.match(/(\d+(?:\.\d+)?)\s*%/);
                        if (percentMatch) {
                          discountFormulaPart = `${percentMatch[1]}%`;
                        } else if (item.total_price > 0) {
                          const calculatedPercent = Math.round((item.discount_amount / item.total_price) * 100);
                          if (calculatedPercent > 0 && Math.abs(calculatedPercent - (item.discount_amount / item.total_price) * 100) < 0.1) {
                            discountFormulaPart = `${calculatedPercent}%`;
                          } else {
                            discountFormulaPart = formatCurrency(item.discount_amount);
                          }
                        } else {
                          discountFormulaPart = formatCurrency(item.discount_amount);
                        }
                      }

                      const formulaText =
                        item.discount_amount && item.discount_amount > 0
                          ? `( ${formatCurrency(item.total_price)} - ${discountFormulaPart} ) × ${payout.commission_rate}%`
                          : `${formatCurrency(commBase)} × ${payout.commission_rate}%`;

                      // Direct clean date/time formatting without redundant label prefix
                      let formattedItemDate = item.booking_date || "";
                      try {
                        if (item.booking_date && item.booking_date.includes("-")) {
                          const parsed = new Date(item.booking_date);
                          if (!isNaN(parsed.getTime())) {
                            formattedItemDate = format(parsed, "dd/MM/yyyy", { locale: isEn ? localeEn : localeId });
                          }
                        }
                      } catch {
                        formattedItemDate = item.booking_date || "";
                      }

                      const dateTimeText = item.booking_time
                        ? `${formattedItemDate} • ${item.booking_time}`
                        : formattedItemDate;

                      return (
                        <div key={item.id ?? idx} className="py-2.5 space-y-1">
                          {/* Row 1: Client Name & Commission Amount */}
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-sm text-foreground">
                                {item.customer_name || (isEn ? "Client" : "Pelanggan")}
                              </span>
                              {item.applied_promo_name && (
                                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                  ( {item.applied_promo_name} )
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-sm text-foreground shrink-0 whitespace-nowrap">
                              {formatCurrency(item.therapist_fee)}
                            </span>
                          </div>

                          {/* Row 2: Service Name */}
                          <p className="text-[11px] text-muted-foreground leading-tight">
                            {item.service_name || (isEn ? "Home Massage" : "Layanan Pijat")}
                          </p>

                          {/* Row 3: Date, Time & Multiplier Breakdown (Clean & Concise) */}
                          <p className="text-[10px] text-muted-foreground/80 leading-tight">
                            {dateTimeText} • {formulaText}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    /* Fallback when breakdown snapshot is empty */
                    <div className="py-2.5 space-y-1">
                      <div className="flex justify-between items-start gap-4">
                        <span className="font-bold text-sm text-foreground">
                          {payout.total_bookings} {isEn ? "Completed Bookings" : "Pesanan Terlayani"}
                        </span>
                        <span className="font-bold text-sm text-foreground shrink-0 whitespace-nowrap">
                          {formatCurrency(therapistFee)}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        {isEn ? "Home Massage Services" : "Layanan Pijat di Rumah"}
                      </p>
                      <p className="text-[10px] text-muted-foreground/80 leading-tight">
                        {periodDisplay.title} • {formatCurrency(gross)} × {payout.commission_rate}%
                      </p>
                    </div>
                  )}
                </div>

                {/* Additional Adjustments (Bonus & Deductions) if any */}
                {(bonus > 0 || deduction > 0) && (
                  <div className="pt-2 space-y-1 border-t border-dashed border-border/60">
                    {bonus > 0 && (
                      <div className="flex justify-between items-center text-[11px] font-semibold text-foreground">
                        <span>{isEn ? "Bonus / Client Tips" : "Bonus / Tambahan Tips"}</span>
                        <span>+{formatCurrency(bonus)}</span>
                      </div>
                    )}
                    {deduction > 0 && (
                      <div className="flex justify-between items-center text-[11px] font-semibold text-foreground">
                        <span>{isEn ? "Deductions / Cash Advance" : "Potongan / Kasbon"}</span>
                        <span>-{formatCurrency(deduction)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Optional Payout Notes (e.g. notes for bonus, kasbon, or adjustment) */}
                {payout.notes && payout.notes.trim() !== "" && (
                  <div className="pt-1.5 space-y-0.5">
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground block">
                      {isEn ? "NOTES / ADJUSTMENT DETAILS:" : "CATATAN / KETERANGAN PENYESUAIAN:"}
                    </span>
                    <p className="text-[10px] text-foreground font-normal leading-relaxed whitespace-pre-wrap">
                      {payout.notes}
                    </p>
                  </div>
                )}

                {/* Prominent TAKE HOME PAY Banner (Matching user screenshot) */}
                <div className="w-full bg-[#241c17] text-white px-4 py-3.5 rounded-xl rounded-bl-none flex items-center justify-between shadow-xs mt-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-0.5 h-4 bg-white/40 rounded-full" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      TAKE HOME PAY
                    </span>
                  </div>
                  <span className="text-xl font-bold italic tracking-tight text-white">
                    {formatCurrency(netAmount)}
                  </span>
                </div>
              </div>

              {/* Minimalist Footer (Permanent Appreciation Note) */}
              <div className="pt-3 border-t border-border/60 text-center space-y-1">
                <p className="text-[11px] font-medium text-foreground">
                  {isEn ? "Remuneration statement generated by Serena Raga Management." : "Slip rekap bagi hasil resmi diterbitkan oleh Manajemen Serena Raga."}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {isEn ? "Thank you for your exceptional wellness service & dedication." : "Terima kasih atas dedikasi dan pelayanan relaksasi terbaik Anda bersama Serena Raga."}
                </p>
              </div>
            </CardContent>
          </Card>
      </div>
      </div>
    </div>
  );
};
