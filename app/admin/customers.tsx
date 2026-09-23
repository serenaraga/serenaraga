"use client";

import * as React from "react";
import {
  useRecordContext,
  useLocaleState,
  useGetList,
} from "ra-core";
import { List } from "@/components/list";
import { DataTable, DataTableCol } from "@/components/data-table";
import { TextField } from "@/components/text-field";
import { NumberField } from "@/components/number-field";
import { Edit } from "@/components/edit";
import { Create } from "@/components/create";
import { Show } from "@/components/show";
import { SimpleForm } from "@/components/simple-form";
import { TextInput } from "@/components/text-input";
import { NumberInput } from "@/components/number-input";
import { PhoneInput } from "@/components/phone-input";
import { RowActions } from "@/components/row-actions";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Sparkles,
  Crown,
  Medal,
  User,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  TicketPercent,
  CheckCircle2,
  History,
} from "lucide-react";
import { formatIDR } from "@/lib/utils";

/**
 * Hook to get customer CRM metrics from paid/completed invoices & legacy offline count
 */
export const useCustomerMetrics = (
  customerId?: number | string,
  phone?: string,
  manualOrdersCount: number = 0
) => {
  const { data: invoices = [], isPending, isLoading } = useGetList("invoices", {
    pagination: { page: 1, perPage: 1000 },
  });

  const cleanPhone = React.useMemo(() => phone?.replace(/\D/g, "") || "", [phone]);
  const isMetricsLoading = isPending || isLoading;

  return React.useMemo(() => {
    const manualCount = Math.max(0, Number(manualOrdersCount || 0));

    if (isMetricsLoading) {
      return {
        isPending: true,
        ordersCount: manualCount,
        invoiceOrdersCount: 0,
        manualOrdersCount: manualCount,
        totalSpent: 0,
        tier: "new" as const,
        lastOrderDate: null,
      };
    }

    if (!customerId && !cleanPhone) {
      let tier: "new" | "regular" | "silver" | "gold" = "new";
      if (manualCount >= 10) tier = "gold";
      else if (manualCount >= 5) tier = "silver";
      else if (manualCount >= 1) tier = "regular";

      return {
        isPending: false,
        ordersCount: manualCount,
        invoiceOrdersCount: 0,
        manualOrdersCount: manualCount,
        totalSpent: 0,
        tier,
        lastOrderDate: null,
      };
    }

    const matchedInvoices = invoices.filter((inv: any) => {
      const invPhone = inv.customer_phone?.replace(/\D/g, "") || "";
      const isPaid = inv.payment_status === "paid";
      const isMatch =
        (customerId && Number(inv.customer_id) === Number(customerId)) ||
        (cleanPhone.length >= 8 && invPhone && invPhone.endsWith(cleanPhone.slice(-8)));
      return isMatch && isPaid;
    });

    const invoiceOrdersCount = matchedInvoices.length;
    const totalOrdersCount = invoiceOrdersCount + manualCount;

    const totalSpent = matchedInvoices.reduce(
      (sum: number, inv: any) => sum + Number(inv.total_amount || 0),
      0
    );

    let tier: "new" | "regular" | "silver" | "gold" = "new";
    if (totalOrdersCount >= 10) tier = "gold";
    else if (totalOrdersCount >= 5) tier = "silver";
    else if (totalOrdersCount >= 1) tier = "regular";

    const lastInvoice = matchedInvoices.sort(
      (a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    )[0];

    return {
      isPending: false,
      ordersCount: totalOrdersCount,
      invoiceOrdersCount,
      manualOrdersCount: manualCount,
      totalSpent,
      tier,
      lastOrderDate: lastInvoice ? lastInvoice.created_at : null,
    };
  }, [invoices, customerId, cleanPhone, manualOrdersCount, isMetricsLoading]);
};

/**
 * Customer Tier Badge - Seamless with Lucide Status Icons matching Booking and Discounts
 */
const CustomerTierBadge = () => {
  const record = useRecordContext();
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const metrics = useCustomerMetrics(record?.id, record?.phone, record?.manual_orders_count);
  if (!record) return null;

  if (metrics.isPending) {
    return <Skeleton className="h-4 w-20 rounded inline-block bg-muted/60" />;
  }

  let icon = <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
  let label = isEn ? "New (0x Orders)" : "Baru (0x Order)";

  if (metrics.tier === "gold") {
    icon = <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
    label = `Gold VIP (${metrics.ordersCount}x)`;
  } else if (metrics.tier === "silver") {
    icon = <Medal className="w-3.5 h-3.5 text-purple-500 shrink-0" />;
    label = `Silver VIP (${metrics.ordersCount}x)`;
  } else if (metrics.tier === "regular") {
    icon = <ShoppingBag className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
    label = isEn ? `Regular (${metrics.ordersCount}x)` : `Reguler (${metrics.ordersCount}x)`;
  }

  return (
    <span className="inline-flex items-center gap-1.5 font-medium text-foreground whitespace-nowrap">
      {icon}
      <span>{label}</span>
    </span>
  );
};

/**
 * Customer Spend Metric Cell - Matching Booking List price styling
 */
const CustomerSpendCell = () => {
  const record = useRecordContext();
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const metrics = useCustomerMetrics(record?.id, record?.phone, record?.manual_orders_count);
  if (!record) return null;

  if (metrics.isPending) {
    return (
      <div className="space-y-1">
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-2.5 w-20" />
      </div>
    );
  }

  return (
    <div>
      <span className="font-semibold text-foreground text-xs">{formatIDR(metrics.totalSpent)}</span>
      <span className="text-[11px] text-muted-foreground block">
        {metrics.ordersCount} {isEn ? "orders completed" : "order lunas"}
      </span>
    </div>
  );
};

export const CustomerList = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <List title={isEn ? "Customers" : "Data Pelanggan"}>
      <DataTable>
        <DataTableCol
          source="id"
          label="#"
          headerClassName="w-14"
          cellClassName="text-xs font-bold text-primary"
        />
        <DataTableCol
          source="full_name"
          label={isEn ? "Customer Name" : "Nama Pelanggan"}
        />
        <DataTableCol
          source="phone"
          label="WhatsApp"
        />
        <DataTableCol label={isEn ? "Customer Tier" : "Level Pelanggan"}>
          <CustomerTierBadge />
        </DataTableCol>
        <DataTableCol label={isEn ? "Lifetime Value (LTV)" : "Total Belanja (LTV)"}>
          <CustomerSpendCell />
        </DataTableCol>
        <DataTableCol
          source="city_area"
          label={isEn ? "City / Area" : "Wilayah"}
        />
        <DataTableCol
          source="address"
          label={isEn ? "Address" : "Alamat"}
          cellClassName="truncate max-w-xs text-muted-foreground"
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

/**
 * Shared Clean & Modern Customer Form Layout using Shadcn Cards
 */
const CustomerFormContent = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <div className="space-y-5 max-w-4xl">
      {/* 1. Card: Customer Identity & Contacts */}
      <Card className="border border-border/70 shadow-none bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <User className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                {isEn ? "Customer Identity & Contacts" : "Identitas Pelanggan & Kontak"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {isEn
                  ? "Enter customer full name, active WhatsApp phone number, and optional email."
                  : "Masukkan nama lengkap, nomor WhatsApp aktif untuk invoice digital, serta alamat email opsional."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start w-full">
            <TextInput
              source="full_name"
              label={isEn ? "Customer Name" : "Nama Pelanggan"}
              required
              placeholder={isEn ? "e.g. Budi Santoso" : "Contoh: Budi Santoso"}
            />
            <PhoneInput
              source="phone"
              label="WhatsApp"
              required
              placeholder="812-3456-7890"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start w-full pt-1">
            <TextInput
              source="email"
              label={isEn ? "Email (Optional)" : "Email (Opsional)"}
              placeholder="customer@example.com"
            />
            <TextInput
              source="city_area"
              label={isEn ? "City / Area" : "Kota / Wilayah"}
              defaultValue="Jakarta Selatan"
              placeholder={isEn ? "e.g. Jakarta Selatan" : "Contoh: Jakarta Selatan"}
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. Card: Service Location & Address */}
      <Card className="border border-border/70 shadow-none bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                {isEn ? "Default Service Address & Location" : "Alamat Lengkap & Lokasi Pelayanan"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {isEn
                  ? "Complete address for therapist on-site home, apartment, or hotel visits."
                  : "Alamat lengkap kunjungan terapis ke rumah, apartemen, atau hotel pelanggan."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <TextInput
            source="address"
            label={isEn ? "Full Service Address" : "Alamat Lengkap Pemesanan"}
            multiline
            rows={2}
            required
            placeholder={
              isEn
                ? "e.g. Jl. Senopati No. 12, Unit 12B, Kebayoran Baru, Jakarta Selatan..."
                : "Contoh: Jl. Senopati No. 12, Apartemen Senopati Tower A Unit 12B, Kebayoran Baru..."
            }
          />
        </CardContent>
      </Card>

      {/* 3. Card: CRM Loyalty History & Preferences */}
      <Card className="border border-border/70 shadow-none bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                {isEn ? "CRM Loyalty History & Preferences" : "Riwayat Loyalitas CRM & Preferensi Khusus"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {isEn
                  ? "Synchronize legacy offline orders and record massage preferences or health notes."
                  : "Sinkronkan riwayat order offline pelanggan lama serta catatan preferensi pijat & pantangan kesehatan."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <NumberInput
            source="manual_orders_count"
            label={isEn ? "Previous Offline / Legacy Orders Count" : "Riwayat Order Offline / Sebelumnya"}
            defaultValue={0}
            min={0}
            placeholder="0"
            helperText={
              isEn
                ? "Past offline orders before system was built, used for automatic loyalty tier calculations."
                : "Jumlah order offline pelanggan sebelum sistem online dibuat, untuk sinkronisasi level loyalitas & diskon."
            }
          />
          <TextInput
            source="notes"
            label={isEn ? "Customer Notes & Massage Preferences" : "Catatan Preferensi Pijat & Keluhan"}
            multiline
            rows={2}
            placeholder={
              isEn
                ? "e.g. Prefers medium pressure, focus on shoulder/back, avoid neck area..."
                : "Contoh: Prefer terapis wanita, fokus pundak kaku, hindari area leher karena sensitif..."
            }
          />
        </CardContent>
      </Card>
    </div>
  );
};

