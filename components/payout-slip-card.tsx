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
  Building,
  User,
  Wallet,
  ReceiptText,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
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
  therapist_fee: number;
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

  const handlePrint = () => {
    window.print();
  };

  const handleCopyBankAccount = () => {
    if (payout.bank_account_number) {
      navigator.clipboard.writeText(payout.bank_account_number);
      setCopiedBank(true);
      toast.success(isEn ? "Bank account number copied!" : "Nomor rekening berhasil disalin!");
      setTimeout(() => setCopiedBank(false), 2000);
    }
  };

  const generateWhatsAppMessage = () => {
    return (
      `*SLIP BAGI HASIL TERAPIS - ${brandName.toUpperCase()}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📄 *No. Slip:* ${payout.payout_number}\n` +
      `💆 *Terapis:* ${payout.therapist_name}\n` +
      `📅 *Periode:* ${payout.period_start} s/d ${payout.period_end}\n` +
      `🔢 *Total Booking:* ${payout.total_bookings} Pesanan\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💵 *Omzet Kotor:* ${formatCurrency(gross)}\n` +
      `🏷️ *Skema Bagi Hasil (${rate}%):* ${formatCurrency(therapistFee)}\n` +
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
    <div className={cn("space-y-4 max-w-2xl mx-auto", className)}>
      {/* Action Toolbar (Hidden when printing) */}
      {showShareActions && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-muted/30 border border-border/70 rounded-xl print:hidden">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <ReceiptText className="w-4 h-4 text-primary" />
            <span>{isEn ? "Payout Slip Actions:" : "Aksi Slip Bagi Hasil:"}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-8 text-xs gap-1.5 shadow-none cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{isEn ? "Print / PDF" : "Cetak Slip (PDF)"}</span>
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

      {/* Official Payout Slip Card Document */}
      <Card className="border border-border/80 bg-card shadow-sm rounded-xl overflow-hidden print:border-none print:shadow-none">
        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Header Branding */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-border/70">
            <div className="space-y-1">
              <BrandLogo className="h-7 w-auto" />
              <p className="text-[11px] text-muted-foreground">
                {settings.tagline || "Professional Home Massage & Wellness Service"}
              </p>
            </div>
            <div className="text-left sm:text-right space-y-0.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                {isEn ? "Payout Slip" : "Slip Bagi Hasil"}
              </span>
              <span className="text-sm font-bold font-mono text-foreground block">
                {payout.payout_number}
              </span>
              <div className="pt-1 text-xs text-muted-foreground font-medium">
                <span>
                  {payout.payment_status === "paid"
                    ? isEn ? "Disbursed" : "Sudah Ditransfer"
                    : isEn ? "Pending" : "Menunggu Transfer"}
                </span>
              </div>
            </div>
          </div>

          {/* Therapist & Period Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2 p-3.5 rounded-lg bg-muted/25 border border-border/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" />
                <span>{isEn ? "Therapist Profile" : "Data Terapis"}</span>
              </span>
              <div>
                <p className="font-bold text-sm text-foreground">{payout.therapist_name}</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {payout.therapist_phone || "-"}
                </p>
              </div>
            </div>

            <div className="space-y-2 p-3.5 rounded-lg bg-muted/25 border border-border/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>{isEn ? "Disbursement Period" : "Periode Rekap"}</span>
              </span>
              <div>
                <p className="font-bold text-sm text-foreground capitalize">
                  {payout.period_type ? `${payout.period_type}` : "Monthly"}
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {payout.period_start} s/d {payout.period_end}
                </p>
              </div>
            </div>
          </div>

          {/* Financial Calculation Breakdown Table */}
          <div className="space-y-3 pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ReceiptText className="w-3.5 h-3.5 text-primary" />
              <span>{isEn ? "Financial Calculation Breakdown" : "Rincian Perhitungan Bagi Hasil"}</span>
            </span>

            <div className="rounded-lg border border-border/80 overflow-hidden">
              <div className="divide-y divide-border/60 text-xs">
                <div className="flex items-center justify-between p-3 bg-muted/20">
                  <span className="text-muted-foreground font-medium">
                    {isEn ? "Total Completed Bookings:" : "Total Pesanan Booking Selesai:"}
                  </span>
                  <span className="font-bold text-foreground">
                    {payout.total_bookings} {isEn ? "Bookings" : "Pesanan"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3">
                  <span className="text-muted-foreground font-medium">
                    {isEn ? "Total Gross Revenue:" : "Total Nilai Omzet Kotor:"}
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(gross)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/20">
                  <span className="text-foreground font-medium">
                    {isEn ? `Therapist Fee (${rate}%):` : `Bagi Hasil Terapis (${rate}%):`}
                  </span>
                  <span className="font-bold text-foreground text-sm">
                    {formatCurrency(therapistFee)}
                  </span>
                </div>

                {bonus > 0 && (
                  <div className="flex items-center justify-between p-3 text-emerald-700 dark:text-emerald-400 bg-emerald-500/5">
                    <span className="font-medium">
                      {isEn ? "Bonus / Client Tips:" : "Bonus / Tambahan Tips:"}
                    </span>
                    <span className="font-bold">+{formatCurrency(bonus)}</span>
                  </div>
                )}

                {deduction > 0 && (
                  <div className="flex items-center justify-between p-3 text-destructive bg-destructive/5">
                    <span className="font-medium">
                      {isEn ? "Deductions / Cash Advance:" : "Potongan / Kasbon / Biaya Lain:"}
                    </span>
                    <span className="font-bold">-{formatCurrency(deduction)}</span>
                  </div>
                )}

                {/* Net Payout Highlight Row */}
                <div className="flex items-center justify-between p-4 bg-primary/5 dark:bg-primary/10 border-t border-primary/20">
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      {isEn ? "TOTAL NET TRANSFER AMOUNT:" : "TOTAL TRANSFER BERSIH DITERIMA:"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {isEn ? "Amount successfully disbursed to therapist" : "Total hak bagi hasil bersih yang ditransfer"}
                    </span>
                  </div>
                  <span className="text-lg sm:text-xl font-black text-primary">
                    {formatCurrency(netAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Destination Bank Account Information Box */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-primary" />
                <span>{isEn ? "Destination Bank Account" : "Rekening Bank Tujuan Transfer"}</span>
              </span>
              {payout.bank_account_number && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyBankAccount}
                  className="h-6 text-[11px] gap-1 text-muted-foreground hover:text-foreground print:hidden cursor-pointer"
                >
                  {copiedBank ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600">{isEn ? "Copied" : "Disalin"}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>{isEn ? "Copy Account #" : "Salin No. Rekening"}</span>
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground block">{isEn ? "Bank" : "Nama Bank"}</span>
                <span className="font-bold text-foreground flex items-center gap-1 mt-0.5">
                  <Building className="w-3.5 h-3.5 text-muted-foreground" />
                  {payout.bank_name || "BCA"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">{isEn ? "Account Number" : "Nomor Rekening"}</span>
                <span className="font-bold font-mono text-foreground text-sm mt-0.5 block">
                  {payout.bank_account_number || "-"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">{isEn ? "Account Holder" : "Atas Nama"}</span>
                <span className="font-semibold text-foreground mt-0.5 block truncate">
                  {payout.bank_account_name || payout.therapist_name}
                </span>
              </div>
            </div>
          </div>

          {/* Optional Itemized Bookings Breakdown */}
          {payout.bookings_breakdown && payout.bookings_breakdown.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                {isEn ? "Itemized Bookings in Period" : "Daftar Booking Terlayani dalam Periode"}
              </span>
              <div className="rounded-lg border border-border/70 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 border-b border-border/60 text-[11px] text-muted-foreground">
                    <tr>
                      <th className="p-2.5 font-medium"># Booking</th>
                      <th className="p-2.5 font-medium">{isEn ? "Date / Time" : "Tanggal / Jam"}</th>
                      <th className="p-2.5 font-medium">{isEn ? "Service" : "Layanan"}</th>
                      <th className="p-2.5 font-medium text-right">{isEn ? "Gross" : "Nilai"}</th>
                      <th className="p-2.5 font-medium text-right">{isEn ? "Fee" : "Komisi"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {payout.bookings_breakdown.map((item, idx) => (
                      <tr key={item.id ?? idx} className="hover:bg-muted/20">
                        <td className="p-2.5 font-mono text-muted-foreground">#{item.id}</td>
                        <td className="p-2.5">
                          {item.booking_date} {item.booking_time ? `• ${item.booking_time}` : ""}
                        </td>
                        <td className="p-2.5 font-medium truncate max-w-[140px]">
                          {item.service_name || "Home Massage"}
                        </td>
                        <td className="p-2.5 text-right font-medium">
                          {formatCurrency(item.total_price)}
                        </td>
                        <td className="p-2.5 text-right font-bold text-primary">
                          {formatCurrency(item.therapist_fee)}
                        </td>
                      </tr>
                    ))}
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
  );
};
