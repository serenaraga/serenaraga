"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReceiptText, ExternalLink, ArrowRight, Tag, Car, Sparkles, Users } from "lucide-react";
import { LinkBase, useRecordContext } from "ra-core";
import { formatIDR } from "@/lib/utils";
import type { BookingFinancialResult, BookingItemDetail } from "@/lib/financial-calculator";

interface BookingFinancialCardProps {
  fin: BookingFinancialResult;
  therapist: any;
  isEn: boolean;
  bookingId?: number | string;
}

/**
 * Detailed Financial Breakdown & Invoicing Status Card
 * Features luxury typography, clear visual hierarchy, and crystal-clear audit sections.
 */
export const BookingFinancialCard: React.FC<BookingFinancialCardProps> = ({
  fin,
  therapist,
  isEn,
  bookingId: propBookingId,
}) => {
  const record = useRecordContext();
  const effectiveBookingId = propBookingId || record?.id;

  return (
    <Card className="border border-border/70 shadow-none bg-card">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <ReceiptText className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                {fin.hasInvoice
                  ? isEn
                    ? "Financial Audit & Invoicing"
                    : "Audit Finansial & Faktur Transaksi"
                  : isEn
                    ? "Estimated Financial Audit"
                    : "Estimasi Finansial & Laba (Sebelum Faktur)"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {fin.hasInvoice
                  ? isEn
                    ? "Synchronized with official invoice settlement."
                    : "Rincian nilai dan bagi hasil terapis tersinkronisasi dengan faktur resmi."
                  : isEn
                    ? "Pre-invoice estimation based on booking data."
                    : "Estimasi awal. Terbitkan faktur untuk memfinalisasi diskon & biaya tambahan."}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {fin.hasInvoice ? (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-7 sm:h-8 text-xs gap-1.5 font-medium border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 cursor-pointer"
              >
                <LinkBase to={`/invoices/${fin.invoiceId}/show`}>
                  <span>{fin.invoiceNumber}</span>
                  <ExternalLink className="w-3 h-3" />
                </LinkBase>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-7 sm:h-8 text-xs gap-1.5 font-medium text-primary hover:bg-primary/10 cursor-pointer"
              >
                <LinkBase to={effectiveBookingId ? `/invoices/create?booking_id=${effectiveBookingId}` : "/invoices/create"}>
                  <ReceiptText className="w-3 h-3" />
                  <span>{isEn ? "Generate Invoice" : "Buat Nota / Faktur"}</span>
                  <ArrowRight className="w-3 h-3" />
                </LinkBase>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-5">
        {/* 1. Itemized Table if line items exist */}
        {fin.itemsList && fin.itemsList.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-primary" />
                {isEn ? "Itemized Services & Therapist Earnings" : "Rincian Layanan & Distribusi Hak Terapis"}
              </span>
              <span className="text-[11px] text-muted-foreground font-normal">
                {fin.itemsList.length} {isEn ? "Items" : "Layanan"}
              </span>
            </div>

            <div className="rounded-xl border border-border/60 overflow-hidden bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/30 text-[10px] font-semibold text-muted-foreground uppercase border-b border-border/50">
                    <tr>
                      <th className="py-2 px-3">{isEn ? "Service & Adjustments" : "Layanan & Penyesuaian"}</th>
                      <th className="py-2 px-3 text-right">{isEn ? "Base Price" : "Harga Dasar"}</th>
                      <th className="py-2 px-3">{isEn ? "Therapist & Rate" : "Terapis Bertugas"}</th>
                      <th className="py-2 px-3 text-right">{isEn ? "Net Therapist Share" : "Hak Bersih Terapis"}</th>
                      <th className="py-2 px-3 text-right">{isEn ? "BHP" : "BHP"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {fin.itemsList.map((item: BookingItemDetail, idx: number) => {
                      const isPureTransport =
                        item.name.toLowerCase().includes("transport") ||
                        item.name.toLowerCase().includes("ongkir") ||
                        item.name.toLowerCase().includes("travel") ||
                        (item.price > 0 && item.commission === item.price);

                      const itemPrice = Number(item.price || 0);
                      const itemRate = item.rate || fin.commissionRate;
                      const itemCharge = Number(item.additional_charge || 0);
                      const itemChargeShare = Number(
                        item.additional_charge_therapist_share !== undefined
                          ? item.additional_charge_therapist_share
                          : Math.round((itemCharge * itemRate) / 100)
                      );
                      const itemTransShare = Number(
                        item.transport_fee_therapist_share !== undefined
                          ? item.transport_fee_therapist_share
                          : item.transport_fee || 0
                      );
                      const itemDisc = Number(item.basis_deduction || 0);
                      const itemTotalFee = Number(item.commission || 0) + itemTransShare;

                      return (
                        <tr key={idx} className="hover:bg-muted/15 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-foreground text-xs">{item.name}</div>
                            
                            {/* Breakdown adjustments badges (Therapist's allocated shares) */}
                            <div className="flex items-center gap-1.5 flex-wrap pt-1">
                              {itemDisc > 0 && (
                                <span className="inline-flex items-center text-[9.5px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium">
                                  <Tag className="w-2.5 h-2.5 mr-1" />
                                  {isEn ? "Discount:" : "Diskon:"} -{formatIDR(itemDisc)}
                                </span>
                              )}
                              {itemChargeShare > 0 && (
                                <span className="inline-flex items-center text-[9.5px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-300 font-medium">
                                  +Charge {formatIDR(itemChargeShare)}
                                  {item.additional_charge_description ? ` (${item.additional_charge_description})` : ""}
                                </span>
                              )}
                              {itemTransShare > 0 && (
                                <span className="inline-flex items-center text-[9.5px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium">
                                  <Car className="w-2.5 h-2.5 mr-1" />
                                  +Transport {formatIDR(itemTransShare)}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-2.5 px-3 text-right font-medium text-foreground text-xs">
                            <div>{formatIDR(itemPrice)}</div>
                          </td>

                          <td className="py-2.5 px-3">
                            <div className="font-medium text-foreground text-xs">
                              {item.therapist || therapist?.name || "Terapis"}
                            </div>
                            <div className="text-[10px] text-muted-foreground pt-0.5 font-normal">
                              {isPureTransport
                                ? isEn ? "Reimbursement 100%" : "Reimbursement 100%"
                                : `${isEn ? "Rate:" : "Komisi:"} ${itemRate}%`}
                            </div>
                          </td>

                          <td className="py-2.5 px-3 text-right">
                            <div className="font-semibold text-amber-700 dark:text-amber-400 text-xs">
                              {formatIDR(itemTotalFee)}
                            </div>
                          </td>

                          <td className="py-2.5 px-3 text-right font-normal text-muted-foreground text-xs">
                            {item.bhp > 0 ? formatIDR(item.bhp) : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}

        {/* 2. Structured Financial Audit Breakdown */}
        <div className="space-y-2">
          <span className="text-[10.5px] font-semibold tracking-wider text-muted-foreground uppercase block">
            {isEn ? "Financial Audit Summary" : "Rekapitulasi Audit Finansial Transaksi"}
          </span>

          <div className="p-3.5 rounded-xl bg-muted/15 border border-border/60 text-xs space-y-3.5">
            {/* Group 1: Revenue from Customer */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 block">
                {isEn ? "1. Customer Billing & Revenue" : "1. Pemasukan dari Pelanggan (Tagihan)"}
              </span>

              <div className="space-y-1.5 pl-0.5">
                <div className="flex justify-between items-center text-muted-foreground text-xs">
                  <span>{isEn ? "Gross Treatment Services:" : "Total Jasa Layanan (Gross):"}</span>
                  <span className="font-medium text-foreground">{formatIDR(fin.treatmentGrossPrice)}</span>
                </div>

                {fin.additionalCharge > 0 && (
                  <div className="flex justify-between items-center text-muted-foreground text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-foreground font-medium">{isEn ? "Additional Surcharges (Charge):" : "Biaya Tambahan (Charge Akses):"}</span>
                      {fin.additionalChargeDescription && (
                        <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-300 font-medium">
                          {fin.additionalChargeDescription}
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-foreground">+{formatIDR(fin.additionalCharge)}</span>
                  </div>
                )}

                {fin.transportFee > 0 && (
                  <div className="flex justify-between items-center text-muted-foreground text-xs">
                    <span className="text-foreground font-medium">{isEn ? "Transport / Travel Fee:" : "Biaya Ongkir Transport:"}</span>
                    <span className="font-semibold text-foreground">+{formatIDR(fin.transportFee)}</span>
                  </div>
                )}

                {fin.discountAmount > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-medium text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>{isEn ? "Promo Discount Applied:" : "Potongan Diskon Promosi:"}</span>
                      {fin.appliedPromoName && (
                        <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-emerald-500/15 font-semibold">
                          ↳ {fin.appliedPromoName}
                        </span>
                      )}
                    </div>
                    <span className="font-bold">-{formatIDR(fin.discountAmount)}</span>
                  </div>
                )}

                <div className="pt-1.5 border-t border-border/40 flex justify-between items-center text-foreground">
                  <span className="text-xs font-semibold">{isEn ? "Total Customer Payment (Grand Total):" : "Total Penerimaan dari Pelanggan:"}</span>
                  <span className="text-sm font-bold text-foreground">{formatIDR(fin.finalCustomerTotal)}</span>
                </div>
              </div>
            </div>

            {/* Group 2: Disbursements and Costs */}
            <div className="pt-2.5 border-t border-border/40 space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 block">
                {isEn ? "2. Cost Allocation & Disbursements" : "2. Alokasi Pengeluaran & Pembagian Hasil"}
              </span>

              <div className="space-y-1.5 pl-0.5">
                <div className="flex justify-between items-start text-amber-700 dark:text-amber-400 font-medium text-xs">
                  <div>
                    <span>{isEn ? "Total Therapist Earnings:" : "Total Hak Bagi Hasil Terapis:"}</span>
                    {fin.itemsList && fin.itemsList.length > 1 && (
                      <span className="text-[9.5px] block text-muted-foreground font-normal pt-0.5">
                        ({fin.itemsList.map(it => {
                          const trans = it.transport_fee_therapist_share !== undefined
                            ? Number(it.transport_fee_therapist_share)
                            : Number(it.transport_fee || 0);
                          return `${it.therapist || "Terapis"}: ${formatIDR(Number(it.commission || 0) + trans)}`;
                        }).join(" • ")})
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-xs whitespace-nowrap">-{formatIDR(fin.therapistFee)}</span>
                </div>

                <div className="flex justify-between items-center text-muted-foreground text-xs">
                  <span>{isEn ? "Consumables Supplies (BHP):" : "Biaya Bahan Habis Pakai (BHP):"}</span>
                  <span className="font-medium text-foreground">-{formatIDR(fin.consumablesCost)}</span>
                </div>
              </div>
            </div>

            {/* Group 3: Net Profit Banner */}
            <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <span className="font-bold text-emerald-900 dark:text-emerald-200 text-xs block">
                  {isEn ? "Serena Raga Net Income (Net Profit)" : "Laba Bersih Serena Raga (Net Profit)"}
                </span>
                <span className="text-[10px] text-emerald-800/80 dark:text-emerald-300/80 hidden sm:block">
                  {isEn
                    ? "Customer payment minus therapist payouts and supplies cost."
                    : "Penerimaan pelanggan dikurangi total hak terapis dan biaya BHP."}
                </span>
              </div>
              <span className="font-extrabold text-emerald-700 dark:text-emerald-300 text-sm sm:text-base">
                {formatIDR(fin.netSerenaRaga)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
