"use client";

import * as React from "react";
import { useLocaleState, useGetOne, useGetList, useRecordContext } from "ra-core";
import { Show } from "@/components/show";
import { BadgeField } from "@/components/badge-field";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CardSkeleton } from "@/components/ui/skeleton";
import {
  CalendarCheck,
  User,
  Sparkles,
  UserCheck,
  MapPin,
  FileText,
  MessageCircle,
} from "lucide-react";
import { calculateBookingFinancials } from "@/lib/financial-calculator";
import { formatIDR } from "@/lib/utils";
import { useBrandSettings, sendBookingWhatsAppReminder } from "@/lib/brand-settings";
import { BookingFinancialCard } from "./booking-financial-card";

/**
 * Detailed View of a Booking with Service Overview and Live Financial Breakdown
 */
export const BookingShowContent = () => {
  const record = useRecordContext();
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const { settings } = useBrandSettings();

  const { data: therapist, isPending: isTherapistPending } = useGetOne(
    "therapists",
    { id: record?.therapist_id },
    { enabled: !!record?.therapist_id }
  );

  const { data: service, isPending: isServicePending } = useGetOne(
    "services",
    { id: record?.service_id },
    { enabled: !!record?.service_id }
  );

  const { data: customer, isPending: isCustomerPending } = useGetOne(
    "customers",
    { id: record?.customer_id },
    { enabled: !!record?.customer_id }
  );

  const { data: matchedInvoices = [], isPending: isInvoicesPending } = useGetList(
    "invoices",
    {
      filter: { booking_id: record?.id },
      pagination: { page: 1, perPage: 1 },
    },
    { enabled: !!record?.id }
  );

  const { data: promotions = [], isPending: isPromosPending } = useGetList("promotions", {
    pagination: { page: 1, perPage: 50 },
  });

  if (!record) return null;

  // Show global card skeletons while essential related records are loading to prevent layout shifting
  const isLoadingRelations =
    (record.therapist_id && isTherapistPending) ||
    (record.service_id && isServicePending) ||
    (record.customer_id && isCustomerPending) ||
    isInvoicesPending ||
    isPromosPending;

  if (isLoadingRelations) {
    return (
      <div className="space-y-6 max-w-4xl w-full">
        <CardSkeleton lines={3} />
        <CardSkeleton lines={5} />
      </div>
    );
  }

  const matchedInvoice = matchedInvoices[0] || null;

  const fin = calculateBookingFinancials({
    bookingPrice: Number(record.total_price || service?.price || 0),
    servicePrice: Number(service?.price || 0),
    consumablesCost: Number(service?.consumables_cost || 0),
    commissionRate: therapist?.commission_rate != null ? Number(therapist.commission_rate) : 60,
    invoice: matchedInvoice,
    promotions,
    bookingNotes: record.special_requests,
  });

  // Extract human-readable notes from special_requests JSON if present
  let rawNotes = record.special_requests || "";
  if (rawNotes.trim().startsWith("{") && rawNotes.trim().endsWith("}")) {
    try {
      const parsed = JSON.parse(rawNotes.trim());
      rawNotes = parsed.raw_notes || parsed.notes || "";
    } catch (e) {}
  }

  // Filter out internal system tags (e.g. [Invoice: SR-xxx]) so only genuine notes are displayed
  const displayNotes = rawNotes.replace(/\[Invoice:[^\]]*\]/gi, "").trim();

  // Multi-service header subtitle
  const serviceDisplayName = fin.itemsList && fin.itemsList.length > 1
    ? `${fin.itemsList[0].name} (+${fin.itemsList.length - 1} ${isEn ? "more" : "lainnya"})`
    : (fin.itemsList && fin.itemsList.length === 1 ? fin.itemsList[0].name : (service?.name || (isEn ? "Custom Treatment" : "Layanan Treatment")));

  const therapistDisplayName = fin.itemsList && fin.itemsList.length > 1
    ? Array.from(new Set(fin.itemsList.map((it: any) => it.therapist).filter(Boolean))).join(", ") || (therapist?.name || "-")
    : (therapist?.name || "-");

  const totalDurationMinutes = fin.itemsList && fin.itemsList.length > 0
    ? fin.itemsList.reduce((acc: number, it: any) => acc + (Number(it.duration_minutes || it.duration_minutes_snapshot) || 0), 0)
    : (service?.duration_minutes || 0);

  const finalDisplayPrice = fin.finalCustomerTotal || Number(record.total_price || service?.price || 0);

  const handleSendReminder = () => {
    sendBookingWhatsAppReminder(
      {
        ...record,
        customers: customer,
        services: service,
        therapists: therapist,
      },
      settings,
      isEn
    );
  };

  return (
    <div className="space-y-6 max-w-4xl w-full">
      {/* 1. Primary Card: Booking Overview & Schedule */}
      <Card className="border border-border/70 shadow-none bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <span>{isEn ? "Booking" : "Pemesanan"} #{record.id}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    ({record.booking_date}{record.booking_time ? ` • ${record.booking_time}` : ""})
                  </span>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  {serviceDisplayName} • {therapistDisplayName}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSendReminder}
                className="h-7 text-xs font-medium gap-1.5 border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer shadow-none"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{isEn ? "Send WA Reminder" : "Kirim Reminder WA"}</span>
              </Button>
              <BadgeField source="status" />
              <BadgeField source="payment_status" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          {/* Customer */}
          <div className="space-y-1">
            <span className="text-muted-foreground text-[11px] font-medium flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-primary" />
              {isEn ? "Customer Details" : "Data Pelanggan"}
            </span>
            <span className="font-semibold text-foreground text-sm block">
              {customer?.full_name || (isEn ? `Customer #${record.customer_id}` : `Pelanggan #${record.customer_id}`)}
            </span>
            {customer?.phone && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span>{customer.phone}</span>
                <button
                  type="button"
                  onClick={handleSendReminder}
                  title={isEn ? "Send WhatsApp reminder" : "Kirim reminder WhatsApp"}
                  className="p-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Service & Duration */}
          <div className="space-y-1">
            <span className="text-muted-foreground text-[11px] font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              {isEn ? "Treatment Service" : "Layanan Treatment"}
            </span>
            <span className="font-semibold text-foreground text-sm block">
              {serviceDisplayName}
            </span>
            <span className="text-muted-foreground block">
              {totalDurationMinutes > 0 ? `${totalDurationMinutes} ${isEn ? "Mins" : "Menit"} • ` : service?.duration_minutes ? `${service.duration_minutes} ${isEn ? "Mins" : "Menit"} • ` : ""}
              <span className="font-medium text-foreground">{formatIDR(finalDisplayPrice)}</span>
            </span>
          </div>

          {/* Therapist */}
          <div className="space-y-1">
            <span className="text-muted-foreground text-[11px] font-medium flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-primary" />
              {isEn ? "Assigned Therapist" : "Terapis Bertugas"}
            </span>
            <span className="font-semibold text-foreground text-sm block">
              {therapistDisplayName}
            </span>
            <span className="text-amber-700 dark:text-amber-400 font-medium block">
              {isEn ? "Commission Rate:" : "Skema Komisi:"} {fin.commissionRate}%
            </span>
          </div>

          {/* Address */}
          <div className="sm:col-span-2 md:col-span-3 pt-2 border-t border-border/40 space-y-1">
            <span className="text-muted-foreground text-[11px] font-medium flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              {isEn ? "Home Service Location / Address" : "Alamat Layanan Home Service"}
            </span>
            <span className="font-medium text-foreground block">
              {record.service_address || customer?.address || "-"}
            </span>
          </div>

          {/* Notes (Only rendered if genuine customer notes exist) */}
          {displayNotes && (
            <div className="sm:col-span-2 md:col-span-3 pt-2 border-t border-border/40 space-y-1">
              <span className="text-muted-foreground text-[11px] font-medium flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-primary" />
                {isEn ? "Special Requests & Notes" : "Catatan Khusus Pelanggan"}
              </span>
              <p className="text-muted-foreground leading-relaxed">
                {displayNotes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Secondary Card: Financial Breakdown & Final Invoicing */}
      <BookingFinancialCard fin={fin} therapist={therapist} isEn={isEn} bookingId={record.id} />
    </div>
  );
};

export const BookingShow = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <Show title={isEn ? "Booking Details" : "Detail Pemesanan"}>
      <BookingShowContent />
    </Show>
  );
};

