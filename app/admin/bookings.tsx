"use client";

import { List } from "@/components/list";
import { DataTable, DataTableCol } from "@/components/data-table";
import { TextField } from "@/components/text-field";
import { NumberField } from "@/components/number-field";
import { BadgeField } from "@/components/badge-field";
import { ReferenceField } from "@/components/reference-field";
import { ReferenceInput } from "@/components/reference-input";
import { Edit } from "@/components/edit";
import { Create } from "@/components/create";
import { Show } from "@/components/show";
import { SimpleForm } from "@/components/simple-form";
import { TextInput } from "@/components/text-input";
import { NumberInput } from "@/components/number-input";
import { SelectInput } from "@/components/select-input";
import { DatePickerInput } from "@/components/date-picker-input";
import { TimePickerInput } from "@/components/time-picker-input";
import { PhoneInput } from "@/components/phone-input";
import { RowActions } from "@/components/row-actions";

export const BookingList = () => (
  <List>
    <DataTable>
      <DataTableCol
        source="id"
        label="#"
        headerClassName="w-14"
        cellClassName="text-xs font-bold text-primary"
      />
      <DataTableCol source="booking_date" />
      <DataTableCol
        source="booking_time"
        cellClassName="text-xs"
      />
      <DataTableCol source="customer_id">
        <ReferenceField source="customer_id" reference="customers">
          <TextField source="full_name" />
        </ReferenceField>
      </DataTableCol>
      <DataTableCol source="service_id">
        <ReferenceField source="service_id" reference="services">
          <TextField source="name" />
        </ReferenceField>
      </DataTableCol>
      <DataTableCol source="therapist_id">
        <ReferenceField source="therapist_id" reference="therapists">
          <TextField source="name" />
        </ReferenceField>
      </DataTableCol>
      <DataTableCol source="total_price" cellClassName="text-xs font-semibold">
        <NumberField
          source="total_price"
          options={{ style: "currency", currency: "IDR", maximumFractionDigits: 0 }}
        />
      </DataTableCol>
      <DataTableCol source="status">
        <BadgeField source="status" />
      </DataTableCol>
      <DataTableCol source="payment_status">
        <BadgeField source="payment_status" />
      </DataTableCol>
      <DataTableCol label="ra.action.name" headerClassName="text-right w-16" cellClassName="text-right">
        <RowActions showCreateInvoice={true} />
      </DataTableCol>
    </DataTable>
  </List>
);

import * as React from "react";
import { useWatch, useFormContext } from "react-hook-form";
import {
  useLocaleState,
  useNotify,
  useRedirect,
  useGetOne,
  useRecordContext,
  useTranslate,
  required,
} from "ra-core";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Calendar,
  UserCheck,
  Sparkles,
  MapPin,
  CreditCard,
  FileText,
  Clock,
  DollarSign,
  User,
} from "lucide-react";
import { formatIDR } from "@/lib/utils";

export const useTherapistOptionText = () => {
  const [locale] = useLocaleState();
  return (choice: any) => {
    if (!choice) return "";
    const status = choice.status;
    const label =
      status === "available"
        ? locale === "en"
          ? "Available"
          : "Tersedia"
        : status === "on_duty"
          ? locale === "en"
            ? "On Duty"
            : "Sedang Bertugas"
          : locale === "en"
            ? "Off Duty"
            : "Libur";
    return `${choice.name} (${label})`;
  };
};

export const useServiceOptionText = () => {
  const [locale] = useLocaleState();
  return (choice: any) => {
    if (!choice) return "";
    const formattedPrice = formatIDR(choice.price);
    const durationUnit = locale === "en" ? "mins" : "mnt";
    return `${choice.name} (${choice.duration_minutes} ${durationUnit} • ${formattedPrice})`;
  };
};

/**
 * Automatically synchronizes total_price with selected service's catalog price
 */
