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
import { Edit } from "@/components/edit";
import { Create } from "@/components/create";
import { Show } from "@/components/show";
import { SimpleForm } from "@/components/simple-form";
import { TextInput } from "@/components/text-input";
import { NumberInput } from "@/components/number-input";
import { PhoneInput } from "@/components/phone-input";
import { RowActions } from "@/components/row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Clock,
  Send,
  MessageCircle,
  UserCheck,
  Receipt,
  Activity,
  HeartHandshake,
  FileText,
} from "lucide-react";
import { formatIDR, standardizePhoneNumber } from "@/lib/utils";
import {
  useBrandSettings,
  sendCrmWhatsAppReminder,
  sendCrmWhatsAppPromo,
  cleanWhatsAppNumber,
} from "@/lib/brand-settings";

export interface CustomerMetricsData {
  isPending: boolean;
  ordersCount: number;
  invoiceOrdersCount: number;
  manualOrdersCount: number;
  totalSpent: number;
  tier: "new" | "regular" | "silver" | "gold";
  lastOrderDate: string | null;
  daysSinceLastOrder: number | null;
  favoriteService: string;
  favoriteTherapist: string;
  favoriteServiceCount: number;
  favoriteTherapistCount: number;
  healthStatus: "new" | "active" | "dormant" | "lost";
  customerInvoices: any[];
}

/**
 * Hook to compute 360° customer CRM metrics from paid invoices & legacy offline count
 */
export const useCustomerMetrics = (
  customerId?: number | string,
  phone?: string,
  manualOrdersCount: number = 0
): CustomerMetricsData => {
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
        tier: "new",
        lastOrderDate: null,
        daysSinceLastOrder: null,
        favoriteService: "",
        favoriteTherapist: "",
        favoriteServiceCount: 0,
        favoriteTherapistCount: 0,
        healthStatus: manualCount > 0 ? "dormant" : "new",
        customerInvoices: [],
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
        daysSinceLastOrder: null,
        favoriteService: "",
        favoriteTherapist: "",
        favoriteServiceCount: 0,
        favoriteTherapistCount: 0,
        healthStatus: manualCount > 0 ? "dormant" : "new",
        customerInvoices: [],
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

    // Sort newest first
    matchedInvoices.sort(
      (a: any, b: any) =>
        new Date(b.created_at || b.booking_date || 0).getTime() -
        new Date(a.created_at || a.booking_date || 0).getTime()
    );

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

    const lastInvoice = matchedInvoices[0];
    const lastOrderDate = lastInvoice ? lastInvoice.created_at || lastInvoice.booking_date : null;

    let daysSinceLastOrder: number | null = null;
    if (lastOrderDate) {
      const diffMs = Date.now() - new Date(lastOrderDate).getTime();
      daysSinceLastOrder = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    }

    // Frequency analysis for Favorite Therapist & Favorite Service
    const serviceFreqMap: Record<string, number> = {};
    const therapistFreqMap: Record<string, number> = {};

    matchedInvoices.forEach((inv: any) => {
      // 1. Check top-level fields
      if (inv.service_name && typeof inv.service_name === "string") {
        inv.service_name
          .split("+")
          .map((s: string) => s.trim())
          .filter(Boolean)
          .forEach((s: string) => {
            serviceFreqMap[s] = (serviceFreqMap[s] || 0) + 1;
          });
      }
      if (inv.therapist_name && typeof inv.therapist_name === "string") {
        inv.therapist_name
          .split(/[,&]/)
          .map((t: string) => t.trim())
          .filter(Boolean)
          .forEach((t: string) => {
            therapistFreqMap[t] = (therapistFreqMap[t] || 0) + 1;
          });
      }

      // 2. Check line items if present
      if (Array.isArray(inv.items)) {
        inv.items.forEach((it: any) => {
          const sName = it.service_name || it.name;
          if (sName && typeof sName === "string") {
            const cleanSName = sName.replace(/\(Terapis.*?\)/gi, "").trim();
            if (cleanSName) {
              serviceFreqMap[cleanSName] = (serviceFreqMap[cleanSName] || 0) + 1;
            }
          }
          if (it.therapist_name && typeof it.therapist_name === "string") {
            therapistFreqMap[it.therapist_name] = (therapistFreqMap[it.therapist_name] || 0) + 1;
          }
        });
      }
    });

    let topService = "";
    let topServiceCount = 0;
    Object.entries(serviceFreqMap).forEach(([name, count]) => {
      if (count > topServiceCount) {
        topService = name;
        topServiceCount = count;
      }
    });

    let topTherapist = "";
    let topTherapistCount = 0;
    Object.entries(therapistFreqMap).forEach(([name, count]) => {
      if (count > topTherapistCount) {
        topTherapist = name;
        topTherapistCount = count;
      }
    });

    // Health / Retention Status calculation: active (<30d), dormant (30-60d), lost (>60d), new (0)
    let healthStatus: "new" | "active" | "dormant" | "lost" = "new";
    if (totalOrdersCount === 0) {
      healthStatus = "new";
    } else if (daysSinceLastOrder !== null) {
      if (daysSinceLastOrder <= 30) healthStatus = "active";
      else if (daysSinceLastOrder <= 60) healthStatus = "dormant";
      else healthStatus = "lost";
    } else {
      healthStatus = "dormant";
    }

    return {
      isPending: false,
      ordersCount: totalOrdersCount,
      invoiceOrdersCount,
      manualOrdersCount: manualCount,
      totalSpent,
      tier,
      lastOrderDate,
      daysSinceLastOrder,
      favoriteService: topService,
      favoriteTherapist: topTherapist,
      favoriteServiceCount: topServiceCount,
      favoriteTherapistCount: topTherapistCount,
      healthStatus,
      customerInvoices: matchedInvoices,
    };
  }, [invoices, customerId, cleanPhone, manualOrdersCount, isMetricsLoading]);
};

