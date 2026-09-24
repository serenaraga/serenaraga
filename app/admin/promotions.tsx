"use client";

import * as React from "react";
import {
  useRecordContext,
  useLocaleState,
  required,
} from "ra-core";
import { List } from "@/components/list";
import { DataTable, DataTableCol } from "@/components/data-table";
import { TextField } from "@/components/text-field";
import { NumberField } from "@/components/number-field";
import { BooleanField } from "@/components/boolean-field";
import { Edit } from "@/components/edit";
import { Create } from "@/components/create";
import { Show } from "@/components/show";
import { SimpleForm } from "@/components/simple-form";
import { TextInput } from "@/components/text-input";
import { NumberInput } from "@/components/number-input";
import { SelectInput } from "@/components/select-input";
import { BooleanInput } from "@/components/boolean-input";
import { RowActions } from "@/components/row-actions";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  TicketPercent,
  Sparkles,
  FileText,
  Crown,
  HeartHandshake,
  ShoppingBag,
  DollarSign,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { formatIDR, localizePromoName } from "@/lib/utils";

export const getPromotionTypeChoices = (isEn: boolean) => [
  { id: "percentage", name: isEn ? "Percentage (%)" : "Persentase (%)" },
  { id: "fixed", name: isEn ? "Fixed Amount (IDR)" : "Nominal Tetap (IDR)" },
];

export const getPromotionScopeChoices = (isEn: boolean) => [
  { id: "first_order", name: isEn ? "First-Time Customer Only" : "Pelanggan Baru (First-Time Order Only)" },
  { id: "loyalty_milestone", name: isEn ? "Loyal Customer Milestone (Min. X Orders)" : "Pelanggan Setia / Loyal (Min. X Order Selesai)" },
  { id: "min_order", name: isEn ? "Minimum Order Spend (IDR)" : "Minimum Pembelian (Min. Belanja IDR)" },
  { id: "code", name: isEn ? "Voucher Code Only" : "Khusus Kode Voucher Saja" },
  { id: "all", name: isEn ? "All Customers (General)" : "Semua Pelanggan (Umum)" },
];

/**
 * Clean & Localized Promo Name Field matching Booking list typography
 */
const PromoNameField = () => {
  const record = useRecordContext();
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  if (!record) return null;
  return <span>{localizePromoName(record.name, isEn)}</span>;
};

/**
 * Clean Voucher Code Field matching standard table font
 */
const PromoCodeField = () => {
  const record = useRecordContext();
  if (!record) return null;
  if (!record.code) {
    return <span className="text-muted-foreground/50">—</span>;
  }
  return <span className="font-semibold text-primary">{record.code}</span>;
};

/**
 * Seamless & Clean Scope Badge Field with Lucide Status Icon matching Booking List
 */
const ScopeBadgeField = ({ source = "scope" }: { source?: string }) => {
  const record = useRecordContext();
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  if (!record) return null;
  const scope = record[source];

  let icon = <HeartHandshake className="w-3.5 h-3.5 text-stone-500 shrink-0" />;
  let label = isEn ? "All Customers" : "Semua Pelanggan";

  if (scope === "first_order") {
    icon = <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
    label = isEn ? "First Customer (5%)" : "Pelanggan Baru (5%)";
  } else if (scope === "loyalty_milestone") {
    icon = <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
    label = isEn
      ? `Loyal (≥${record.min_orders_count || 10}x)`
      : `Pelanggan Setia (≥${record.min_orders_count || 10}x)`;
  } else if (scope === "min_order") {
    icon = <ShoppingBag className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
    label = isEn ? "Min. Order Spend" : "Min. Nilai Belanja";
  } else if (scope === "code") {
    icon = <TicketPercent className="w-3.5 h-3.5 text-purple-500 shrink-0" />;
    label = isEn ? "Voucher Code" : "Kode Voucher";
  }

  return (
    <span className="inline-flex items-center gap-1.5 font-medium text-foreground whitespace-nowrap">
      {icon}
      <span>{label}</span>
    </span>
  );
};