const BookingPriceSynchronizer = () => {
  const { setValue, getValues } = useFormContext();
  const serviceId = useWatch({ name: "service_id" });

  const { data: service } = useGetOne(
    "services",
    { id: serviceId },
    { enabled: !!serviceId }
  );

  React.useEffect(() => {
    if (service && service.price !== undefined && service.price !== null) {
      setValue("total_price", Number(service.price), {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [service, setValue]);

  return null;
};

/**
 * Shared Clean & Modern Booking Form Layout using Shadcn Cards
 */
const BookingFormContent = ({ mode = "create" }: { mode?: "create" | "edit" }) => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const therapistOptionText = useTherapistOptionText();
  const serviceOptionText = useServiceOptionText();

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Auto-sync price hook */}
      <BookingPriceSynchronizer />

      {/* 1. Card: Customer Information & Schedule */}
      <Card className="border border-border/70 shadow-none bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                {isEn ? "Customer Details & Schedule" : "Informasi Pelanggan & Jadwal Layanan"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {isEn
                  ? "Specify customer contact details and preferred date/time slot."
                  : "Tentukan identitas pemesan serta tanggal dan jam pelayanan pijat."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {mode === "create" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <TextInput
                source="customer_name"
                label={isEn ? "Customer Name *" : "Nama Pelanggan *"}
                placeholder={isEn ? "e.g. Budi Santoso" : "Contoh: Budi Santoso"}
                validate={required(isEn ? "Customer name is required" : "Nama pelanggan wajib diisi")}
                required
              />
              <PhoneInput
                source="customer_phone"
                label={isEn ? "WhatsApp / Phone *" : "No. WhatsApp / HP *"}
                placeholder="0812-3456-7890"
                validate={required(isEn ? "Phone number is required" : "Nomor WhatsApp wajib diisi")}
                required
              />
            </div>
          ) : (
            <ReferenceInput source="customer_id" reference="customers">
              <SelectInput
                optionText="full_name"
                label={isEn ? "Customer *" : "Pelanggan Terdaftar *"}
                validate={required(isEn ? "Customer is required" : "Pelanggan wajib dipilih")}
                required
              />
            </ReferenceInput>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-2 border-t border-border/40">
            <DatePickerInput
              source="booking_date"
              label={isEn ? "Booking Date *" : "Tanggal Reservasi *"}
              defaultValue={mode === "create" ? new Date().toISOString().split("T")[0] : undefined}
              validate={required(isEn ? "Date is required" : "Tanggal wajib dipilih")}
              required
            />
            <TimePickerInput
              source="booking_time"
              label={isEn ? "Booking Time *" : "Jam Pelayanan *"}
              defaultValue={mode === "create" ? "10:00" : undefined}
              validate={required(isEn ? "Time is required" : "Jam wajib ditentukan")}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. Card: Service & Therapist Assignment */}
      <Card className="border border-border/70 shadow-none bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                {isEn ? "Service & Therapist Assignment" : "Pilihan Layanan & Penugasan Terapis"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {isEn
                  ? "Select treatment menu, assigned therapist, and review calculated total price."
                  : "Pilih paket pijat, terapis yang bertugas, dan tarif tagihan pemesanan."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <ReferenceInput source="service_id" reference="services">
              <SelectInput
                optionText={serviceOptionText}
                label={isEn ? "Massage Treatment *" : "Pilih Menu Layanan *"}
                validate={required(isEn ? "Service is required" : "Layanan wajib dipilih")}
                required
              />
            </ReferenceInput>
            <ReferenceInput source="therapist_id" reference="therapists">
              <SelectInput
                optionText={therapistOptionText}
                label={isEn ? "Assigned Therapist *" : "Terapis yang Bertugas *"}
                validate={required(isEn ? "Therapist is required" : "Terapis wajib dipilih")}
                required
              />
            </ReferenceInput>
          </div>

          <div className="pt-2 border-t border-border/40">
            <NumberInput
              source="total_price"
              label={isEn ? "Total Price (IDR) *" : "Total Biaya Layanan (IDR) *"}
              helperText={
                isEn
                  ? "Auto-filled from selected service. You can adjust if there is a custom discount or transport surcharge."
                  : "Otomatis terisi dari harga menu layanan yang dipilih. Dapat disesuaikan jika ada diskon khusus atau biaya transport."
              }
              min={0}
              step={5000}
              validate={required(isEn ? "Total price is required" : "Total biaya layanan wajib diisi")}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. Card: Service Address, Status & Payment */}
      <Card className="border border-border/70 shadow-none bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                {isEn ? "Service Address, Payment & Status" : "Lokasi Pelayanan, Pembayaran & Status"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {isEn
                  ? "Enter destination address, notes, order workflow status, and payment channel."
                  : "Alamat lengkap kunjungan ke rumah/hotel/apartemen serta status pembayaran pesanan."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <TextInput
            source="service_address"
            label={isEn ? "Service Destination Address *" : "Alamat Lengkap Lokasi Layanan *"}
            placeholder={
              isEn
                ? "e.g. Jl. Senopati No. 12, Kebayoran Baru, Jakarta Selatan (Tower A, Unit 12B)"
                : "Contoh: Jl. Senopati No. 12, Kebayoran Baru, Jakarta Selatan (Apartemen Sudirman Tower A Unit 12B)"
            }
            multiline
            rows={2}
            validate={required(isEn ? "Address is required" : "Alamat layanan wajib diisi")}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start pt-2 border-t border-border/40">
            <SelectInput
              source="status"
              label={isEn ? "Order Status" : "Status Pesanan"}
              defaultValue="pending"
              choices={[
                { id: "pending", name: "resources.bookings.status.pending" },
                { id: "confirmed", name: "resources.bookings.status.confirmed" },
                { id: "completed", name: "resources.bookings.status.completed" },
                { id: "canceled", name: "resources.bookings.status.canceled" },
              ]}
            />
            <SelectInput
              source="payment_method"
              label={isEn ? "Payment Method" : "Metode Pembayaran"}
              defaultValue="cash"
              choices={[
                { id: "cash", name: "resources.bookings.payment_method.cash" },
                { id: "qris", name: "resources.bookings.payment_method.qris" },
                { id: "bank_transfer", name: "resources.bookings.payment_method.bank_transfer" },
              ]}
            />
            <SelectInput
              source="payment_status"
              label={isEn ? "Payment Status" : "Status Pembayaran"}
              defaultValue="unpaid"
              choices={[
                { id: "unpaid", name: "resources.bookings.payment_status.unpaid" },
                { id: "paid", name: "resources.bookings.payment_status.paid" },
                { id: "refunded", name: "resources.bookings.payment_status.refunded" },
              ]}
            />
          </div>

          <TextInput
            source="special_requests"
            label={isEn ? "Special Requests / Health Notes" : "Catatan Khusus / Keluhan Pelanggan"}
            placeholder={
              isEn
                ? "e.g. Focus on stiff shoulder, medium pressure, avoid neck"
                : "Contoh: Fokus pundak kaku, tekanan sedang, hindari area leher karena sensitif"
            }
            multiline
            rows={2}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export const BookingEdit = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const notify = useNotify();
  const redirect = useRedirect();

  return (
    <Edit
      title={isEn ? "Edit Booking" : "Ubah Data Reservasi"}
      mutationMode="pessimistic"
      mutationOptions={{
        onSuccess: () => {
          notify(isEn ? "Booking updated successfully" : "Data reservasi berhasil diperbarui", {
            type: "success",
          });
          redirect("list", "bookings");
        },
        onError: (err: any) => {
          notify(
            isEn
              ? "Failed to update booking: " + err.message
              : "Gagal memperbarui reservasi: " + (err.message || err),
            { type: "error" }
          );
        },
      }}
    >
      <SimpleForm>
        <BookingFormContent mode="edit" />
      </SimpleForm>
    </Edit>
  );
};

export const BookingCreate = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const notify = useNotify();
  const redirect = useRedirect();

  return (
    <Create
      title={isEn ? "Create New Booking" : "Buat Reservasi Baru"}
      mutationMode="pessimistic"
      mutationOptions={{
        onSuccess: () => {
          notify(isEn ? "Booking created successfully" : "Reservasi baru berhasil dibuat", {
            type: "success",
          });
          redirect("list", "bookings");
        },
        onError: (err: any) => {
          notify(
            isEn
              ? "Failed to create booking: " + err.message
              : "Gagal membuat reservasi: " + (err.message || err),
            { type: "error" }
          );
        },
      }}
    >
      <SimpleForm>
        <BookingFormContent mode="create" />
      </SimpleForm>
    </Create>
  );
};

