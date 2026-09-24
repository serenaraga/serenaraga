"use client";

import * as React from "react";
import { List } from "@/components/list";
import { DataTable, DataTableCol } from "@/components/data-table";
import { TextField } from "@/components/text-field";
import { NumberField } from "@/components/number-field";
import { ReferenceField } from "@/components/reference-field";
import { ReferenceInput } from "@/components/reference-input";
import { Edit } from "@/components/edit";
import { Create } from "@/components/create";
import { Show } from "@/components/show";
import { SimpleForm } from "@/components/simple-form";
import { TextInput } from "@/components/text-input";
import { NumberInput } from "@/components/number-input";
import { SelectInput } from "@/components/select-input";
import { RowActions } from "@/components/row-actions";
import {
  useRecordContext,
  useGetOne,
  useLocaleState,
  useTranslate,
} from "ra-core";
import { useBrandSettings, cleanWhatsAppNumber } from "@/lib/brand-settings";
import { formatIDR } from "@/lib/utils";
import { PaymentMethodBadge } from "@/components/payment-method";
import { StatusBadge } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rating02 } from "@/components/shadcn-space/rating/rating-02";
import {
  Star,
  Sparkles,
  User,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  Receipt,
  UserCheck,
  MessageSquare,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Dynamic Resolvers for Client and Therapist in ReviewList
const ReviewClientColumn = ({ isEn }: { isEn: boolean }) => {
  const record = useRecordContext();
  const { data: booking } = useGetOne(
    "bookings",
    { id: record?.booking_id },
    { enabled: !record?.customer_name && !!record?.booking_id }
  );
  const { data: customer } = useGetOne(
    "customers",
    { id: booking?.customer_id },
    { enabled: !record?.customer_name && !!booking?.customer_id }
  );

  const displayName =
    record?.customer_name ||
    customer?.full_name ||
    (booking ? `${isEn ? "Client" : "Pelanggan"} #${booking.id}` : "-");

  return <span className="font-medium text-foreground text-xs">{displayName}</span>;
};

const ReviewTherapistColumn = () => {
  const record = useRecordContext();
  const { data: booking } = useGetOne(
    "bookings",
    { id: record?.booking_id },
    { enabled: !record?.therapist_id && !!record?.booking_id }
  );

  const resolvedTherapistId = record?.therapist_id || booking?.therapist_id;

  const { data: therapist } = useGetOne(
    "therapists",
    { id: resolvedTherapistId },
    { enabled: !!resolvedTherapistId }
  );

  return (
    <span className="text-xs text-foreground font-medium">
      {therapist?.name || "-"}
    </span>
  );
};

// Enhanced Review List Component
export const ReviewList = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <List>
      <DataTable>
        <DataTableCol
          source="id"
          label="#"
          headerClassName="w-14"
          cellClassName="text-xs text-muted-foreground"
        />
        <DataTableCol
          source="customer_name"
          label={isEn ? "Client" : "Pelanggan"}
        >
          <ReviewClientColumn isEn={isEn} />
        </DataTableCol>
        <DataTableCol
          source="therapist_id"
          label={isEn ? "Therapist" : "Terapis"}
        >
          <ReviewTherapistColumn />
        </DataTableCol>
        <DataTableCol
          source="booking_id"
          label={isEn ? "Booking #" : "ID Booking"}
          cellClassName="text-xs"
        >
          <ReferenceField source="booking_id" reference="bookings">
            <span className="font-semibold text-amber-700 dark:text-amber-500">
              #<TextField source="id" />
            </span>
          </ReferenceField>
        </DataTableCol>
        <DataTableCol
          source="rating"
          label={isEn ? "Rating" : "Rating"}
        >
          <div className="flex items-center gap-1 font-semibold text-amber-500 text-xs">
            <NumberField source="rating" />
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
          </div>
        </DataTableCol>
        <DataTableCol
          source="comment"
          label={isEn ? "Feedback" : "Komentar"}
          cellClassName="truncate max-w-xs text-xs italic text-muted-foreground"
        />
        <DataTableCol
          source="created_at"
          label={isEn ? "Date" : "Tanggal"}
          cellClassName="text-xs text-muted-foreground"
        />
        <DataTableCol
          label="ra.action.name"
          headerClassName="text-right w-16"
          cellClassName="text-right"
        >
          <RowActions />
        </DataTableCol>
      </DataTable>
    </List>
  );
};