/**
 * Customer Tier Badge - Minimalist Luxury with Lucide Status Icons
 */
const CustomerTierBadge = () => {
  const record = useRecordContext();
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const metrics = useCustomerMetrics(record?.id, record?.phone, record?.manual_orders_count);
  if (!record) return null;

  if (metrics.isPending) {
    return <Skeleton className="h-5 w-20 inline-block bg-muted/60" />;
  }

  if (metrics.tier === "gold") {
    return (
      <Badge
        variant="secondary"
        className="bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium text-[11px] gap-1 px-2 py-0.5 border-none shadow-none"
      >
        <Crown className="w-3 h-3 text-amber-500 shrink-0" />
        <span>Gold VIP</span>
      </Badge>
    );
  }
  if (metrics.tier === "silver") {
    return (
      <Badge
        variant="secondary"
        className="bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium text-[11px] gap-1 px-2 py-0.5 border-none shadow-none"
      >
        <Medal className="w-3 h-3 text-purple-500 shrink-0" />
        <span>Silver VIP</span>
      </Badge>
    );
  }
  if (metrics.tier === "regular") {
    return (
      <Badge
        variant="secondary"
        className="bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium text-[11px] gap-1 px-2 py-0.5 border-none shadow-none"
      >
        <ShoppingBag className="w-3 h-3 text-blue-500 shrink-0" />
        <span>{isEn ? "Regular" : "Reguler"}</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className="bg-muted/60 text-muted-foreground font-normal text-[11px] gap-1 px-2 py-0.5 border-none shadow-none"
    >
      <Sparkles className="w-3 h-3 text-emerald-500 shrink-0" />
      <span>{isEn ? "New" : "Baru"}</span>
    </Badge>
  );
};

/**
 * Customer Retention Status Badge - Bilingual: Aktif / Dormant / Lost / Baru
 */
const CustomerHealthBadge = () => {
  const record = useRecordContext();
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const metrics = useCustomerMetrics(record?.id, record?.phone, record?.manual_orders_count);
  if (!record) return null;

  if (metrics.isPending) {
    return <Skeleton className="h-5 w-24 inline-block bg-muted/60" />;
  }

  if (metrics.healthStatus === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>{isEn ? "Active" : "Aktif"}</span>
        {metrics.daysSinceLastOrder !== null && (
          <span className="text-[10px] text-muted-foreground">({metrics.daysSinceLastOrder}{isEn ? "d" : "h"})</span>
        )}
      </span>
    );
  }

  if (metrics.healthStatus === "dormant") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        <span>Dormant</span>
        {metrics.daysSinceLastOrder !== null && (
          <span className="text-[10px] text-muted-foreground">({metrics.daysSinceLastOrder}{isEn ? "d" : "h"})</span>
        )}
      </span>
    );
  }

  if (metrics.healthStatus === "lost") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        <span>Lost</span>
        {metrics.daysSinceLastOrder !== null && (
          <span className="text-[10px] text-muted-foreground">({metrics.daysSinceLastOrder}{isEn ? "d" : "h"})</span>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-normal">
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
      <span>{isEn ? "New" : "Baru"}</span>
    </span>
  );
};