/**
 * Value Field matching Booking List format
 */
const PromotionValueField = () => {
  const record = useRecordContext();
  if (!record) return null;

  if (record.type === "percentage") {
    return <span className="font-semibold text-foreground">{record.value}% OFF</span>;
  }

  return (
    <span className="font-semibold text-foreground">
      {formatIDR(Number(record.value || 0))}
    </span>
  );
};

/**
 * Clean & Seamless Commission Base Field with Lucide Icon matching Booking List
 */
const CommissionRuleField = () => {
  const record = useRecordContext();
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  if (!record) return null;

  if (record.deduct_from_therapist_commission) {
    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-foreground whitespace-nowrap">
        <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>{isEn ? "Post-Discount (Net Price)" : "Setelah Diskon (Harga Bersih)"}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 font-medium text-foreground whitespace-nowrap">
      <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
      <span>{isEn ? "Pre-Discount (Gross Price)" : "Sebelum Diskon (Harga Normal)"}</span>
    </span>
  );
};

/**
 * Active Status Field with Lucide Icons matching Booking Status
 */
const PromotionActiveField = () => {
  const record = useRecordContext();
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  if (!record) return null;

  const isActive = Boolean(record.is_active);
  return (
    <span className="inline-flex items-center gap-1.5 font-medium text-foreground whitespace-nowrap">
      {isActive ? (
        <>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>{isEn ? "Active" : "Aktif"}</span>
        </>
      ) : (
        <>
          <XCircle className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
          <span className="text-muted-foreground">{isEn ? "Inactive" : "Nonaktif"}</span>
        </>
      )}
    </span>
  );
};

/**
 * Promotion List - Styled consistently with BookingList
 */
export const PromotionList = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <List title={isEn ? "Discounts" : "Diskon"}>
      <DataTable>
        <DataTableCol
          source="id"
          label="#"
          headerClassName="w-14"
          cellClassName="text-xs font-bold text-primary"
        />
        <DataTableCol
          source="name"
          label={isEn ? "Promo Name" : "Nama Promo"}
        >
          <PromoNameField />
        </DataTableCol>
        <DataTableCol
          source="code"
          label={isEn ? "Voucher Code" : "Kode Voucher"}
        >
          <PromoCodeField />
        </DataTableCol>
        <DataTableCol
          source="value"
          label={isEn ? "Discount Value" : "Nilai Diskon"}
          cellClassName="text-xs font-semibold"
        >
          <PromotionValueField />
        </DataTableCol>
        <DataTableCol
          source="scope"
          label={isEn ? "Eligibility Scope" : "Target Pelanggan"}
        >
          <ScopeBadgeField source="scope" />
        </DataTableCol>
        <DataTableCol
          source="deduct_from_therapist_commission"
          label={isEn ? "Therapist Commission Base" : "Dasar Komisi Terapis"}
        >
          <CommissionRuleField />
        </DataTableCol>
        <DataTableCol
          source="is_active"
          label={isEn ? "Status" : "Status"}
        >
          <PromotionActiveField />
        </DataTableCol>
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

/**
 * Symmetrical & Clean Promotion Form Content
 */
