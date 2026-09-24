"use client";

import * as React from "react";
import { useGetList, useLocaleState, useTranslate } from "ra-core";
import { motion, type Variants } from "motion/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SearchableCombobox } from "@/components/searchable-combobox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { resolveChoiceIcon } from "@/components/select-input";
import {
  CalendarCheck,
  Users,
  UserCheck,
  DollarSign,
  ReceiptText,
  Clock,
  ArrowUpRight,
  Filter,
  Star,
  BarChart3,
  Sparkles,
  TrendingUp,
  Activity,
  CheckCircle2,
  Calendar,
  CalendarDays,
  History,
  Phone,
  MessageSquareQuote,
  Check,
  Wallet,
  Package,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { cn, formatIDR } from "@/lib/utils";
import {
  format,
  subDays,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import { calculateBookingFinancials } from "@/lib/financial-calculator";

export const Dashboard = () => {
  const translate = useTranslate();
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  // Filter state with "today" as default
  const [timeRange, setTimeRange] = React.useState<string>("today");

  // Fetch real data from Supabase backend
  const { data: bookings = [], isPending: loadingBookings } = useGetList("bookings", {
    pagination: { page: 1, perPage: 5000 },
    sort: { field: "id", order: "DESC" },
  });
  const { data: invoices = [], isPending: loadingInvoices } = useGetList("invoices", {
    pagination: { page: 1, perPage: 5000 },
    sort: { field: "id", order: "DESC" },
  });
  const { data: therapists = [], isPending: loadingTherapists } = useGetList("therapists", {
    pagination: { page: 1, perPage: 500 },
  });
  const { data: services = [] } = useGetList("services", {
    pagination: { page: 1, perPage: 500 },
  });
  const { data: customers = [] } = useGetList("customers", {
    pagination: { page: 1, perPage: 5000 },
  });
  const { data: reviews = [] } = useGetList("reviews", {
    pagination: { page: 1, perPage: 1000 },
    sort: { field: "id", order: "DESC" },
  });
  const { data: promotions = [] } = useGetList("promotions", {
    pagination: { page: 1, perPage: 500 },
  });

  // Invoice Map for fast O(1) lookup
  const invoiceByBookingId = React.useMemo(() => {
    const map = new Map<number, any>();
    invoices.forEach((inv) => {
      if (inv.booking_id) {
        map.set(Number(inv.booking_id), inv);
      }
    });
    return map;
  }, [invoices]);

  // Calculate synchronized date interval based on timeRange
  const filterDateRange = React.useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    if (timeRange === "today") {
      return { start: todayStart, end: todayEnd, labelId: "Hari Ini", labelEn: "Today" };
    }
    if (timeRange === "yesterday") {
      const yesterday = subDays(now, 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday), labelId: "Kemarin", labelEn: "Yesterday" };
    }
    if (timeRange === "7d") {
      return { start: startOfDay(subDays(now, 6)), end: todayEnd, labelId: "7 Hari Terakhir", labelEn: "Last 7 Days" };
    }
    if (timeRange === "30d") {
      return { start: startOfDay(subDays(now, 29)), end: todayEnd, labelId: "30 Hari Terakhir", labelEn: "Last 30 Days" };
    }
    if (timeRange === "this_month") {
      return { start: startOfMonth(now), end: endOfMonth(now), labelId: "Bulan Ini", labelEn: "This Month" };
    }
    if (timeRange === "this_year") {
      return { start: startOfYear(now), end: endOfYear(now), labelId: "Tahun Ini", labelEn: "This Year" };
    }
    return { start: new Date(2020, 0, 1), end: new Date(2040, 0, 1), labelId: "Semua Waktu", labelEn: "All Time" };
  }, [timeRange]);

  // Helper to check if a record falls within the active timeframe
  const isInRange = React.useCallback(
    (dateStr?: string | null, createdAtStr?: string | null) => {
      if (timeRange === "all") return true;
      let targetDate: Date | null = null;
      if (dateStr) {
        try {
          targetDate = new Date(dateStr);
        } catch (e) {
          // ignore
        }
      }
      if (!targetDate || isNaN(targetDate.getTime())) {
        if (createdAtStr) {
          try {
            targetDate = new Date(createdAtStr);
          } catch (e) {
            // ignore
          }
        }
      }
      if (!targetDate || isNaN(targetDate.getTime())) return false;
      return targetDate >= filterDateRange.start && targetDate <= filterDateRange.end;
    },
    [timeRange, filterDateRange]
  );

  // Synchronized Filtered Datasets
  const filteredBookings = React.useMemo(() => {
    return bookings.filter((b) => isInRange(b.booking_date, b.created_at));
  }, [bookings, isInRange]);

  const filteredInvoices = React.useMemo(() => {
    return invoices.filter((inv) => isInRange(inv.booking_date, inv.created_at));
  }, [invoices, isInRange]);

  const filteredReviews = React.useMemo(() => {
    return reviews.filter((rev) => isInRange(null, rev.created_at));
  }, [reviews, isInRange]);

  // 1. Booking Status Metrics for the Period
  const pendingBookings = filteredBookings.filter((b) => b.status === "pending").length;
  const confirmedBookings = filteredBookings.filter((b) => b.status === "confirmed").length;
  const completedBookings = filteredBookings.filter((b) => b.status === "completed").length;
  const totalBookingsCount = filteredBookings.length;

  // 2. Financial Metrics for the Period (Unified via calculateBookingFinancials)
  const financialMetrics = React.useMemo(() => {
    let gross = 0;
    let therapistFees = 0;
    let bhp = 0;
    let net = 0;
    let paidCount = 0;

    filteredBookings.forEach((b) => {
      if (b.payment_status === "paid") {
        paidCount++;
        const matchedInv = invoiceByBookingId.get(Number(b.id));
        const srv = services.find((s) => s.id === b.service_id);
        const th = therapists.find((t) => t.id === b.therapist_id);

        const fin = calculateBookingFinancials({
          bookingPrice: Number(b.total_price || srv?.price || 0),
          servicePrice: Number(srv?.price || 0),
          consumablesCost: Number(srv?.consumables_cost || 0),
          commissionRate: Number(th?.commission_rate || 60),
          invoice: matchedInv,
          promotions,
        });

        gross += fin.finalCustomerTotal;
        therapistFees += fin.therapistFee;
        bhp += fin.consumablesCost;
        net += fin.netSerenaRaga;
      }
    });

    return {
      grossRevenue: gross,
      therapistFeeCost: therapistFees,
      bhpCost: bhp,
      netProfit: net,
      paidOrdersCount: paidCount,
      netMarginPercent: gross > 0 ? ((net / gross) * 100).toFixed(1) : "0.0",
    };
  }, [filteredBookings, invoiceByBookingId, services, therapists, promotions]);

  const {
    grossRevenue,
    therapistFeeCost,
    bhpCost,
    netProfit,
    paidOrdersCount,
    netMarginPercent,
  } = financialMetrics;

  // 3. Operational Roster & Performance Metrics
  const availableTherapists = therapists.filter((t) => t.status === "available").length;
  const onDutyTherapists = therapists.filter((t) => t.status === "on_duty").length;
  const offDutyTherapists = therapists.filter((t) => t.status === "off_duty").length;

  // Average Rating
  const averageRating = React.useMemo(() => {
    const targetReviews = filteredReviews.length > 0 ? filteredReviews : reviews;
    if (targetReviews.length === 0) return "-";
    const total = targetReviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    return (total / targetReviews.length).toFixed(1);
  }, [filteredReviews, reviews]);

  // Payment Breakdown for the Period
  const paymentStats = React.useMemo(() => {
    const list = filteredInvoices.length > 0 ? filteredInvoices : (invoices.length > 0 ? invoices : []);
    let qris = 0;
    let transfer = 0;
    let cash = 0;

    list.forEach((inv) => {
      const method = (inv.payment_method || "").toLowerCase();
      if (method.includes("qris")) {
        qris++;
      } else if (method.includes("transfer") || method.includes("bca") || method.includes("mandiri") || method.includes("bank")) {
        transfer++;
      } else {
        cash++;
      }
    });

    const total = qris + transfer + cash || 1;
    return {
      qris: Math.round((qris / total) * 100),
      transfer: Math.round((transfer / total) * 100),
      cash: Math.round((cash / total) * 100),
      totalTransactions: qris + transfer + cash,
    };
  }, [filteredInvoices, invoices]);

  // Urgent Action items (Global across all bookings & invoices)
  const urgentPendingBookings = bookings.filter((b) => b.status === "pending").length;
  const urgentUnpaidInvoices = invoices.filter((i) => i.payment_status !== "paid").length;

  // 4. Generate Daily Chart Data (Always Daily, showing Net Profit only)
  const chartData = React.useMemo(() => {
    const data: { date: string; profit: number; bookings: number }[] = [];
    const now = new Date();

    // Determine number of daily bars to show (7 days for today/yesterday/7d, 14 for 30d/month, 30 for year/all)
    const days = timeRange === "30d" || timeRange === "this_month" ? 14 : timeRange === "this_year" || timeRange === "all" ? 30 : 7;

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString(isEn ? "en-US" : "id-ID", {
        day: "numeric",
        month: "short",
      });

      const dayBookings = bookings.filter((b) => {
        if (!b.booking_date) return false;
        return b.booking_date.startsWith(dateKey);
      });

      let dayProfit = 0;

      dayBookings.forEach((b) => {
        if (b.payment_status === "paid") {
          const matchedInv = invoiceByBookingId.get(Number(b.id));
          const srv = services.find((s) => s.id === b.service_id);
          const th = therapists.find((t) => t.id === b.therapist_id);

          const fin = calculateBookingFinancials({
            bookingPrice: Number(b.total_price || srv?.price || 0),
            servicePrice: Number(srv?.price || 0),
            consumablesCost: Number(srv?.consumables_cost || 0),
            commissionRate: Number(th?.commission_rate || 60),
            invoice: matchedInv,
            promotions,
          });

          dayProfit += fin.netSerenaRaga;
        }
      });

      data.push({
        date: label,
        profit: dayProfit,
        bookings: dayBookings.length,
      });
    }
    return data;
  }, [bookings, invoiceByBookingId, services, therapists, promotions, timeRange, isEn]);

  const totalPeriodProfit = React.useMemo(() => {
    return chartData.reduce((acc, d) => acc + d.profit, 0);
  }, [chartData]);

  // Real Service Stats for top popular rankings
  const serviceStats = React.useMemo(() => {
    const targetBookings = filteredBookings.length > 0 ? filteredBookings : bookings;
    const map: Record<number, number> = {};
    targetBookings.forEach((b) => {
      if (b.service_id) {
        map[Number(b.service_id)] = (map[Number(b.service_id)] || 0) + 1;
      }
    });

    const entries = Object.entries(map).map(([sId, count]) => {
      const srv = services.find((s) => s.id === Number(sId));
      return {
        id: Number(sId),
        name: srv?.name || `Layanan #${sId}`,
        price: srv?.price || 0,
        duration: srv?.duration_minutes || 60,
        count,
      };
    });

    entries.sort((a, b) => b.count - a.count);
    return entries;
  }, [filteredBookings, bookings, services]);

  const maxServiceCount = React.useMemo(() => {
    if (serviceStats.length === 0) return 1;
    return Math.max(...serviceStats.map((s) => s.count), 1);
  }, [serviceStats]);

  const chartConfig = {
    profit: {
      label: isEn ? "Net Profit" : "Laba Bersih",
      color: "#8b5e3c",
    },
  } satisfies ChartConfig;

  if (loadingBookings && loadingTherapists && loadingInvoices) {
    return <DashboardSkeleton />;
  }

  // Stagger container animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-14 pt-1"
    >
      {/* 1. Clean Header Bar */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-5"
      >
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {isEn ? "Operational & Financial Dashboard" : "Dashboard Operasional & Keuangan"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isEn
              ? "Live overview of bookings, gross revenue, therapist fees, supply costs, and net profit."
              : "Ringkasan data transaksi, omset kotor, komisi terapis, biaya bahan (BHP), dan laba bersih."}
          </p>
        </div>

        {/* Header Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Synchronized Timeframe Filter (Defaults to Today) */}
          <div className="w-48">
            {(() => {
              const timeRangeItems = [
                { value: "today", label: isEn ? "Today (Default)" : "Hari Ini (Default)" },
                { value: "yesterday", label: isEn ? "Yesterday" : "Kemarin" },
                { value: "7d", label: isEn ? "Last 7 Days" : "7 Hari Terakhir" },
                { value: "30d", label: isEn ? "Last 30 Days" : "30 Hari Terakhir" },
                { value: "this_month", label: isEn ? "This Month" : "Bulan Ini" },
                { value: "this_year", label: isEn ? "This Year" : "Tahun Ini" },
                { value: "all", label: isEn ? "All Time" : "Semua Waktu" },
              ];
              return (
                <Select
                  items={timeRangeItems}
                  value={timeRange}
                  onValueChange={(val) => {
                    if (val) setTimeRange(val);
                  }}
                >
                  <SelectTrigger className="w-full h-8 text-xs bg-background">
                    <SelectValue placeholder={isEn ? "Select timeframe..." : "Pilih periode..."}>
                      {(val) => {
                        const item = timeRangeItems.find((t) => t.value === val);
                        if (!item) return isEn ? "Select timeframe..." : "Pilih periode...";
                        return (
                          <span className="flex items-center gap-1.5 truncate">
                            <span className="shrink-0 flex items-center">{resolveChoiceIcon(item.value)}</span>
                            <span className="truncate">{item.label}</span>
                          </span>
                        );
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="z-50 max-h-60 rounded-lg">
                    <SelectGroup>
                      {timeRangeItems.map((item) => (
                        <SelectItem key={item.value} value={item.value} className="text-xs py-1.5 px-2 flex items-center gap-1.5">
                          <span className="shrink-0 flex items-center">{resolveChoiceIcon(item.value)}</span>
                          <span>{item.label}</span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              );
            })()}
          </div>

          <Button
            variant="outline"
            className="h-9 px-3.5 gap-2 text-xs font-medium border-border hover:bg-muted/60 shadow-none"
            asChild
          >
            <a href="#/invoices/create" className="cursor-pointer">
              <ReceiptText className="w-4 h-4 text-muted-foreground" />
              <span>{isEn ? "New Invoice" : "Buat Nota"}</span>
            </a>
          </Button>

          <Button
            className="h-9 px-4 gap-2 text-xs font-medium bg-[#8b5e3c] hover:bg-[#785033] dark:bg-[#d49b6a] dark:hover:bg-[#c28a5a] text-white dark:text-zinc-950 shadow-none transition-colors"
            asChild
          >
            <a href="#/bookings/create" className="cursor-pointer">
              <CalendarCheck className="w-4 h-4" />
              <span>{isEn ? "+ New Booking" : "+ Booking Baru"}</span>
            </a>
          </Button>
        </div>
      </motion.div>

      {/* 2. Clean Primary Row: 5 Core Financial & Order Metrics Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5"
      >
        {/* Card 1: Bookings */}
        <Card className="border border-border shadow-none bg-card hover:border-border transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
            <span className="text-xs font-medium text-muted-foreground">
              {isEn ? "Bookings" : "Pemesanan"}
            </span>
            <CalendarCheck className="w-4 h-4 text-[#8b5e3c] dark:text-[#d49b6a]" />
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="text-2xl font-bold text-foreground tracking-tight">
              {totalBookingsCount}
            </div>
            <p className="text-xs text-muted-foreground font-normal">
              {pendingBookings} {isEn ? "pending" : "menunggu"} • {confirmedBookings} {isEn ? "active" : "aktif"} • {completedBookings} {isEn ? "done" : "selesai"}
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Gross Revenue */}
        <Card className="border border-border shadow-none bg-card hover:border-border transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
            <span className="text-xs font-medium text-muted-foreground">
              {isEn ? "Gross Revenue" : "Omset Pendapatan"}
            </span>
            <DollarSign className="w-4 h-4 text-[#8b5e3c] dark:text-[#d49b6a]" />
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="text-2xl font-bold text-foreground tracking-tight">
              {formatIDR(grossRevenue)}
            </div>
            <p className="text-xs text-muted-foreground font-normal">
              {paidOrdersCount} {isEn ? "orders completed & paid" : "pesanan lunas terbayar"}
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Therapist Fees */}
        <Card className="border border-border shadow-none bg-card hover:border-border transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
            <span className="text-xs font-medium text-muted-foreground">
              {isEn ? "Therapist Fees" : "Komisi Terapis"}
            </span>
            <Wallet className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="text-2xl font-bold text-foreground tracking-tight">
              {formatIDR(therapistFeeCost)}
            </div>
            <p className="text-xs text-muted-foreground font-normal">
              {isEn ? "From therapist commission rates" : "Dari komisi per terapis"}
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Consumables (BHP) */}
        <Card className="border border-border shadow-none bg-card hover:border-border transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
            <span className="text-xs font-medium text-muted-foreground">
              {isEn ? "Consumables (BHP)" : "Biaya Bahan (BHP)"}
            </span>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="text-2xl font-bold text-foreground tracking-tight">
              {formatIDR(bhpCost)}
            </div>
            <p className="text-xs text-muted-foreground font-normal">
              {isEn ? "From service consumables COGS" : "Dari HPP bahan per layanan"}
            </p>
          </CardContent>
        </Card>

        {/* Card 5: Net Profit (Refined Accent) */}
        <Card className="border border-border hover:border-[#8b5e3c]/40 dark:hover:border-[#d49b6a]/40 shadow-none bg-card transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
            <span className="text-xs font-medium text-foreground">
              {isEn ? "Net Profit" : "Laba Bersih"}
            </span>
            <TrendingUp className="w-4 h-4 text-[#8b5e3c] dark:text-[#d49b6a]" />
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="text-2xl font-bold text-foreground tracking-tight">
              {formatIDR(netProfit)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-normal">
              <span className="font-semibold text-[#8b5e3c] dark:text-[#d49b6a] bg-[#8b5e3c]/10 dark:bg-[#d49b6a]/15 px-1.5 py-0.5 rounded text-[11px]">
                {netMarginPercent}% margin
              </span>
              <span>•</span>
              <span>{isEn ? "net operational" : "bersih operasional"}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 2. Analytics Section: Daily Net Profit Bar Chart (8 cols) & Top Services (4 cols) */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        {/* Left: Clean Daily Net Profit Bar Chart */}
        <Card className="lg:col-span-8 border border-border shadow-none bg-card flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="space-y-1">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#8b5e3c] dark:text-[#d49b6a]" />
                <span>{isEn ? "Daily Net Profit Trends" : "Tren Laba Bersih Harian"}</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {isEn
                  ? "Daily net profit after deducting therapist commissions and supply costs."
                  : "Akumulasi laba bersih harian setelah dipotong komisi terapis dan biaya BHP."}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <ChartContainer config={chartConfig} className="h-64 w-full aspect-auto">
              <BarChart data={chartData} margin={{ top: 10, right: 15, left: 15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tickMargin={8}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  width={68}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tickMargin={4}
                  tickFormatter={(val) => {
                    if (val >= 1000000) {
                      const m = (val / 1000000).toFixed(1).replace(/\.0$/, '');
                      return `Rp ${m}M`;
                    }
                    return `Rp ${Math.round(val / 1000)}k`;
                  }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <ChartTooltip
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.25 }}
                  content={
                    <ChartTooltipContent
                      formatter={(value) => (
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground text-xs">{isEn ? "Net Profit:" : "Laba Bersih:"}</span>
                          <span className="font-bold text-foreground text-xs">
                            Rp {Number(value).toLocaleString("id-ID")}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                {/* Single Clean Net Profit Bar */}
                <Bar
                  dataKey="profit"
                  name={isEn ? "Net Profit" : "Laba Bersih"}
                  fill="currentColor"
                  className="fill-[#8b5e3c] dark:fill-[#d49b6a] transition-colors"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ChartContainer>

            {/* Bottom Chart Stats Summary (Seamless) */}
            <div className="grid grid-cols-3 gap-2 pt-4 mt-2 border-t border-border text-center">
              <div className="py-1.5 px-2">
                <span className="text-[11px] text-muted-foreground block">{isEn ? "Total Net Profit" : "Total Laba Bersih"}</span>
                <span className="text-sm font-bold text-[#8b5e3c] dark:text-[#d49b6a] block mt-0.5">
                  {formatIDR(netProfit)}
                </span>
              </div>
              <div className="py-1.5 px-2">
                <span className="text-[11px] text-muted-foreground block">{isEn ? "Daily Average Profit" : "Rata-rata Laba/Hari"}</span>
                <span className="text-sm font-bold text-foreground block mt-0.5">
                  Rp {Math.round((totalPeriodProfit / Math.max(chartData.length, 1)) / 1000).toLocaleString("id-ID")}k
                </span>
              </div>
              <div className="py-1.5 px-2">
                <span className="text-[11px] text-muted-foreground block">{isEn ? "Net Profit Margin" : "Margin Laba Bersih"}</span>
                <span className="text-sm font-bold text-foreground block mt-0.5">
                  {netMarginPercent}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: Popular Services (4 cols) */}
        <Card className="lg:col-span-4 border border-border shadow-none bg-card flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#8b5e3c] dark:text-[#d49b6a]" />
              <span>{isEn ? "Top Services" : "Layanan Terlaris"}</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {isEn ? "Most requested massage packages in this period." : "Paket pijat paling banyak dipesan pada periode ini."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {serviceStats.length > 0 ? (
              <div className="space-y-3.5">
                {serviceStats.slice(0, 5).map((item, index) => (
                  <div key={item.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`text-[10px] font-bold w-4 ${index === 0 ? "text-[#8b5e3c] dark:text-[#d49b6a]" : "text-muted-foreground"}`}>
                          #{index + 1}
                        </span>
                        <span className="font-medium text-foreground truncate max-w-[150px]">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-foreground">
                        {item.count} <span className="text-[10px] text-muted-foreground font-normal">{isEn ? "orders" : "order"}</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-muted/70 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#8b5e3c] dark:bg-[#d49b6a] rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(12, (item.count / maxServiceCount) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty className="min-h-[160px] py-6 border-dashed border-border bg-muted/10">
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="h-9 w-9 [&_svg]:h-4 [&_svg]:w-4 mb-1">
                    <Clock className="text-muted-foreground" />
                  </EmptyMedia>
                  <EmptyTitle className="text-xs">
                    {isEn ? "No order data in this period" : "Belum ada pesanan pada periode ini"}
                  </EmptyTitle>
                  <EmptyDescription className="text-[11px]">
                    {isEn
                      ? "Top service rankings will appear here as bookings are placed."
                      : "Peringkat layanan terpopuler akan terisi otomatis setelah ada transaksi booking."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}

            <div className="pt-2 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between text-xs font-medium text-muted-foreground hover:text-[#8b5e3c] dark:hover:text-[#d49b6a] h-8 px-2"
                asChild
              >
                <a href="#/services" className="inline-flex items-center cursor-pointer">
                  <span>{isEn ? "Manage all services" : "Buka katalog layanan"}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 3. Operational Feed: Recent Bookings (7 cols) & Therapist Status (5 cols) */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        {/* Recent Real Bookings (7 cols) */}
        <Card className="lg:col-span-7 border border-border shadow-none bg-card flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#8b5e3c] dark:text-[#d49b6a]" />
                <span>{isEn ? "Recent Appointments" : "Pemesanan Terbaru"}</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {isEn ? "Latest appointments synchronized from database." : "Daftar pesanan terbaru langsung dari database."}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 text-xs font-medium text-muted-foreground hover:text-[#8b5e3c] dark:hover:text-[#d49b6a]"
              asChild
            >
              <a href="#/bookings" className="inline-flex items-center gap-1 cursor-pointer">
                <span>{isEn ? "View all" : "Lihat semua"}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {bookings.length > 0 ? (
              <div className="divide-y divide-border/40 text-xs">
                {bookings.slice(0, 5).map((b) => {
                  const srv = services.find((s) => s.id === b.service_id);
                  const cust = customers.find((c) => c.id === b.customer_id);
                  const initial = cust?.full_name?.charAt(0).toUpperCase() || "P";

                  return (
                    <div key={b.id} className="py-3 flex items-center justify-between gap-3 hover:bg-muted/30 px-1.5 rounded-lg transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-8 w-8 rounded-lg border border-border bg-[#8b5e3c]/5 dark:bg-[#d49b6a]/10 text-xs font-semibold text-[#8b5e3c] dark:text-[#d49b6a] shrink-0">
                          <AvatarFallback className="rounded-lg bg-transparent text-[#8b5e3c] dark:text-[#d49b6a]">
                            {initial}
                          </AvatarFallback>
                        </Avatar>

                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-foreground">
                              #{b.id}
                            </span>
                            <span className="font-medium text-foreground truncate max-w-[160px] sm:max-w-[200px]">
                              {srv?.name || (isEn ? "Massage Service" : "Layanan Pijat")}
                            </span>
                          </div>
                          <div className="text-muted-foreground text-[11px] flex items-center gap-2">
                            <span className="truncate max-w-[120px]">{cust?.full_name || `Pelanggan #${b.customer_id || "-"}`}</span>
                            <span>•</span>
                            <span>{b.booking_date || "-"}</span>
                            <span>•</span>
                            <span>{b.booking_time || "-"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right space-y-1 shrink-0">
                        <div className="font-semibold text-xs text-foreground">
                          {formatIDR(b.total_price)}
                        </div>
                        <span className="text-xs font-medium text-muted-foreground capitalize">
                          {b.status || "pending"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty className="min-h-[160px] py-6 border-dashed border-border bg-muted/10">
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="h-9 w-9 [&_svg]:h-4 [&_svg]:w-4 mb-1">
                    <CalendarCheck className="text-muted-foreground" />
                  </EmptyMedia>
                  <EmptyTitle className="text-xs">
                    {isEn ? "No bookings recorded yet" : "Belum ada pemesanan"}
                  </EmptyTitle>
                  <EmptyDescription className="text-[11px]">
                    {isEn
                      ? "Real-time client appointments will show up here automatically."
                      : "Pemesanan layanan terbaru dari pelanggan akan muncul di sini."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>

        {/* Real Therapist Roster (5 cols) */}
        <Card className="lg:col-span-5 border border-border shadow-none bg-card flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#8b5e3c] dark:text-[#d49b6a]" />
                <span>{isEn ? "Therapist Status" : "Kesiapan Terapis"}</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {isEn ? "Live therapist assignments and readiness." : "Status penugasan terapis bertugas saat ini."}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 text-xs font-medium text-muted-foreground hover:text-[#8b5e3c] dark:hover:text-[#d49b6a]"
              asChild
            >
              <a href="#/therapists" className="inline-flex items-center gap-1 cursor-pointer">
                <span>{isEn ? "Roster" : "Kelola"}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {therapists.length > 0 ? (
              <div className="divide-y divide-border/40 text-xs">
                {therapists.slice(0, 5).map((t) => {
                  const initial = t.name?.charAt(0).toUpperCase() || "T";
                  return (
                    <div key={t.id} className="py-2.5 flex items-center justify-between gap-2 hover:bg-muted/30 px-1.5 rounded-lg transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="h-7 w-7 rounded-full border border-border text-xs font-semibold shrink-0">
                          <AvatarFallback className="bg-muted text-foreground">
                            {initial}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-medium text-foreground truncate max-w-[140px]">{t.name}</p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5 text-muted-foreground" />
                            <span>{t.phone || "-"}</span>
                          </p>
                        </div>
                      </div>

                      {t.status === "available" ? (
                        <span className="text-xs font-medium text-[#8b5e3c] dark:text-[#d49b6a] shrink-0 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#8b5e3c] dark:bg-[#d49b6a]" />
                          {isEn ? "Available" : "Siap"}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground shrink-0">
                          {t.status === "on_duty"
                            ? isEn ? "On Duty" : "Bertugas"
                            : isEn ? "Off Duty" : "Libur"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty className="min-h-[160px] py-6 border-dashed border-border bg-muted/10">
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="h-9 w-9 [&_svg]:h-4 [&_svg]:w-4 mb-1">
                    <UserCheck className="text-muted-foreground" />
                  </EmptyMedia>
                  <EmptyTitle className="text-xs">
                    {isEn ? "No therapists registered" : "Belum ada data terapis"}
                  </EmptyTitle>
                  <EmptyDescription className="text-[11px]">
                    {isEn
                      ? "Add therapists to monitor live availability and task assignments."
                      : "Daftarkan staf terapis untuk memantau status kesiapan bertugas."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* 4. Recent Client Reviews & Feedback Highlight */}
      {reviews.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="border border-border shadow-none bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="space-y-0.5">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <MessageSquareQuote className="w-4 h-4 text-[#8b5e3c] dark:text-[#d49b6a]" />
                  <span>{isEn ? "Recent Customer Praise" : "Ulasan Terbaru Pelanggan"}</span>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {isEn ? "Feedback & satisfaction from real home massage sessions." : "Feedback langsung dari pelanggan setelah layanan pijat di rumah."}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 text-xs font-medium text-muted-foreground hover:text-[#8b5e3c] dark:hover:text-[#d49b6a]"
                asChild
              >
                <a href="#/reviews" className="inline-flex items-center gap-1 cursor-pointer">
                  <span>{isEn ? "All reviews" : "Semua ulasan"}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {reviews.slice(0, 3).map((rev) => {
                  const rating = Number(rev.rating) || 5;
                  return (
                    <div
                      key={rev.id}
                      className="p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors space-y-2 flex flex-col justify-between text-xs"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground truncate max-w-[140px]">
                            {rev.customer_name || "Pelanggan"}
                          </span>
                          <div className="flex items-center gap-0.5 text-[#8b5e3c] dark:text-[#d49b6a] text-[10px]">
                            {[...Array(rating)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-[#8b5e3c] text-[#8b5e3c] dark:fill-[#d49b6a] dark:text-[#d49b6a]" />
                            ))}
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 italic">
                          &ldquo;{rev.comment || (isEn ? "Very satisfied with the service." : "Pijatan sangat enak dan terapis ramah.")}&rdquo;
                        </p>
                      </div>

                      <div className="text-[10px] text-muted-foreground/70 flex items-center justify-between pt-1 border-t border-border">
                        <span>Ref #{rev.booking_id || rev.id}</span>
                        <span>
                          {rev.created_at
                            ? new Date(rev.created_at).toLocaleDateString(isEn ? "en-US" : "id-ID", {
                                day: "numeric",
                                month: "short",
                              })
                            : ""}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* 5. Clean Operational & Performance Compact Cards (Placed at the bottom) */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5"
      >
        {/* Compact Card 1: Therapist Readiness */}
        <Card className="border border-border shadow-none bg-card hover:border-border transition-colors">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#8b5e3c] dark:text-[#d49b6a]" />
                {isEn ? "Therapist Status" : "Kesiapan Terapis"}
              </span>
              <span className="text-xs text-muted-foreground">
                {therapists.length} {isEn ? "registered" : "terdaftar"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
              <span className="font-semibold text-[#8b5e3c] dark:text-[#d49b6a]">{availableTherapists} {isEn ? "Ready" : "Siap"}</span>
              <span className="text-muted-foreground/40">•</span>
              <span className="text-muted-foreground">{onDutyTherapists} {isEn ? "On Duty" : "Bertugas"}</span>
              <span className="text-muted-foreground/40">•</span>
              <span className="text-muted-foreground">{offDutyTherapists} {isEn ? "Off" : "Libur"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Compact Card 2: Client Rating & Feedback */}
        <Card className="border border-border shadow-none bg-card hover:border-border transition-colors">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-[#8b5e3c] dark:text-[#d49b6a]" />
                {isEn ? "Client Satisfaction" : "Kepuasan Pelanggan"}
              </span>
              <span className="text-xs font-semibold text-[#8b5e3c] dark:text-[#d49b6a]">
                {averageRating} <span className="text-[10px] text-muted-foreground font-normal">/ 5.0</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-border text-muted-foreground">
              <span>{customers.length} {isEn ? "clients" : "pelanggan"}</span>
              <span className="text-foreground">
                {filteredReviews.length > 0 ? `${filteredReviews.length} ${isEn ? "new reviews" : "ulasan baru"}` : `${reviews.length} ${isEn ? "total reviews" : "total ulasan"}`}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Compact Card 3: Payment Method Share */}
        <Card className="border border-border shadow-none bg-card hover:border-border transition-colors">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                {isEn ? "Payment Methods" : "Metode Pembayaran"}
              </span>
              <span className="text-xs text-muted-foreground">
                {paymentStats.totalTransactions} {isEn ? "invoices" : "nota"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-border text-muted-foreground">
              <span className="text-foreground font-medium">QRIS {paymentStats.qris}%</span>
              <span className="text-muted-foreground/40">•</span>
              <span>TRANSFER {paymentStats.transfer}%</span>
              <span className="text-muted-foreground/40">•</span>
              <span>CASH {paymentStats.cash}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Compact Card 4: Action Required Alert */}
        <Card className="border border-border shadow-none bg-card hover:border-border transition-colors">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
                {isEn ? "Attention Needed" : "Perlu Tindakan"}
              </span>
              {(urgentPendingBookings > 0 || urgentUnpaidInvoices > 0) && (
                <span className="text-[11px] font-semibold text-[#8b5e3c] dark:text-[#d49b6a]">
                  {urgentPendingBookings + urgentUnpaidInvoices} {isEn ? "items" : "item"}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
              <a href="#/bookings" className="text-foreground hover:text-[#8b5e3c] dark:hover:text-[#d49b6a] hover:underline font-medium">
                {urgentPendingBookings} {isEn ? "pending bookings" : "booking pending"}
              </a>
              <span className="text-muted-foreground/40">•</span>
              <a href="#/invoices" className="text-muted-foreground hover:text-foreground hover:underline">
                {urgentUnpaidInvoices} {isEn ? "unpaid" : "belum bayar"}
              </a>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};