/**
 * Customer Favorite Service & Therapist Cell
 */
const CustomerFavoritesCell = () => {
  const record = useRecordContext();
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const metrics = useCustomerMetrics(record?.id, record?.phone, record?.manual_orders_count);
  if (!record) return null;

  if (metrics.isPending) {
    return (
      <div className="space-y-1">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-2.5 w-20" />
      </div>
    );
  }

  if (!metrics.favoriteService && !metrics.favoriteTherapist) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  return (
    <div className="space-y-1 max-w-[210px]">
      {metrics.favoriteService && (
        <div className="text-xs font-medium text-foreground truncate flex items-center gap-1.5" title={metrics.favoriteService}>
          <Sparkles className="w-3 h-3 text-primary shrink-0" />
          <span className="truncate">{metrics.favoriteService}</span>
        </div>
      )}
      {metrics.favoriteTherapist && (
        <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5" title={metrics.favoriteTherapist}>
          <UserCheck className="w-3 h-3 text-blue-500 shrink-0" />
          <span className="truncate">{metrics.favoriteTherapist}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Customer Spend Metric Cell - Matching Serena Raga luxury typography
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
        {metrics.ordersCount} {isEn ? "orders" : "order lunas"}
      </span>
    </div>
  );
};

const CustomerPhoneCell = () => {
  const record = useRecordContext();
  if (!record?.phone) return <span className="text-muted-foreground">-</span>;
  const std = standardizePhoneNumber(record.phone) || record.phone;
  return <span className="text-xs font-mono">{std}</span>;
};

/**
 * 1-Click WhatsApp CRM Quick Action in List Rows
 */
const CustomerQuickCrmAction = () => {
  const record = useRecordContext();
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const { settings: brandSettings } = useBrandSettings();
  const metrics = useCustomerMetrics(record?.id, record?.phone, record?.manual_orders_count);
  const { data: promotions = [] } = useGetList("promotions", {
    pagination: { page: 1, perPage: 100 },
  });

  if (!record?.phone) return null;

  // Find dynamic winback or loyalty promo from active promotions
  const winbackPromo = React.useMemo(() => {
    return promotions.find(
      (p: any) =>
        p.is_active !== false &&
        (p.scope === "dormant_winback" || p.code === "WELCOMEBACK")
    );
  }, [promotions]);

  const vipPromo = React.useMemo(() => {
    return promotions.find(
      (p: any) =>
        p.is_active !== false &&
        (p.scope === "loyalty_milestone" || p.code === "LOYAL10" || p.code === "RELAXVIP")
    );
  }, [promotions]);

  const handleSendReminder = (e: React.MouseEvent) => {
    e.stopPropagation();
    const code = winbackPromo?.code || "WELCOMEBACK";
    const val = winbackPromo
      ? winbackPromo.type === "percentage"
        ? `${winbackPromo.value}%`
        : formatIDR(winbackPromo.value)
      : "10%";

    sendCrmWhatsAppReminder({
      customer: record,
      metrics,
      promoCode: code,
      discountValue: val,
      brandSettings,
      isEn,
    });
  };

  const handleSendPromo = (e: React.MouseEvent) => {
    e.stopPropagation();
    const code = vipPromo?.code || (metrics.tier === "gold" ? "GOLDVIP15" : "RELAXVIP");
    const val = vipPromo
      ? vipPromo.type === "percentage"
        ? `${vipPromo.value}% OFF`
        : formatIDR(vipPromo.value)
      : "10% OFF";

    sendCrmWhatsAppPromo({
      customer: record,
      promoCode: code,
      discountValue: val,
      brandSettings,
      isEn,
    });
  };

  const handleDirectChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    const clean = cleanWhatsAppNumber(record.phone);
    window.open(`https://wa.me/${clean}`, "_blank");
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <div onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-500/10 gap-1 border-none shadow-none"
              />
            }
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Follow-Up</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handleSendReminder} className="text-xs gap-2 cursor-pointer">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>{isEn ? "Send Routine Reminder" : "Kirim Reminder Relaksasi"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSendPromo} className="text-xs gap-2 cursor-pointer">
              <TicketPercent className="w-3.5 h-3.5 text-amber-500" />
              <span>{isEn ? "Send VIP Promo Offer" : "Kirim Penawaran Promo"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDirectChat} className="text-xs gap-2 cursor-pointer">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isEn ? "Open WhatsApp Chat" : "Buka Chat WhatsApp"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <RowActions />
    </div>
  );
};