const PromotionFormContent = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <div className="space-y-6 max-w-4xl w-full">
      {/* 1. Card: Basic Information */}
      <Card className="border border-border shadow-none bg-card">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <TicketPercent className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                {isEn ? "Basic Promotion Information" : "Informasi Utama Promo"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {isEn
                  ? "Define promo title, optional voucher code, and discount value."
                  : "Tentukan nama promo, kode voucher opsional, serta besaran potongan harga."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start w-full">
            <TextInput
              source="name"
              label={isEn ? "Promo Name" : "Nama Promo"}
              required
              validate={required(isEn ? "Promo name is required" : "Nama promo wajib diisi")}
              placeholder={isEn ? "e.g. 5% First-Time Customer Discount" : "Contoh: Diskon 5% Pelanggan Pertama"}
            />
            <TextInput
              source="code"
              label={isEn ? "Voucher Code (Optional)" : "Kode Voucher (Opsional)"}
              placeholder="e.g. FIRST5, SERENAVIP, LOYAL10"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start w-full pt-1">
            <SelectInput
              source="type"
              label={isEn ? "Discount Type" : "Tipe Diskon"}
              choices={getPromotionTypeChoices(isEn)}
              required
              validate={required(isEn ? "Discount type is required" : "Tipe diskon wajib dipilih")}
            />
            <NumberInput
              source="value"
              label={isEn ? "Discount Value (% or IDR)" : "Nilai Diskon (% atau IDR)"}
              required
              validate={required(isEn ? "Discount value is required" : "Nilai diskon wajib diisi")}
              min={0}
              placeholder="5"
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. Card: Eligibility & Customer Targets */}
      <Card className="border border-border shadow-none bg-card">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                {isEn ? "Eligibility Target & Requirements" : "Target Pelanggan & Syarat Order"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {isEn
                  ? "Configure customer criteria, minimum completed orders (Loyalty), and spend limits."
                  : "Atur kriteria penerima diskon, batas minimal order selesai (Program Loyalitas), dan batas belanja."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start w-full">
            <SelectInput
              source="scope"
              label={isEn ? "Target Audience / Eligibility" : "Target Penerima Promo"}
              choices={getPromotionScopeChoices(isEn)}
              required
              validate={required(isEn ? "Target audience is required" : "Target penerima wajib dipilih")}
            />
            <NumberInput
              source="min_orders_count"
              label={isEn ? "Min. Completed Orders (For Loyalty Scope)" : "Min. Order Selesai (Untuk Promo Loyalitas)"}
              defaultValue={0}
              min={0}
              placeholder="Contoh: 10 (untuk pelanggan 10x order)"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start w-full pt-1">
            <NumberInput
              source="min_order_amount"
              label={isEn ? "Minimum Order Amount (IDR)" : "Minimum Belanja Layanan (IDR)"}
              defaultValue={0}
              min={0}
              placeholder="0"
            />
            <NumberInput
              source="max_discount_cap"
              label={isEn ? "Max Discount Cap IDR (Optional)" : "Maksimal Potongan IDR (Batas Atas Cap)"}
              placeholder="Contoh: 50000"
              min={0}
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. Card: Business Rules & Cost Allocation */}
      <Card className="border border-border shadow-none bg-card">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                {isEn ? "Therapist Commission Basis & Policy" : "Dasar Komisi Terapis & Kebijakan Promo"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {isEn
                  ? "Set whether therapist commission is calculated before or after the promotional discount."
                  : "Tentukan apakah komisi mitra terapis dihitung dari harga normal (sebelum promo) atau dari harga setelah promo."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start w-full">
            {/* Commission Calculation Basis Toggle */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground block">
                {isEn ? "Therapist Commission Basis" : "Dasar Perhitungan Komisi Terapis"}
              </label>
              <div className="min-h-[38px] flex items-center px-3 py-2 border border-border/70 rounded-md bg-muted/20">
                <BooleanInput
                  source="deduct_from_therapist_commission"
                  label={
                    isEn
                      ? "Calculate commission AFTER discount (Net Price)"
                      : "Hitung komisi SETELAH promo (Harga Bersih)"
                  }
                  defaultValue={false}
                  className="mt-0 pt-0"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isEn
                  ? "Default (OFF): Commission is calculated before discount (Gross Price), so therapists receive full standard payout."
                  : "Default (NONAKTIF): Komisi dihitung dari harga normal sebelum diskon, sehingga mitra terapis tetap menerima bagi hasil penuh."}
              </p>
            </div>

            {/* Promo Status Switch */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground block">
                {isEn ? "Operational Status" : "Status Operasional"}
              </label>
              <div className="min-h-[38px] flex items-center px-3 py-2 border border-border/70 rounded-md bg-muted/20">
                <BooleanInput
                  source="is_active"
                  label={isEn ? "Active & Eligible for Transactions" : "Aktif & Siap Digunakan Transaksi"}
                  defaultValue={true}
                  className="mt-0 pt-0"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isEn
                  ? "When active, this promo will be automatically recommended in checkout and bookings."
                  : "Promo yang aktif akan otomatis direkomendasikan saat kasir checkout & reservasi booking."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Card: Terms & Conditions Description */}
      <Card className="border border-border shadow-none bg-card">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                {isEn ? "Terms & Conditions" : "Syarat & Ketentuan"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {isEn
                  ? "Optional internal notes or terms displayed for this promotion."
                  : "Catatan internal atau ketentuan khusus yang berlaku untuk promo ini."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <TextInput
            source="description"
            label={isEn ? "Description / Terms & Conditions" : "Keterangan & Catatan Promo"}
            multiline
            rows={3}
            placeholder={isEn ? "Terms of usage, requirements, notes..." : "Syarat penggunaan, catatan admin..."}
          />
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Promotion Create Form
 */
export const PromotionCreate = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <Create title={isEn ? "Create Discount" : "Tambah Diskon Baru"}>
      <SimpleForm
        defaultValues={{
          is_active: true,
          type: "percentage",
          value: 5,
          scope: "first_order",
          min_orders_count: 0,
          min_order_amount: 0,
          deduct_from_therapist_commission: false,
        }}
      >
        <PromotionFormContent />
      </SimpleForm>
    </Create>
  );
};

/**
 * Promotion Edit Form
 */
export const PromotionEdit = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <Edit title={isEn ? "Edit Discount" : "Ubah Data Diskon"}>
      <SimpleForm>
        <PromotionFormContent />
      </SimpleForm>
    </Edit>
  );
};

/**
 * Promotion Show / Detail View
 */
export const PromotionShow = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <Show title={isEn ? "Discount Details" : "Detail Diskon"}>
      <div className="space-y-4 max-w-4xl">
        <Card className="rounded-xl border border-border shadow-none bg-card">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TicketPercent className="w-5 h-5 text-primary" />
                <TextField source="name" />
              </CardTitle>
              <ScopeBadgeField source="scope" />
            </div>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px]">
                {isEn ? "Voucher Code" : "Kode Voucher"}
              </span>
              <span className="font-mono font-semibold text-primary">
                <TextField source="code" />
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">
                {isEn ? "Discount Value" : "Nilai Diskon"}
              </span>
              <PromotionValueField />
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">
                {isEn ? "Min. Completed Orders" : "Syarat Min. Order"}
              </span>
              <span className="font-mono font-medium text-foreground">
                <NumberField source="min_orders_count" defaultValue={0} />x Order
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">
                {isEn ? "Min. Order Amount" : "Min. Nilai Transaksi"}
              </span>
              <NumberField
                source="min_order_amount"
                options={{ style: "currency", currency: "IDR", maximumFractionDigits: 0 }}
              />
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">
                {isEn ? "Max Discount Cap" : "Batas Maksimal Diskon"}
              </span>
              <NumberField
                source="max_discount_cap"
                options={{ style: "currency", currency: "IDR", maximumFractionDigits: 0 }}
              />
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">
                {isEn ? "Therapist Commission Base" : "Dasar Komisi Terapis"}
              </span>
              <CommissionRuleField />
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">
                {isEn ? "Operational Status" : "Status Operasional"}
              </span>
              <BooleanField source="is_active" />
            </div>
            <div className="sm:col-span-2 md:col-span-3 pt-2 border-t border-border/40 text-muted-foreground">
              <span className="text-[11px] block font-medium text-foreground">
                {isEn ? "Terms & Conditions / Notes:" : "Syarat & Ketentuan / Catatan:"}
              </span>
              <div className="mt-1">
                <TextField source="description" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Show>
  );
};


