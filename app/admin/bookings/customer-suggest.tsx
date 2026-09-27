"use client";

import * as React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useGetList, useLocaleState } from "ra-core";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User,
  Phone,
  CheckCircle2,
  Crown,
  Medal,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { standardizePhoneNumber } from "@/lib/brand-settings";

/**
 * Smart Customer Auto-Suggest & Auto-Fill Component
 * Utilizes Shadcn UI primitives for inputs, badges, and buttons.
 */
export const CustomerAutoSuggestField = () => {
  const { setValue, register } = useFormContext();
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  const customerName = useWatch({ name: "customer_name" }) || "";
  const customerPhone = useWatch({ name: "customer_phone" }) || "";
  const customerId = useWatch({ name: "customer_id" });

  const [isNameFocused, setIsNameFocused] = React.useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = React.useState(false);

  const { data: customers = [] } = useGetList("customers", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "full_name", order: "ASC" },
  });
  const { data: invoices = [] } = useGetList("invoices", {
    filter: { payment_status: "paid" },
    pagination: { page: 1, perPage: 200 },
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
    const cleanQuery = customerPhone.replace(/\D/g, "").replace(/^(62|0)/, "");
    if (!cleanQuery || cleanQuery.length < 2) return [];
    return customers
      .filter((c: any) => {
        const cPhone = c.phone?.replace(/\D/g, "") || "";
        return cPhone.includes(cleanQuery) || c.full_name?.toLowerCase().includes(customerPhone.trim().toLowerCase());
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
    setValue("customer_phone", standardizePhoneNumber(cust.phone) || cust.phone, { shouldValidate: true, shouldDirty: true });

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
            <Input
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
              className="h-9 text-xs bg-background"
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
                          <span>{cust.phone}</span>
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
            <Input
              {...register("customer_phone", {
                required: isEn ? "Phone number is required" : "Nomor WhatsApp wajib diisi",
              })}
              value={customerPhone}
              onChange={(e) => {
                setValue("customer_phone", e.target.value, { shouldValidate: true, shouldDirty: true });
                if (customerId) setValue("customer_id", null);
              }}
              onFocus={() => setIsPhoneFocused(true)}
              onBlur={() => {
                if (customerPhone) {
                  const std = standardizePhoneNumber(customerPhone);
                  if (std && std !== customerPhone) {
                    setValue("customer_phone", std, { shouldValidate: true, shouldDirty: true });
                  }
                }
                setTimeout(() => setIsPhoneFocused(false), 200);
              }}
              placeholder="0812-3456-7890 / +628..."
              className="h-9 text-xs bg-background"
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
                        <div className="font-semibold text-xs text-foreground">
                          {standardizePhoneNumber(cust.phone) || cust.phone}
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
              <span className="text-muted-foreground">({activeCustomer.phone})</span>
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