const BookingCommissionBreakdown = () => {
  const record = useRecordContext();
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  const { data: therapist } = useGetOne(
    "therapists",
    { id: record?.therapist_id },
    { enabled: !!record?.therapist_id }
  );

  const { data: service } = useGetOne(
    "services",
    { id: record?.service_id },
    { enabled: !!record?.service_id }
  );

  if (!record || !therapist) return null;

  const commissionRate = Number(therapist.commission_rate) || 60;
  const totalPrice = Number(record.total_price) || 0;
  const therapistFee = Math.round((totalPrice * commissionRate) / 100);
  const consumablesCost = Number(service?.consumables_cost) || 0;
  const netAdminIncome = Math.max(0, totalPrice - therapistFee - consumablesCost);

  return (
    <div className="md:col-span-2 p-4 rounded-xl bg-muted/30 border border-border/70 mt-2 space-y-3">
      <div className="text-xs font-semibold text-foreground flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-bold">
          <span>{isEn ? "Booking Financial Breakdown" : "Rincian Keuangan & Laba Pesanan"}</span>
        </span>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400">
          {therapist.name} ({commissionRate}%)
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-border/50">
        <div className="p-2.5 rounded-lg bg-background border border-border/50 space-y-0.5">
          <span className="text-muted-foreground block text-[11px]">{isEn ? "Therapist Fee:" : "Hak Terapis:"}</span>
          <span className="font-semibold text-foreground">
            {formatIDR(therapistFee)}
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-background border border-border/50 space-y-0.5">
          <span className="text-muted-foreground block text-[11px]">{isEn ? "Consumables (HPP):" : "Biaya Bahan (HPP):"}</span>
          <span className="font-semibold text-amber-700 dark:text-amber-400">
            {formatIDR(consumablesCost)}
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-0.5">
          <span className="text-emerald-700 dark:text-emerald-400 block text-[11px] font-semibold">{isEn ? "Net Serena Raga:" : "Laba Bersih Serena Raga:"}</span>
          <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
            {formatIDR(netAdminIncome)}
          </span>
        </div>
      </div>
    </div>
  );
};