/**
 * Top CRM Summary Cards on Customer List
 */
const CustomerSummaryCards = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const { data: customers = [], isPending: loadingCust } = useGetList("customers", {
    pagination: { page: 1, perPage: 1000 },
  });
  const { data: invoices = [], isPending: loadingInv } = useGetList("invoices", {
    pagination: { page: 1, perPage: 1000 },
  });

  const stats = React.useMemo(() => {
    if (loadingCust || loadingInv) {
      return { total: 0, active: 0, vip: 0, dormant: 0 };
    }

    const paidInvoices = invoices.filter((i: any) => i.payment_status === "paid");
    let activeCount = 0;
    let vipCount = 0;
    let dormantCount = 0;

    customers.forEach((c: any) => {
      const cleanPhone = c.phone?.replace(/\D/g, "") || "";
      const matched = paidInvoices.filter((inv: any) => {
        const invPhone = inv.customer_phone?.replace(/\D/g, "") || "";
        return (
          (c.id && Number(inv.customer_id) === Number(c.id)) ||
          (cleanPhone.length >= 8 && invPhone && invPhone.endsWith(cleanPhone.slice(-8)))
        );
      });

      const totalOrders = matched.length + (Number(c.manual_orders_count) || 0);
      if (totalOrders >= 5) vipCount++;

      if (matched.length > 0) {
        matched.sort(
          (a: any, b: any) =>
            new Date(b.created_at || b.booking_date || 0).getTime() -
            new Date(a.created_at || a.booking_date || 0).getTime()
        );
        const lastDate = matched[0].created_at || matched[0].booking_date;
        const diffDays = Math.floor((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 30) {
          activeCount++;
        } else {
          dormantCount++;
        }
      } else if (totalOrders > 0) {
        dormantCount++;
      }
    });

    return {
      total: customers.length,
      active: activeCount,
      vip: vipCount,
      dormant: dormantCount,
    };
  }, [customers, invoices, loadingCust, loadingInv]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
      <Card className="border border-border/70 shadow-none bg-card">
        <CardContent className="p-2 sm:p-2.5 flex items-center justify-between gap-1.5">
          <div className="min-w-0">
            <span className="text-[10px] text-muted-foreground block font-medium truncate leading-tight">
              {isEn ? "Total Customers" : "Total Pelanggan"}
            </span>
            <span className="text-sm sm:text-base font-bold text-foreground tracking-tight leading-none mt-0.5 block">{stats.total}</span>
          </div>
          <div className="p-1 sm:p-1.5 rounded-md bg-muted text-muted-foreground shrink-0">
            <User className="w-3.5 h-3.5" />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/70 shadow-none bg-card">
        <CardContent className="p-2 sm:p-2.5 flex items-center justify-between gap-1.5">
          <div className="min-w-0">
            <span className="text-[10px] text-muted-foreground block font-medium truncate leading-tight">
              {isEn ? "Active (<30 Days)" : "Pelanggan Aktif"}
            </span>
            <span className="text-sm sm:text-base font-bold text-foreground tracking-tight leading-none mt-0.5 block">
              {stats.active}
            </span>
          </div>
          <div className="p-1 sm:p-1.5 rounded-md bg-muted text-muted-foreground shrink-0">
            <UserCheck className="w-3.5 h-3.5" />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/70 shadow-none bg-card">
        <CardContent className="p-2 sm:p-2.5 flex items-center justify-between gap-1.5">
          <div className="min-w-0">
            <span className="text-[10px] text-muted-foreground block font-medium truncate leading-tight">
              {isEn ? "VIP Members" : "Member VIP"}
            </span>
            <span className="text-sm sm:text-base font-bold text-foreground tracking-tight leading-none mt-0.5 block">
              {stats.vip}
            </span>
          </div>
          <div className="p-1 sm:p-1.5 rounded-md bg-muted text-muted-foreground shrink-0">
            <Crown className="w-3.5 h-3.5" />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/70 shadow-none bg-card">
        <CardContent className="p-2 sm:p-2.5 flex items-center justify-between gap-1.5">
          <div className="min-w-0">
            <span className="text-[10px] text-muted-foreground block font-medium truncate leading-tight">
              {isEn ? "Dormant" : "Dormant / Sapaan"}
            </span>
            <span className="text-sm sm:text-base font-bold text-foreground tracking-tight leading-none mt-0.5 block">
              {stats.dormant}
            </span>
          </div>
          <div className="p-1 sm:p-1.5 rounded-md bg-muted text-muted-foreground shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const CustomerList = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <List title={isEn ? "Customer CRM & Database" : "Database Pelanggan & CRM"}>
      <CustomerSummaryCards />
      <DataTable>
        <DataTableCol
          source="id"
          label="#"
          headerClassName="w-12"
          cellClassName="text-xs font-bold text-primary"
        />
        <DataTableCol
          source="full_name"
          label={isEn ? "Customer Name" : "Nama Pelanggan"}
        />
        <DataTableCol
          source="phone"
          label="WhatsApp"
        >
          <CustomerPhoneCell />
        </DataTableCol>
        <DataTableCol label={isEn ? "Favorite Service & Therapist" : "Layanan & Terapis Favorit"}>
          <CustomerFavoritesCell />
        </DataTableCol>
        <DataTableCol
          source="tier"
          label={isEn ? "Tier" : "Level CRM"}
        >
          <CustomerTierBadge />
        </DataTableCol>
        <DataTableCol
          source="retention_status"
          label={isEn ? "Status" : "Status Retensi"}
        >
          <CustomerHealthBadge />
        </DataTableCol>
        <DataTableCol
          source="total_spent"
          label={isEn ? "Lifetime Value (LTV)" : "Total Belanja (LTV)"}
        >
          <CustomerSpendCell />
        </DataTableCol>
        <DataTableCol
          source="address"
          label={isEn ? "Address" : "Alamat"}
          cellClassName="truncate max-w-[220px] text-xs text-muted-foreground"
        />
        <DataTableCol
          label="ra.action.name"
          headerClassName="text-right w-36"
          cellClassName="text-right"
        >
          <CustomerQuickCrmAction />
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
                  : "Masukkan nama lengkap, nomor WhatsApp aktif untuk invoice digital & reminder CRM, serta alamat email opsional."}
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

      {/* 3. Card: CRM Loyalty History & General Preferences */}
      <Card className="border border-border/70 shadow-none bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                {isEn ? "CRM History & Preferences" : "Riwayat Loyalitas CRM & Preferensi"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {isEn
                  ? "Synchronize legacy offline orders and record general massage notes."
                  : "Sinkronkan riwayat order offline pelanggan lama serta catatan preferensi pijat umum."}
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
            label={isEn ? "Customer Notes & Preferences" : "Catatan Preferensi Pelanggan"}
            multiline
            rows={2}
            placeholder={
              isEn
                ? "e.g. Prefers medium pressure, focus on shoulder/back..."
                : "Contoh: Prefer terapis wanita, fokus pundak kaku..."
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
  const { settings: brandSettings } = useBrandSettings();
  const metrics = useCustomerMetrics(record?.id, record?.phone, record?.manual_orders_count);
  const { data: promotions = [] } = useGetList("promotions", {
    pagination: { page: 1, perPage: 100 },
  });

  if (!record) return null;

  // Compute eligible promotions for this customer
  const eligiblePromos = promotions.filter((p: any) => {
    if (p.is_active === false) return false;
    if (p.scope === "first_order") return metrics.ordersCount === 0;
    if (p.scope === "dormant_winback") {
      return (
        metrics.healthStatus === "dormant" ||
        metrics.healthStatus === "lost" ||
        (metrics.daysSinceLastOrder !== null && metrics.daysSinceLastOrder >= 30)
      );
    }
    if (p.scope === "loyalty_milestone") return metrics.ordersCount >= Number(p.min_orders_count || 10);
    if (p.scope === "all") return true;
    return false;
  });

  const handleSendReminder = () => {
    const winbackPromo = promotions.find(
      (p: any) =>
        p.is_active !== false &&
        (p.scope === "dormant_winback" || p.code === "WELCOMEBACK")
    );
    const code = winbackPromo?.code || "WELCOMEBACK";
    const val = winbackPromo
      ? winbackPromo.type === "percentage"
        ? `${winbackPromo.value}%`
        : formatIDR(winbackPromo.value)
      : "10%";

    sendCrmWhatsAppReminder({
      customer: record,
      metrics,
      promoCode: code,
      discountValue: val,
      brandSettings,
      isEn,
    });
  };

  const handleSendPromo = (promo?: any) => {
    const code = promo?.code || (metrics.tier === "gold" ? "GOLDVIP15" : "RELAX10");
    const val = promo?.type === "percentage" ? `${promo.value}% OFF` : promo?.value ? formatIDR(promo.value) : "10% OFF";
    sendCrmWhatsAppPromo({
      customer: record,
      promoCode: code,
      discountValue: val,
      brandSettings,
      isEn,
    });
  };

  const handleDirectChat = () => {
    const clean = cleanWhatsAppNumber(record.phone);
    window.open(`https://wa.me/${clean}`, "_blank");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 1. Customer Overview & Action Bar Card */}
      <Card className="border border-border/70 shadow-none bg-card">
        <CardHeader className="pb-4 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10 text-primary border border-primary/20">
                <User className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-bold text-foreground">
                    <TextField source="full_name" />
                  </CardTitle>
                  <CustomerTierBadge />
                </div>
                <CardDescription className="text-xs text-muted-foreground flex flex-wrap items-center gap-2 mt-1">
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{record.phone}</span>
                  </span>
                  {record.email && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        <span>{record.email}</span>
                      </span>
                    </>
                  )}
                  {record.city_area && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{record.city_area}</span>
                      </span>
                    </>
                  )}
                </CardDescription>
              </div>
            </div>

            {/* Quick 1-Click WhatsApp CRM Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendReminder}
                className="text-xs gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-medium"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{isEn ? "Send Routine Reminder" : "Kirim Reminder Relaksasi"}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSendPromo()}
                className="text-xs gap-1.5 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-medium"
              >
                <TicketPercent className="w-3.5 h-3.5" />
                <span>{isEn ? "Send VIP Promo" : "Kirim Promo VIP"}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDirectChat}
                className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Chat WA</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* 360° Financial & Retention Metrics */}
        <CardContent className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 bg-muted/20 border border-border/50 rounded-xl">
            <span className="text-[11px] text-muted-foreground block font-medium">
              {isEn ? "Total Completed Orders" : "Total Order Lunas"}
            </span>
            <span className="text-xl font-bold text-foreground">{metrics.ordersCount}x</span>
            {metrics.manualOrdersCount > 0 && (
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                ({metrics.invoiceOrdersCount} online + {metrics.manualOrdersCount} offline)
              </span>
            )}
          </div>
          <div className="p-3 bg-muted/20 border border-border/50 rounded-xl">
            <span className="text-[11px] text-muted-foreground block font-medium">
              {isEn ? "Lifetime Value (LTV)" : "Total Belanja (LTV)"}
            </span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {formatIDR(metrics.totalSpent)}
            </span>
          </div>
          <div className="p-3 bg-muted/20 border border-border/50 rounded-xl">
            <span className="text-[11px] text-muted-foreground block font-medium">
              {isEn ? "Avg. Order Value" : "Rata-rata Order"}
            </span>
            <span className="text-sm font-semibold text-foreground">
              {formatIDR(metrics.invoiceOrdersCount > 0 ? Math.round(metrics.totalSpent / metrics.invoiceOrdersCount) : 0)}
            </span>
          </div>
          <div className="p-3 bg-muted/20 border border-border/50 rounded-xl">
            <span className="text-[11px] text-muted-foreground block font-medium">
              {isEn ? "Last Visit Date" : "Kunjungan Terakhir"}
            </span>
            <span className="text-xs font-semibold text-foreground block mt-0.5">
              {metrics.lastOrderDate
                ? new Date(metrics.lastOrderDate).toLocaleDateString(isEn ? "en-US" : "id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : isEn
                ? "None yet"
                : "Belum Ada"}
            </span>
            {metrics.daysSinceLastOrder !== null && (
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                {metrics.daysSinceLastOrder === 0
                  ? isEn
                    ? "Today"
                    : "Hari ini"
                  : isEn
                  ? `${metrics.daysSinceLastOrder} days ago`
                  : `${metrics.daysSinceLastOrder} hari yang lalu`}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. Customer Treatment DNA: Favorite Therapist & Favorite Service */}
      <Card className="border border-border/70 shadow-none bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                {isEn ? "Customer Treatment DNA & Preferences" : "Preferensi Layanan & Terapis Langganan"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {isEn
                  ? "Top frequent therapist and most requested massage service based on order history."
                  : "Terapis yang paling sering melayani dan jenis layanan yang paling sering dipesan oleh pelanggan ini."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-muted/20 border border-border/50 rounded-xl space-y-1.5">
            <span className="text-[11px] text-muted-foreground block font-medium flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>{isEn ? "Favorite Therapist" : "Terapis Langganan"}</span>
            </span>
            <div className="font-semibold text-sm text-foreground">
              {metrics.favoriteTherapist || (isEn ? "No frequent therapist yet" : "Belum ada terapis langganan")}
            </div>
            {metrics.favoriteTherapistCount > 0 && (
              <span className="text-[11px] text-muted-foreground block">
                {metrics.favoriteTherapistCount}x {isEn ? "servicing visits" : "melayani pelanggan ini"}
              </span>
            )}
          </div>

          <div className="p-3.5 bg-muted/20 border border-border/50 rounded-xl space-y-1.5">
            <span className="text-[11px] text-muted-foreground block font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>{isEn ? "Favorite Service" : "Layanan Paling Sering Dipesan"}</span>
            </span>
            <div className="font-semibold text-sm text-foreground">
              {metrics.favoriteService || (isEn ? "No order history yet" : "Belum ada riwayat layanan")}
            </div>
            {metrics.favoriteServiceCount > 0 && (
              <span className="text-[11px] text-muted-foreground block">
                {metrics.favoriteServiceCount}x {isEn ? "times booked" : "kali dipesan"}
              </span>
            )}
          </div>

          <div className="p-3.5 bg-muted/20 border border-border/50 rounded-xl space-y-1.5">
            <span className="text-[11px] text-muted-foreground block font-medium flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{isEn ? "CRM Health Status" : "Status Retensi CRM"}</span>
            </span>
            <div className="pt-0.5">
              <CustomerHealthBadge />
            </div>
            <span className="text-[11px] text-muted-foreground block">
              {metrics.healthStatus === "active"
                ? isEn
                  ? "Active: regular relaxation within 30 days"
                  : "Aktif: rutin relaksasi dalam 30 hari terakhir"
                : metrics.healthStatus === "dormant"
                ? isEn
                  ? "Dormant: 30-60 days since last visit (follow-up recommended)"
                  : "Dormant: 30-60 hari belum memesan (disarankan sapaan)"
                : metrics.healthStatus === "lost"
                ? isEn
                  ? "Lost: inactive for more than 60 days (win-back offer)"
                  : "Lost: tidak aktif lebih dari 60 hari (tawarkan voucher)"
                : isEn
                ? "New: customer has not completed any orders yet"
                : "Baru: pelanggan belum memiliki riwayat order"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 3. Eligible Promotions & Loyalty Benefits */}
      <Card className="border border-border/70 shadow-none bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <TicketPercent className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                {isEn ? "Eligible Promotions & VIP Vouchers" : "Promo & Diskon yang Berhak Didapatkan"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {isEn
                  ? "Active discounts applicable for this customer based on loyalty level."
                  : "Daftar diskon aktif yang otomatis dapat digunakan & dikirimkan sebagai voucher apresiasi."}
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
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="text-xs font-semibold text-foreground">{promo.name}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground block">
                      {isEn ? "Discount:" : "Potongan:"}{" "}
                      {promo.type === "percentage" ? `${promo.value}% OFF` : formatIDR(promo.value)}
                      {promo.code ? ` • ${isEn ? "Code:" : "Kode:"} ${promo.code}` : ""}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSendPromo(promo)}
                    className="h-7 px-2 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 gap-1 border border-emerald-500/30"
                  >
                    <Send className="w-3 h-3" />
                    <span>{isEn ? "Send" : "Kirim WA"}</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Customer Address & Notes */}
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
              {isEn ? "Full Service Address" : "Alamat Lengkap Kunjungan"}
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

      {/* 5. Invoices & Treatment History */}
      {metrics.customerInvoices.length > 0 && (
        <Card className="border border-border/70 shadow-none bg-card">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">
                  {isEn ? "Completed Orders & Invoices History" : "Riwayat Order & Invoice Lunas"}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {isEn
                    ? "List of transactions and treatments completed by this customer."
                    : "Daftar transaksi dan layanan yang telah selesai dibayarkan oleh pelanggan ini."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="divide-y divide-border/40 text-xs">
              {metrics.customerInvoices.map((inv: any) => (
                <div key={inv.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {inv.invoice_number || `INV-${inv.id}`}
                      </span>
                      <span className="text-muted-foreground font-normal">
                        {inv.created_at || inv.booking_date
                          ? new Date(inv.created_at || inv.booking_date).toLocaleDateString(
                              isEn ? "en-US" : "id-ID",
                              { day: "numeric", month: "short", year: "numeric" }
                            )
                          : "-"}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-primary shrink-0" />
                        <span>{inv.service_name || "Layanan Pijat"}</span>
                      </span>
                      {inv.therapist_name && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-blue-500 shrink-0" />
                            <span>{inv.therapist_name}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 block">
                      {formatIDR(inv.total_amount)}
                    </span>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 text-[10px] px-1.5 py-0 h-4">
                      {isEn ? "Paid" : "Lunas"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export const CustomerShow = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <Show title={isEn ? "Customer CRM Profile" : "Profil CRM Pelanggan"}>
      <CustomerShowContent />
    </Show>
  );
};