const bookingOptionText = (choice: any) => {
  if (!choice) return "";
  return `Booking #${choice.id} (${choice.booking_date || ""} ${choice.booking_time || ""}) - ${choice.service_address || "Home"}`;
};

export const ReviewCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="customer_name" required />
      <ReferenceInput source="booking_id" reference="bookings">
        <SelectInput optionText={bookingOptionText} />
      </ReferenceInput>
      <ReferenceInput source="therapist_id" reference="therapists">
        <SelectInput optionText="name" />
      </ReferenceInput>
      <NumberInput source="rating" defaultValue={5} min={1} max={5} required />
      <TextInput source="comment" multiline rows={3} required />
    </SimpleForm>
  </Create>
);

export const ReviewEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="customer_name" />
      <ReferenceInput source="booking_id" reference="bookings">
        <SelectInput optionText={bookingOptionText} />
      </ReferenceInput>
      <ReferenceInput source="therapist_id" reference="therapists">
        <SelectInput optionText="name" />
      </ReferenceInput>
      <NumberInput source="rating" min={1} max={5} required />
      <TextInput source="comment" multiline rows={3} required />
    </SimpleForm>
  </Edit>
);

// Comprehensive Rich Review Detail Show Component
const ReviewShowContent = () => {
  const record = useRecordContext();
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const { settings } = useBrandSettings();

  // Fetch Booking Relation
  const { data: booking } = useGetOne(
    "bookings",
    { id: record?.booking_id },
    { enabled: !!record?.booking_id }
  );

  // Fetch Service Relation
  const { data: service } = useGetOne(
    "services",
    { id: booking?.service_id },
    { enabled: !!booking?.service_id }
  );

  // Fetch Therapist Relation (either from review or booking)
  const resolvedTherapistId = record?.therapist_id || booking?.therapist_id;
  const { data: therapist } = useGetOne(
    "therapists",
    { id: resolvedTherapistId },
    { enabled: !!resolvedTherapistId }
  );

  // Fetch Customer Relation
  const { data: customer } = useGetOne(
    "customers",
    { id: booking?.customer_id },
    { enabled: !!booking?.customer_id }
  );

  if (!record) return null;

  const customerDisplayName =
    record.customer_name ||
    customer?.full_name ||
    (booking ? `${isEn ? "Booking Client" : "Pelanggan Booking"} #${booking.id}` : isEn ? "Valued Client" : "Pelanggan");

  const customerPhone = customer?.phone || booking?.customer_phone;
  const serviceAddress = booking?.service_address || customer?.address || "-";
  const bookingDate = booking?.booking_date || "-";
  const bookingTime = booking?.booking_time ? `${booking.booking_time} WIB` : "-";
  const ratingValue = Number(record.rating) || 5;

  const formattedTotalPrice = formatIDR(booking?.total_price || service?.price || 0);

  const formattedDate = record.created_at
    ? new Date(record.created_at).toLocaleDateString(isEn ? "en-US" : "id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Review Summary Card with Emoji Rating and Comment */}
      <Card className="border border-border bg-card shadow-none">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-500 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                {isEn ? `Review #${record.id}` : `Ulasan #${record.id}`}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{isEn ? "Verified Customer Review" : "Ulasan Terverifikasi"}</span>
              </span>
            </div>
            <CardTitle className="text-lg font-bold text-foreground pt-1">
              {customerDisplayName}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {isEn ? "Submitted on:" : "Diterima pada:"}{" "}
              <span className="text-foreground font-medium">{formattedDate}</span>
            </CardDescription>
          </div>

          {/* Rating Emoji Component */}
          <div className="flex flex-col items-start sm:items-end gap-1">
            <Rating02
              value={ratingValue}
              readOnly
              size="md"
              labels={
                isEn
                  ? ["Terrible", "Bad", "Okay", "Good", "Awesome"]
                  : ["Kurang Sekali", "Kurang", "Cukup", "Puas", "Sangat Puas"]
              }
            />
            <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-500">
              <span>{ratingValue}.0 / 5.0</span>
              <div className="flex">
                {[...Array(ratingValue)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-500 text-amber-500" />
                ))}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-3">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
              <span>{isEn ? "Customer Feedback / Comment:" : "Pesan & Masukan Pelanggan:"}</span>
            </span>
            <div className="p-4 rounded-xl bg-muted/40 border border-border/70">
              <p className="text-sm font-medium text-foreground italic leading-relaxed">
                &ldquo;{record.comment || (isEn ? "No additional written comment." : "Tidak ada komentar tertulis.")}&rdquo;
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Detailed 4-Grid Information Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Box 1: Customer Details */}
        <Card className="border border-border bg-card shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
              <span>{isEn ? "Client Info" : "Data Pelanggan"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div>
              <p className="text-sm font-semibold text-foreground">{customerDisplayName}</p>
              {customerPhone ? (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3" />
                  <span>{customerPhone}</span>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">-</p>
              )}
            </div>
            <div className="pt-2 border-t border-border/50">
              <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                {isEn ? "Service Address" : "Alamat Layanan"}
              </span>
              <p className="text-xs text-foreground mt-0.5 leading-relaxed flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-muted-foreground mt-0.5" />
                <span>{serviceAddress}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Box 2: Ordered Service Details */}
        <Card className="border border-border bg-card shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
              <span>{isEn ? "Ordered Service" : "Layanan Dipesan"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {service?.name || (isEn ? "Home Massage Package" : "Paket Pijat Serena Raga")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>
                  {service?.duration_minutes || 90} {isEn ? "Minutes" : "Menit"} •{" "}
                  {service?.category || "Body Massage"}
                </span>
              </p>
            </div>
            <div className="pt-2 border-t border-border/50">
              <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                {isEn ? "Total Price" : "Total Biaya"}
              </span>
              <p className="text-sm font-bold text-foreground mt-0.5">
                {formattedTotalPrice}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Box 3: Assigned Therapist */}
        <Card className="border border-border bg-card shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
              <span>{isEn ? "Assigned Therapist" : "Terapis Bertugas"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {therapist ? (
              <>
                <div>
                  <p className="text-sm font-semibold text-foreground">{therapist.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {therapist.phone || "-"}
                  </p>
                </div>
                <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">
                    {isEn ? "Rating / Status" : "Rating / Status"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-amber-500">
                      ★ {therapist.rating || "5.0"}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                      {therapist.status || "ready"}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-3 text-muted-foreground">
                {isEn ? "Therapist not directly linked" : "Data terapis belum terhubung"}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Box 4: Booking & Schedule */}
        <Card className="border border-border bg-card shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
              <span>{isEn ? "Schedule & Booking" : "Jadwal & Booking"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-700 dark:text-amber-500">
                  #{record.booking_id || booking?.id || "-"}
                </span>
                <StatusBadge status={booking?.payment_status} type="payment" isEn={isEn} />
              </div>
              <p className="text-xs font-semibold text-foreground mt-1">
                {bookingDate}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {bookingTime}
              </p>
            </div>
            <div className="pt-2 border-t border-border/50">
              <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                {isEn ? "Payment Method" : "Metode Pembayaran"}
              </span>
              <div className="mt-1">
                <PaymentMethodBadge method={booking?.payment_method} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Quick Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-2">
        {record.booking_id && (
          <a href={`#/bookings/${record.booking_id}/show`}>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 shadow-none border-border"
            >
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{isEn ? `Open Booking #${record.booking_id}` : `Buka Booking #${record.booking_id}`}</span>
            </Button>
          </a>
        )}

        {customerPhone && (
          <a
            href={`https://wa.me/${cleanWhatsAppNumber(customerPhone)}?text=${encodeURIComponent(
              isEn
                ? `Hello ${customerDisplayName}, thank you for your review at ${settings.brand_name || "Serena Raga"}!`
                : `Halo ${customerDisplayName}, terima kasih banyak atas ulasan dan masukan Anda untuk ${settings.brand_name || "Serena Raga"}!`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 shadow-none border-border"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
              <span>{isEn ? "WhatsApp Client" : "Hubungi Pelanggan via WA"}</span>
            </Button>
          </a>
        )}

        <a href="#/reviews">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 shadow-none border-border"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{isEn ? "Back to All Reviews" : "Kembali ke Daftar Ulasan"}</span>
          </Button>
        </a>
      </div>
    </div>
  );
};

export const ReviewShow = () => (
  <Show>
    <ReviewShowContent />
  </Show>
);