export const BookingShow = () => {
  const translate = useTranslate();
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <Show title={isEn ? "Booking Details" : "Detail Pemesanan"}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-card rounded-xl border">
        <div>
          <div className="text-xs text-muted-foreground">{translate("resources.bookings.fields.id")}</div>
          <div className="text-sm font-semibold">#<TextField source="id" /></div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{isEn ? "Schedule" : "Jadwal Layanan"}</div>
          <div className="text-sm font-medium"><TextField source="booking_date" /> • <TextField source="booking_time" /></div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{translate("resources.bookings.fields.customer_id")}</div>
          <div className="text-sm font-semibold text-primary">
            <ReferenceField source="customer_id" reference="customers">
              <TextField source="full_name" />
            </ReferenceField>
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{translate("resources.bookings.fields.service_id")}</div>
          <div className="text-sm font-semibold">
            <ReferenceField source="service_id" reference="services">
              <TextField source="name" />
            </ReferenceField>
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{translate("resources.bookings.fields.therapist_id")}</div>
          <div className="text-sm font-medium">
            <ReferenceField source="therapist_id" reference="therapists">
              <TextField source="name" />
            </ReferenceField>
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{translate("resources.bookings.fields.total_price")}</div>
          <div className="text-base font-bold text-primary">
            <NumberField
              source="total_price"
              options={{ style: "currency", currency: "IDR", maximumFractionDigits: 0 }}
            />
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{translate("resources.bookings.fields.status")}</div>
          <div className="text-sm mt-1"><BadgeField source="status" /></div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{translate("resources.bookings.fields.payment_status")}</div>
          <div className="text-sm mt-1">
            <BadgeField source="payment_status" /> (<TextField source="payment_method" />)
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="text-xs text-muted-foreground">{translate("resources.bookings.fields.service_address")}</div>
          <div className="text-sm font-medium mt-1"><TextField source="service_address" /></div>
        </div>
        <div className="md:col-span-2">
          <div className="text-xs text-muted-foreground">{translate("resources.bookings.fields.special_requests")}</div>
          <div className="text-sm text-muted-foreground mt-1"><TextField source="special_requests" /></div>
        </div>
        <BookingCommissionBreakdown />
      </div>
    </Show>
  );
};
