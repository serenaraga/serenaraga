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
import { CheckCircle2, CalendarCheck } from "lucide-react";
import { BOOKING_STATUS_CHOICES, PAYMENT_STATUS_CHOICES } from "@/components/status-badge";
import { PAYMENT_METHODS } from "@/components/payment-method";

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
  useGetList,
  useRecordContext,
  useTranslate,
  required,
} from "ra-core";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  UserCheck,
  Sparkles,
  MapPin,
  CreditCard,
  FileText,
  DollarSign,
  User,
  Phone,
  Crown,
  Medal,
  ShoppingBag,
  TicketPercent,
  X,
} from "lucide-react";
import { formatIDR } from "@/lib/utils";
import { toast } from "sonner";

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
  const { setValue } = useFormContext();
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
 * Smart Customer Auto-Suggest & Auto-Fill Component
 */
const CustomerAutoSuggestField = () => {
  const { setValue, register } = useFormContext();
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  const customerName = useWatch({ name: "customer_name" }) || "";
  const customerPhone = useWatch({ name: "customer_phone" }) || "";
  const customerId = useWatch({ name: "customer_id" });

  const [isNameFocused, setIsNameFocused] = React.useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = React.useState(false);

  const { data: customers = [] } = useGetList("customers", {
    pagination: { page: 1, perPage: 1000 },
    sort: { field: "full_name", order: "ASC" },
  });
  const { data: invoices = [] } = useGetList("invoices", {
    pagination: { page: 1, perPage: 1000 },
  });

  // Calculate tier metrics for a customer
  const getCustomerMetrics = React.useCallback(
    (cust: any) => {
      const manualCount = Number(cust?.manual_orders_count || 0);
      const cleanPhone = cust?.phone?.replace(/\D/g, "") || "";

      const matchedInvoices = invoices.filter((inv: any) => {
        const invPhone = inv.customer_phone?.replace(/\D/g, "") || "";
        const isPaid = inv.payment_status === "paid";
        const isMatch =
          (cust?.id && Number(inv.customer_id) === Number(cust.id)) ||
          (cleanPhone.length >= 8 && invPhone && invPhone.endsWith(cleanPhone.slice(-8)));
        return isMatch && isPaid;
      });

      const totalOrders = matchedInvoices.length + manualCount;
      let tier: "new" | "regular" | "silver" | "gold" = "new";
      if (totalOrders >= 10) tier = "gold";
      else if (totalOrders >= 5) tier = "silver";
      else if (totalOrders >= 1) tier = "regular";

      return { totalOrders, tier };
    },
    [invoices]
  );

  // Filter customers by name query
  const nameMatches = React.useMemo(() => {
    const query = customerName.trim().toLowerCase();
    if (!query || query.length < 1) return [];
    return customers
      .filter((c: any) => {
        const nameMatch = c.full_name?.toLowerCase().includes(query);
        const phoneMatch = c.phone?.replace(/\D/g, "").includes(query);
        return nameMatch || phoneMatch;
      })
      .slice(0, 6);
  }, [customers, customerName]);

  // Filter customers by phone query
  const phoneMatches = React.useMemo(() => {
    const cleanQuery = customerPhone.replace(/\D/g, "");
    if (!cleanQuery || cleanQuery.length < 2) return [];
    return customers
      .filter((c: any) => {
        const cPhone = c.phone?.replace(/\D/g, "") || "";
        return cPhone.includes(cleanQuery) || c.full_name?.toLowerCase().includes(cleanQuery);
      })
      .slice(0, 6);
  }, [customers, customerPhone]);

  // Check currently matched customer from database
  const activeCustomer = React.useMemo(() => {
    if (customerId) {
      return customers.find((c: any) => c.id === customerId) || null;
    }
    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (cleanPhone.length >= 8) {
      return (
        customers.find((c: any) => {
          const cp = c.phone?.replace(/\D/g, "") || "";
          return cp.endsWith(cleanPhone.slice(-8));
        }) || null
      );
    }
    return null;
  }, [customerId, customerPhone, customers]);

  const handleSelectCustomer = (cust: any) => {
    setValue("customer_id", cust.id, { shouldValidate: true, shouldDirty: true });
    setValue("customer_name", cust.full_name, { shouldValidate: true, shouldDirty: true });
    setValue("customer_phone", cust.phone, { shouldValidate: true, shouldDirty: true });

    if (cust.address) {
      setValue("service_address", cust.address, { shouldValidate: true, shouldDirty: true });
    }

    setIsNameFocused(false);
    setIsPhoneFocused(false);

    const metrics = getCustomerMetrics(cust);
    const tierLabel =
      metrics.tier === "gold"
        ? "Gold VIP"
        : metrics.tier === "silver"
          ? "Silver VIP"
          : metrics.tier === "regular"
            ? "Regular"
            : "New";

    toast.success(
      isEn
        ? `Synced with customer '${cust.full_name}' (${tierLabel} • ${metrics.totalOrders}x orders)`
        : `Data pelanggan '${cust.full_name}' berhasil disinkronkan (${tierLabel} • ${metrics.totalOrders}x order)`
    );
  };

  const handleClearCustomer = () => {
    setValue("customer_id", null, { shouldValidate: true, shouldDirty: true });
    setValue("customer_name", "", { shouldValidate: true, shouldDirty: true });
    setValue("customer_phone", "", { shouldValidate: true, shouldDirty: true });
    setValue("service_address", "", { shouldValidate: true, shouldDirty: true });
    toast.info(isEn ? "Customer unlinked" : "Tautan pelanggan dilepas");
  };

  return (
    <div className="space-y-3 w-full overflow-visible">
      {/* Hidden input to ensure customer_id is registered in form */}
      <input type="hidden" {...register("customer_id")} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start relative overflow-visible">
        {/* Customer Name Input with Autocomplete Dropdown */}
        <div className="relative space-y-1.5 overflow-visible">
          <label className="text-xs font-medium text-foreground flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary" />
              <span>{isEn ? "Customer Name" : "Nama Pelanggan"}</span>
              <span className="text-destructive">*</span>
            </span>
            {activeCustomer && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {isEn ? "Linked" : "Terhubung"}
              </span>
            )}
          </label>

          <div className="relative">
            <input
              {...register("customer_name", {
                required: isEn ? "Customer name is required" : "Nama pelanggan wajib diisi",
              })}
              value={customerName}
              onChange={(e) => {
                setValue("customer_name", e.target.value, { shouldValidate: true, shouldDirty: true });
                if (customerId) setValue("customer_id", null);
              }}
              onFocus={() => setIsNameFocused(true)}
              onBlur={() => setTimeout(() => setIsNameFocused(false), 200)}
              placeholder={isEn ? "Search or enter customer name..." : "Cari atau ketik nama pelanggan..."}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Name Suggestions Dropdown */}
          {isNameFocused && customerName.trim().length >= 1 && (
            <div
              className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-popover/98 backdrop-blur-md text-popover-foreground border border-border shadow-2xl rounded-xl p-1.5 max-h-64 overflow-y-auto space-y-1 animate-in fade-in-50 zoom-in-95 duration-100"
              onMouseDown={(e) => e.preventDefault()}
            >
              <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between border-b border-border/40 pb-1">
                <span>{isEn ? "Matching Customers" : "Pelanggan di Database"}</span>
                <span className="text-[9px] font-normal">{nameMatches.length} ditemukan</span>
              </div>

              {nameMatches.length > 0 ? (
                nameMatches.map((cust: any) => {
                  const metrics = getCustomerMetrics(cust);
                  return (
                    <button
                      key={cust.id}
                      type="button"
                      onClick={() => handleSelectCustomer(cust)}
                      className="w-full text-left p-2 rounded-lg hover:bg-muted/80 focus:bg-muted flex items-start justify-between gap-2 transition-colors cursor-pointer"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                          <span>{cust.full_name}</span>
                          {metrics.tier === "gold" && (
                            <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 gap-0.5">
                              <Crown className="w-2.5 h-2.5" /> Gold
                            </Badge>
                          )}
                          {metrics.tier === "silver" && (
                            <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-purple-500/15 text-purple-600 dark:text-purple-400 gap-0.5">
                              <Medal className="w-2.5 h-2.5" /> Silver
                            </Badge>
                          )}
                          {metrics.tier === "regular" && (
                            <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-blue-500/15 text-blue-600 dark:text-blue-400 gap-0.5">
                              <ShoppingBag className="w-2.5 h-2.5" /> {metrics.totalOrders}x
                            </Badge>
                          )}
                          {metrics.tier === "new" && (
                            <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" /> Baru
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                          <span className="font-mono">{cust.phone}</span>
                          {cust.city_area && <span>• {cust.city_area}</span>}
                        </div>
                        {cust.address && (
                          <div className="text-[10px] text-muted-foreground/80 truncate max-w-[280px]">
                            {cust.address}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 text-[10px] text-primary font-medium mt-1">
                        {isEn ? "Select" : "Pilih"} ↵
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-2.5 text-center text-xs text-muted-foreground space-y-1">
                  <div className="font-medium text-foreground">
                    {isEn ? `No existing customer '${customerName}'` : `Belum ada pelanggan '${customerName}'`}
                  </div>
                  <div className="text-[11px]">
                    {isEn
                      ? "💡 Will be automatically registered as a new customer."
                      : "💡 Akan otomatis didaftarkan sebagai pelanggan baru."}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Customer Phone Input with Autocomplete Dropdown */}
        <div className="relative space-y-1.5 overflow-visible">
          <label className="text-xs font-medium text-foreground flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-primary" />
              <span>{isEn ? "WhatsApp / Phone" : "No. WhatsApp / HP"}</span>
              <span className="text-destructive">*</span>
            </span>
          </label>

          <div className="relative">
            <input
              {...register("customer_phone", {
                required: isEn ? "Phone number is required" : "Nomor WhatsApp wajib diisi",
              })}
              value={customerPhone}
              onChange={(e) => {
                setValue("customer_phone", e.target.value, { shouldValidate: true, shouldDirty: true });
                if (customerId) setValue("customer_id", null);
              }}
              onFocus={() => setIsPhoneFocused(true)}
              onBlur={() => setTimeout(() => setIsPhoneFocused(false), 200)}
              placeholder="0812-3456-7890"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono"
            />
          </div>

          {/* Phone Suggestions Dropdown */}
          {isPhoneFocused && customerPhone.replace(/\D/g, "").length >= 2 && (
            <div
              className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-popover/98 backdrop-blur-md text-popover-foreground border border-border shadow-2xl rounded-xl p-1.5 max-h-64 overflow-y-auto space-y-1 animate-in fade-in-50 zoom-in-95 duration-100"
              onMouseDown={(e) => e.preventDefault()}
            >
              <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between border-b border-border/40 pb-1">
                <span>{isEn ? "Matching Phone Numbers" : "Nomor WhatsApp Terdaftar"}</span>
                <span className="text-[9px] font-normal">{phoneMatches.length} ditemukan</span>
              </div>

              {phoneMatches.length > 0 ? (
                phoneMatches.map((cust: any) => {
                  const metrics = getCustomerMetrics(cust);
                  return (
                    <button
                      key={cust.id}
                      type="button"
                      onClick={() => handleSelectCustomer(cust)}
                      className="w-full text-left p-2 rounded-lg hover:bg-muted/80 focus:bg-muted flex items-start justify-between gap-2 transition-colors cursor-pointer"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="font-semibold text-xs text-foreground font-mono">
                          {cust.phone}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <span className="font-medium text-foreground">{cust.full_name}</span>
                          {cust.city_area && <span>• {cust.city_area}</span>}
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[9px] h-4 px-1.5 shrink-0 self-center">
                        {metrics.tier === "gold"
                          ? "Gold VIP"
                          : metrics.tier === "silver"
                            ? "Silver VIP"
                            : metrics.tier === "regular"
                              ? `Regular (${metrics.totalOrders}x)`
                              : "Baru"}
                      </Badge>
                    </button>
                  );
                })
              ) : (
                <div className="p-2.5 text-center text-xs text-muted-foreground space-y-1">
                  <div className="font-medium text-foreground">
                    {isEn ? "No customer with this phone number" : "Belum ada pelanggan dengan nomor ini"}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Linked Customer Active Status Banner */}
      {activeCustomer && (
        <div className="bg-muted/40 dark:bg-muted/20 border border-border/80 rounded-xl p-2.5 flex items-center justify-between gap-2.5 transition-all">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs truncate">
              <span className="font-semibold text-foreground">{activeCustomer.full_name}</span>{" "}
              <span className="text-muted-foreground font-mono">({activeCustomer.phone})</span>
              {activeCustomer.city_area && (
                <span className="text-muted-foreground"> • {activeCustomer.city_area}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="secondary" className="text-[10px] font-medium h-5 px-2 gap-1">
              {(() => {
                const metrics = getCustomerMetrics(activeCustomer);
                return metrics.tier === "gold" ? (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <Crown className="w-3 h-3" /> Gold VIP ({metrics.totalOrders}x)
                  </span>
                ) : metrics.tier === "silver" ? (
                  <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                    <Medal className="w-3 h-3" /> Silver VIP ({metrics.totalOrders}x)
                  </span>
                ) : metrics.tier === "regular" ? (
                  <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                    <ShoppingBag className="w-3 h-3" /> Regular ({metrics.totalOrders}x)
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="w-3 h-3" /> {isEn ? "New Customer" : "Pelanggan Baru"}
                  </span>
                );
              })()}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClearCustomer}
              className="h-6 w-6 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
              title={isEn ? "Unlink customer" : "Lepas tautan pelanggan"}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
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
    <div className="space-y-5 max-w-4xl overflow-visible">
      {/* Auto-sync price hook */}
      <BookingPriceSynchronizer />

      {/* 1. Card: Customer Information & Schedule */}
      <Card className="border border-border/70 shadow-none bg-card overflow-visible">
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
        <CardContent className="pt-4 space-y-4 overflow-visible">
          {mode === "create" ? (
            <CustomerAutoSuggestField />
          ) : (
            <ReferenceInput source="customer_id" reference="customers">
              <SelectInput
                optionText="full_name"
                label={isEn ? "Customer" : "Pelanggan Terdaftar"}
                validate={required(isEn ? "Customer is required" : "Pelanggan wajib dipilih")}
                required
              />
            </ReferenceInput>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-2 border-t border-border/40">
            <DatePickerInput
              source="booking_date"
              label={isEn ? "Booking Date" : "Tanggal Reservasi"}
              defaultValue={mode === "create" ? new Date().toISOString().split("T")[0] : undefined}
              validate={required(isEn ? "Date is required" : "Tanggal wajib dipilih")}
              required
            />
            <TimePickerInput
              source="booking_time"
              label={isEn ? "Booking Time" : "Jam Pelayanan"}
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
                label={isEn ? "Massage Treatment" : "Pilih Menu Layanan"}
                validate={required(isEn ? "Service is required" : "Layanan wajib dipilih")}
                required
              />
            </ReferenceInput>
            <ReferenceInput source="therapist_id" reference="therapists">
              <SelectInput
                optionText={therapistOptionText}
                label={isEn ? "Assigned Therapist" : "Terapis yang Bertugas"}
                validate={required(isEn ? "Therapist is required" : "Terapis wajib dipilih")}
                required
              />
            </ReferenceInput>
          </div>

          <div className="pt-2 border-t border-border/40">
            <NumberInput
              source="total_price"
              label={isEn ? "Total Price (IDR)" : "Total Biaya Layanan (IDR)"}
              min={0}
              step={1}
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
            label={isEn ? "Service Destination Address" : "Alamat Lengkap Lokasi Layanan"}
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
              choices={BOOKING_STATUS_CHOICES}
            />
            <SelectInput
              source="payment_method"
              label={isEn ? "Payment Method" : "Metode Pembayaran"}
              defaultValue="qris"
              choices={PAYMENT_METHODS}
            />
            <SelectInput
              source="payment_status"
              label={isEn ? "Payment Status" : "Status Pembayaran"}
              defaultValue="unpaid"
              choices={PAYMENT_STATUS_CHOICES}
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

import { calculateBookingFinancials } from "@/lib/financial-calculator";
import { ReceiptText, ExternalLink, ArrowRight } from "lucide-react";
import { LinkBase } from "ra-core";

const BookingShowContent = () => {
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

  const { data: customer } = useGetOne(
    "customers",
    { id: record?.customer_id },
    { enabled: !!record?.customer_id }
  );

  const { data: invoices = [] } = useGetList("invoices", {
    pagination: { page: 1, perPage: 100 },
  });

  const { data: promotions = [] } = useGetList("promotions", {
    pagination: { page: 1, perPage: 100 },
  });

  if (!record) return null;

  const matchedInvoice = invoices.find(
    (inv: any) => Number(inv.booking_id) === Number(record.id)
  );

  const fin = calculateBookingFinancials({
    bookingPrice: Number(record.total_price || service?.price || 0),
    servicePrice: Number(service?.price || 0),
    consumablesCost: Number(service?.consumables_cost || 0),
    commissionRate: Number(therapist?.commission_rate || 60),
    invoice: matchedInvoice,
    promotions,
  });

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
                    ({record.booking_date} • {record.booking_time || "10:00"})
                  </span>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  {service?.name || "Treatment"} • {therapist?.name || "Therapist"}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <BadgeField source="status" />
              <BadgeField source="payment_status" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          {/* Customer */}
          <div className="space-y-1">
            <span className="text-muted-foreground block text-[11px] font-medium flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-primary" />
              {isEn ? "Customer Details" : "Data Pelanggan"}
            </span>
            <span className="font-semibold text-foreground text-sm block">
              {customer?.full_name || `Pelanggan #${record.customer_id}`}
            </span>
            {customer?.phone && (
              <span className="text-muted-foreground block">
                {customer.phone}
              </span>
            )}
          </div>

          {/* Service & Duration */}
          <div className="space-y-1">
            <span className="text-muted-foreground block text-[11px] font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              {isEn ? "Treatment Service" : "Layanan Treatment"}
            </span>
            <span className="font-semibold text-foreground text-sm block">
              {service?.name || "-"}
            </span>
            <span className="text-muted-foreground block">
              {service?.duration_minutes || 60} {isEn ? "Mins" : "Menit"} • {formatIDR(service?.price || record.total_price)}
            </span>
          </div>

          {/* Therapist */}
          <div className="space-y-1">
            <span className="text-muted-foreground block text-[11px] font-medium flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-primary" />
              {isEn ? "Assigned Therapist" : "Terapis Bertugas"}
            </span>
            <span className="font-semibold text-foreground text-sm block">
              {therapist?.name || "-"}
            </span>
            <span className="text-amber-700 dark:text-amber-400 font-medium block">
              {isEn ? "Commission Rate:" : "Skema Komisi:"} {fin.commissionRate}%
            </span>
          </div>

          {/* Address */}
          <div className="sm:col-span-2 md:col-span-3 pt-2 border-t border-border/40 space-y-1">
            <span className="text-muted-foreground block text-[11px] font-medium flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              {isEn ? "Home Service Location / Address" : "Alamat Layanan Home Service"}
            </span>
            <span className="font-medium text-foreground block">
              {record.service_address || customer?.address || "-"}
            </span>
          </div>

          {/* Notes */}
          {record.special_requests && (
            <div className="sm:col-span-2 md:col-span-3 pt-2 border-t border-border/40 space-y-1">
              <span className="text-muted-foreground block text-[11px] font-medium flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-primary" />
                {isEn ? "Special Requests & Notes" : "Catatan Khusus Pelanggan"}
              </span>
              <p className="text-muted-foreground leading-relaxed">
                {record.special_requests}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Secondary Card: Financial Breakdown & Final Invoicing */}
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
                      ? "Final Financial Breakdown & Invoicing"
                      : "Rincian Keuangan & Faktur Final (Setelah Invoice)"
                    : isEn
                      ? "Estimated Financial Breakdown (Pre-Invoice)"
                      : "Estimasi Keuangan & Laba (Sebelum Invoice)"}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {fin.hasInvoice
                    ? isEn
                      ? "Values synchronized with issued official invoice."
                      : "Perhitungan nilai akhir telah disinkronkan dengan nota resmi."
                    : isEn
                      ? "Pre-invoice estimation. Generate official invoice to finalize discounts & fees."
                      : "Estimasi awal. Terbitkan nota kasir untuk menetapkan diskon dan biaya final."}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {fin.hasInvoice ? (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-8 text-xs gap-1.5 font-medium border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 cursor-pointer"
                >
                  <LinkBase to={`/invoices/${fin.invoiceId}/show`}>
                    <span>{fin.invoiceNumber}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </LinkBase>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-8 text-xs gap-1.5 font-medium text-primary hover:bg-primary/10 cursor-pointer"
                >
                  <LinkBase to="/invoices/create">
                    <ReceiptText className="w-3.5 h-3.5" />
                    <span>{isEn ? "Generate POS Invoice" : "Buat Nota / Kasir"}</span>
                    <ArrowRight className="w-3 h-3" />
                  </LinkBase>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Invoice Itemized Breakdown if available */}
          {fin.hasInvoice ? (
            <div className="p-3.5 rounded-xl bg-muted/25 border border-border/60 text-xs space-y-2">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>{isEn ? "Treatment Gross Price:" : "Harga Layanan Treatment:"}</span>
                <span className="font-semibold text-foreground">{formatIDR(fin.treatmentGrossPrice)}</span>
              </div>

              {fin.discountAmount > 0 && (
                <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>{isEn ? "Promo Discount:" : "Potongan Diskon Promo:"}</span>
                    {fin.appliedPromoName && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 font-semibold">
                        {fin.appliedPromoName}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      ({fin.isPostDiscountPolicy
                        ? isEn
                          ? "Post-Discount Policy: Commission base adjusted"
                          : "Kebijakan Net: Dasar komisi terapis disesuaikan"
                        : isEn
                          ? "Pre-Discount Policy: Standard gross commission"
                          : "Kebijakan Gross: Komisi dihitung dari harga normal"})
                    </span>
                  </div>
                  <span className="font-bold">-{formatIDR(fin.discountAmount)}</span>
                </div>
              )}

              {fin.transportFee > 0 && (
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>{isEn ? "Transport / Travel Surcharge:" : "Biaya Transport / Lokasi:"}</span>
                  <span className="font-semibold text-foreground">+{formatIDR(fin.transportFee)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-border/50 flex justify-between items-center font-bold text-foreground">
                <span className="text-xs">{isEn ? "Total Paid by Customer (Net):" : "Total Pembayaran Pelanggan (Lunas):"}</span>
                <span className="text-primary text-sm font-bold">{formatIDR(fin.finalCustomerTotal)}</span>
              </div>
            </div>
          ) : null}

          {/* 3 Metric Cards for Profit & Commission */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-background border border-border/60 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-[11px] font-medium">{isEn ? "Therapist Fee:" : "Hak Terapis:"}</span>
                <span className="text-[10px] text-muted-foreground">
                  {fin.isPostDiscountPolicy ? "Net Base" : "Gross Base"}
                </span>
              </div>
              <span className="font-bold text-foreground text-base block">
                {formatIDR(fin.therapistFee)}
              </span>
              <span className="text-[10px] text-muted-foreground block">
                {fin.commissionRate}% × {formatIDR(fin.commissionBase)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-background border border-border/60 space-y-1">
              <span className="text-muted-foreground block text-[11px] font-medium">{isEn ? "Consumables (HPP):" : "Biaya Bahan (HPP):"}</span>
              <span className="font-bold text-amber-700 dark:text-amber-400 text-base block">
                {formatIDR(fin.consumablesCost)}
              </span>
              <span className="text-[10px] text-muted-foreground block">
                {isEn ? "Standard Service COGS" : "Bahan habis pakai per layanan"}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
              <span className="text-emerald-700 dark:text-emerald-400 block text-[11px] font-semibold">{isEn ? "Net Serena Raga:" : "Laba Bersih Serena Raga:"}</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 text-base block">
                {formatIDR(fin.netSerenaRaga)}
              </span>
              <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 block">
                {isEn ? "Net Company Margin" : "Laba bersih setelah komisi & bahan"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
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