export const CustomerEdit = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <Edit title={isEn ? "Edit Customer" : "Ubah Data Pelanggan"}>
      <SimpleForm>
        <CustomerFormContent />
      </SimpleForm>
    </Edit>
  );
};

export const CustomerCreate = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <Create title={isEn ? "Add Customer" : "Tambah Pelanggan Baru"}>
      <SimpleForm
        defaultValues={{
          city_area: "Jakarta Selatan",
          manual_orders_count: 0,
        }}
      >
        <CustomerFormContent />
      </SimpleForm>
    </Create>
  );
};

const CustomerShowContent = () => {
  const record = useRecordContext();
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const metrics = useCustomerMetrics(record?.id, record?.phone, record?.manual_orders_count);
  const { data: promotions = [] } = useGetList("promotions", {
    pagination: { page: 1, perPage: 100 },
  });

  if (!record) return null;

  // Compute eligible promotions for this customer
  const eligiblePromos = promotions.filter((p: any) => {
    if (p.is_active === false) return false;
    if (p.scope === "first_order") return metrics.ordersCount === 0;
    if (p.scope === "loyalty_milestone") return metrics.ordersCount >= Number(p.min_orders_count || 10);
    if (p.scope === "all") return true;
    return false;
  });

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 1. Customer Overview & CRM Tier Card */}
      <Card className="border border-border/70 shadow-none bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                <User className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <TextField source="full_name" />
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                  <Phone className="w-3.5 h-3.5" />
                  <span className="font-mono">{record.phone}</span>
                  {record.email && (
                    <>
                      <span>•</span>
                      <Mail className="w-3.5 h-3.5" />
                      <span>{record.email}</span>
                    </>
                  )}
                </CardDescription>
              </div>
            </div>
            <CustomerTierBadge />
          </div>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-muted/20 border border-border/50 rounded-xl">
            <span className="text-[11px] text-muted-foreground block">
              {isEn ? "Completed Orders" : "Total Order Lunas"}
            </span>
            <span className="text-lg font-bold text-foreground font-mono">{metrics.ordersCount}x</span>
            {metrics.manualOrdersCount > 0 && (
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                ({metrics.invoiceOrdersCount} online + {metrics.manualOrdersCount} offline)
              </span>
            )}
          </div>
          <div className="p-3 bg-muted/20 border border-border/50 rounded-xl">
            <span className="text-[11px] text-muted-foreground block">
              {isEn ? "Lifetime Value (LTV)" : "Total Belanja (LTV)"}
            </span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {formatIDR(metrics.totalSpent)}
            </span>
          </div>
          <div className="p-3 bg-muted/20 border border-border/50 rounded-xl">
            <span className="text-[11px] text-muted-foreground block">
              {isEn ? "Avg. Order Value" : "Rata-rata Order"}
            </span>
            <span className="text-sm font-semibold text-foreground font-mono">
              {formatIDR(metrics.invoiceOrdersCount > 0 ? Math.round(metrics.totalSpent / metrics.invoiceOrdersCount) : 0)}
            </span>
          </div>
          <div className="p-3 bg-muted/20 border border-border/50 rounded-xl">
            <span className="text-[11px] text-muted-foreground block">
              {isEn ? "Last Order Date" : "Order Terakhir"}
            </span>
            <span className="text-xs font-medium text-foreground">
              {metrics.lastOrderDate ? new Date(metrics.lastOrderDate).toLocaleDateString(isEn ? "en-US" : "id-ID") : isEn ? "None" : "Belum Ada"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 2. Eligible Promotions & Loyalty Status */}
      <Card className="border border-border/70 shadow-none bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <TicketPercent className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                {isEn ? "Eligible Promotions & Benefits" : "Promo & Diskon yang Berhak Didapatkan"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {isEn
                  ? "Active discounts applicable for this customer based on order history."
                  : "Daftar diskon aktif yang otomatis dapat digunakan saat invoicing pemesanan pelanggan ini."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {eligiblePromos.length === 0 ? (
            <div className="text-xs text-muted-foreground py-2">
              {isEn
                ? "No special automatic promotion for current customer status."
                : "Tidak ada promo otomatis khusus untuk status pelanggan saat ini."}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {eligiblePromos.map((promo: any) => (
                <div
                  key={promo.id}
                  className="border border-emerald-500/30 bg-emerald-500/5 rounded-xl p-3 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-semibold text-foreground">{promo.name}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground block">
                      {isEn ? "Discount:" : "Potongan:"} {promo.type === "percentage" ? `${promo.value}% OFF` : formatIDR(promo.value)}
                      {promo.code ? ` • ${isEn ? "Code:" : "Kode:"} ${promo.code}` : ""}
                    </span>
                  </div>
                  <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px]">
                    {isEn ? "Ready to Use" : "Siap Digunakan"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Customer Address & Notes */}
      <Card className="border border-border/70 shadow-none bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                {isEn ? "Service Address & Area" : "Alamat Pemesanan & Preferensi"}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-3 text-xs">
          <div>
            <span className="text-muted-foreground block text-[11px]">
              {isEn ? "City / Area" : "Wilayah / Area"}
            </span>
            <span className="font-medium text-foreground"><TextField source="city_area" /></span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">
              {isEn ? "Full Service Address" : "Alamat Lengkap"}
            </span>
            <span className="font-medium text-foreground"><TextField source="address" /></span>
          </div>
          {record.notes && (
            <div className="pt-2 border-t border-border/40">
              <span className="text-muted-foreground block text-[11px]">
                {isEn ? "Customer Notes & Preferences" : "Catatan Preferensi Pelanggan"}
              </span>
              <span className="text-muted-foreground"><TextField source="notes" /></span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export const CustomerShow = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <Show title={isEn ? "Customer Details" : "Detail Pelanggan"}>
      <CustomerShowContent />
    </Show>
  );
};


