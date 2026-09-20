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

import { useLocaleState } from "ra-core";

export const useTherapistOptionText = () => {
  const [locale] = useLocaleState();
  return (choice: any) => {
    if (!choice) return "";
    const status = choice.status;
    const dot = status === "available" ? "🟢" : status === "on_duty" ? "🟡" : "⚪";
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
    return `${choice.name} (${dot} ${label})`;
  };
};

export const useServiceOptionText = () => {
  const [locale] = useLocaleState();
  return (choice: any) => {
    if (!choice) return "";
    const formattedPrice = new Intl.NumberFormat(locale === "en" ? "en-US" : "id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(choice.price) || 0);
    const durationUnit = locale === "en" ? "mins" : "mnt";
    return `${choice.name} (${choice.duration_minutes} ${durationUnit} • ${formattedPrice})`;
  };
};

export const BookingEdit = () => {
  const therapistOptionText = useTherapistOptionText();
  const serviceOptionText = useServiceOptionText();

  return (
    <Edit>
      <SimpleForm>
        <ReferenceInput source="customer_id" reference="customers">
          <SelectInput optionText="full_name" />
        </ReferenceInput>
        <ReferenceInput source="service_id" reference="services">
          <SelectInput optionText={serviceOptionText} />
        </ReferenceInput>
        <ReferenceInput source="therapist_id" reference="therapists">
          <SelectInput optionText={therapistOptionText} />
        </ReferenceInput>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <DatePickerInput source="booking_date" required />
          <TimePickerInput source="booking_time" required />
        </div>
        <TextInput source="service_address" multiline rows={2} />
        <NumberInput source="total_price" required />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
          <SelectInput
            source="status"
            choices={[
              { id: "pending", name: "resources.bookings.status.pending" },
              { id: "confirmed", name: "resources.bookings.status.confirmed" },
              { id: "completed", name: "resources.bookings.status.completed" },
              { id: "canceled", name: "resources.bookings.status.canceled" },
            ]}
          />
          <SelectInput
            source="payment_method"
            choices={[
              { id: "cash", name: "resources.bookings.payment_method.cash" },
              { id: "qris", name: "resources.bookings.payment_method.qris" },
              { id: "bank_transfer", name: "resources.bookings.payment_method.bank_transfer" },
            ]}
          />
          <SelectInput
            source="payment_status"
            choices={[
              { id: "unpaid", name: "resources.bookings.payment_status.unpaid" },
              { id: "paid", name: "resources.bookings.payment_status.paid" },
              { id: "refunded", name: "resources.bookings.payment_status.refunded" },
            ]}
          />
        </div>
        <TextInput source="special_requests" multiline rows={2} />
      </SimpleForm>
    </Edit>
  );
};

export const BookingCreate = () => {
  const [locale] = useLocaleState();
  const therapistOptionText = useTherapistOptionText();
  const serviceOptionText = useServiceOptionText();

  return (
    <Create>
      <SimpleForm>
        {/* Customer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <TextInput
            source="customer_name"
            placeholder={locale === "en" ? "e.g. John Doe" : "Contoh: Budi Santoso"}
            required
          />
          <PhoneInput
            source="customer_phone"
            placeholder="812-3456-7890"
            required
          />
        </div>

        {/* Service & Therapist Assignment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <ReferenceInput source="service_id" reference="services">
            <SelectInput optionText={serviceOptionText} required />
          </ReferenceInput>
          <ReferenceInput source="therapist_id" reference="therapists">
            <SelectInput optionText={therapistOptionText} required />
          </ReferenceInput>
        </div>

        {/* Schedule */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <DatePickerInput
            source="booking_date"
            defaultValue={new Date().toISOString().split("T")[0]}
            required
          />
          <TimePickerInput source="booking_time" defaultValue="10:00" required />
        </div>

        {/* Location & Pricing */}
        <TextInput source="service_address" multiline rows={2} />
        <NumberInput source="total_price" defaultValue={185000} required />

        {/* Status & Payment */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
          <SelectInput
            source="status"
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
            defaultValue="cash"
            choices={[
              { id: "cash", name: "resources.bookings.payment_method.cash" },
              { id: "qris", name: "resources.bookings.payment_method.qris" },
              { id: "bank_transfer", name: "resources.bookings.payment_method.bank_transfer" },
            ]}
          />
          <SelectInput
            source="payment_status"
            defaultValue="unpaid"
            choices={[
              { id: "unpaid", name: "resources.bookings.payment_status.unpaid" },
              { id: "paid", name: "resources.bookings.payment_status.paid" },
              { id: "refunded", name: "resources.bookings.payment_status.refunded" },
            ]}
          />
        </div>
        <TextInput source="special_requests" multiline rows={2} />
      </SimpleForm>
    </Create>
  );
};

import { useRecordContext, useGetOne, useTranslate } from "ra-core";

const BookingCommissionBreakdown = () => {
  const record = useRecordContext();
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  const { data: therapist } = useGetOne(
    "therapists",
    { id: record?.therapist_id },
    { enabled: !!record?.therapist_id }
  );

  if (!record || !therapist) return null;

  const commissionRate = Number(therapist.commission_rate) || 60;
  const totalPrice = Number(record.total_price) || 0;
  const therapistFee = Math.round((totalPrice * commissionRate) / 100);
  const netAdminIncome = totalPrice - therapistFee;

  const formatIDR = (val: number) =>
    new Intl.NumberFormat(isEn ? "en-US" : "id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="md:col-span-2 p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 mt-1 space-y-2">
      <div className="text-xs font-semibold text-foreground flex items-center justify-between">
        <span>{isEn ? "Therapist Commission Breakdown" : "Rincian Bagi Hasil Terapis"}</span>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400">
          {therapist.name} ({commissionRate}%)
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-amber-500/15">
        <div>
          <span className="text-muted-foreground block text-[11px]">{isEn ? "Therapist Fee:" : "Hak Terapis:"}</span>
          <span className="font-semibold text-amber-700 dark:text-amber-400">
            {formatIDR(therapistFee)}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[11px]">{isEn ? "Net Serena Raga:" : "Laba Bersih Serena Raga:"}</span>
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
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
