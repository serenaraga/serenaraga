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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Phone,
  MessageSquareQuote,
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
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Dashboard = () => {
  const translate = useTranslate();
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  // Filter state: "7d" | "30d" | "all"
  const [timeRange, setTimeRange] = React.useState<string>("30d");

  // Fetch real data from Supabase backend
  const { data: bookings = [], isPending: loadingBookings } = useGetList("bookings", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "id", order: "DESC" },
  });
  const { data: therapists = [], isPending: loadingTherapists } = useGetList("therapists", {
    pagination: { page: 1, perPage: 100 },
  });
  const { data: services = [] } = useGetList("services", {
    pagination: { page: 1, perPage: 100 },
  });
  const { data: customers = [] } = useGetList("customers", {
    pagination: { page: 1, perPage: 100 },
  });
  const { data: reviews = [] } = useGetList("reviews", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "id", order: "DESC" },
  });

  if (loadingBookings && loadingTherapists) {
    return <DashboardSkeleton />;
  }

  // Calculate Metrics
  const totalRevenue = React.useMemo(() => {
    return bookings.reduce((acc, b) => {
      if (b.payment_status === "paid") {
        return acc + (Number(b.total_price) || 0);
      }
      return acc;
    }, 0);
  }, [bookings]);

  const availableTherapists = therapists.filter((t) => t.status === "available").length;
  const onDutyTherapists = therapists.filter((t) => t.status === "on_duty").length;
  const offDutyTherapists = therapists.filter((t) => t.status === "off_duty").length;
  const pendingBookings = bookings.filter((b) => b.status === "pending").length;
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed").length;
  const completedBookings = bookings.filter((b) => b.status === "completed").length;

  const averageRating = React.useMemo(() => {
    if (reviews.length === 0) return "5.0";
    const total = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  // Generate Chart Data based on actual bookings
  const chartData = React.useMemo(() => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 14 : 30;
    const data = [];
    const now = new Date();

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

      const dayRevenue = dayBookings.reduce((sum, b) => {
        if (b.payment_status === "paid") {
          return sum + (Number(b.total_price) || 0);
        }
        return sum;
      }, 0);

      data.push({
        date: label,
        revenue: dayRevenue,
        bookings: dayBookings.length,
      });
    }
    return data;
  }, [bookings, timeRange, isEn]);

  // Total in filtered chart
  const periodTotalRevenue = React.useMemo(() => {
    return chartData.reduce((acc, d) => acc + d.revenue, 0);
  }, [chartData]);

  const peakDayRevenue = React.useMemo(() => {
    return Math.max(...chartData.map((d) => d.revenue), 0);
  }, [chartData]);

  // Real Service Stats
  const serviceStats = React.useMemo(() => {
    const map: Record<number, number> = {};
    bookings.forEach((b) => {
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
  }, [bookings, services]);

  const maxServiceCount = React.useMemo(() => {
    if (serviceStats.length === 0) return 1;
    return Math.max(...serviceStats.map((s) => s.count), 1);
  }, [serviceStats]);

  const chartConfig = {
    revenue: {
      label: isEn ? "Revenue" : "Pendapatan",
      color: "#8b5e3c",
    },
    bookings: {
      label: isEn ? "Bookings" : "Pesanan",
      color: "#d49b6a",
    },
  } satisfies ChartConfig;

  // Stagger container animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-14 pt-1"
    >
      {/* 1. Header Bar: Title, Live Status & Quick Action Buttons */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-5"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {isEn ? "Operational Dashboard" : "Dashboard Operasional"}
            </h1>
            <Badge
              variant="outline"
              className="gap-1.5 px-2.5 py-0.5 text-[11px] font-medium border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isEn ? "Live Realtime" : "Realtime Aktif"}</span>
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {isEn
              ? "Live overview of client appointments, therapist assignments, and revenue."
              : "Ringkasan data pemesanan pelanggan, penugasan terapis, ulasan, dan omzet."}
          </p>
        </div>

        {/* Header Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Filter */}
          <div className="flex items-center gap-1.5 bg-background border border-border/80 rounded-lg px-2.5 h-9 shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <Select
              value={timeRange}
              onValueChange={(val) => setTimeRange(val || "30d")}
            >
              <SelectTrigger className="h-8 border-0 bg-transparent text-xs font-medium focus:ring-0 w-28 px-1 shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end" className="z-50 bg-popover border border-border">
                <SelectItem value="7d" className="text-xs">{isEn ? "Last 7 Days" : "7 Hari Terakhir"}</SelectItem>
                <SelectItem value="30d" className="text-xs">{isEn ? "Last 30 Days" : "30 Hari Terakhir"}</SelectItem>
                <SelectItem value="all" className="text-xs">{isEn ? "All Time" : "Semua Waktu"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            className="h-9 px-3.5 gap-2 text-xs font-medium border-border/80 hover:bg-muted/80"
            asChild
          >
            <a href="#/invoices/create" className="cursor-pointer">
              <ReceiptText className="w-4 h-4 text-muted-foreground" />
              <span>{isEn ? "New Invoice" : "Buat Nota"}</span>
            </a>
          </Button>

          <Button
            className="h-9 px-4 gap-2 text-xs font-semibold bg-[#8b5e3c] hover:bg-[#785033] text-white dark:bg-[#d49b6a] dark:hover:bg-[#c28a5a] dark:text-zinc-950 shadow-xs"
            asChild
          >
            <a href="#/bookings/create" className="cursor-pointer">
              <CalendarCheck className="w-4 h-4" />
              <span>{isEn ? "+ New Booking" : "+ Booking Baru"}</span>
            </a>
          </Button>
        </div>
      </motion.div>

      {/* 2. 4 Clean Metrics KPI Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Card 1: Revenue (with Serena Warm Brown Accent) */}
        <Card className="relative overflow-hidden border border-border/70 shadow-none bg-card hover:border-[#8b5e3c]/40 dark:hover:border-[#d49b6a]/40 transition-colors">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8b5e3c] to-[#d49b6a]" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
            <span className="text-xs font-medium text-muted-foreground">
              {isEn ? "Paid Revenue" : "Pendapatan Lunas"}
            </span>
            <div className="p-1.5 rounded-lg bg-[#8b5e3c]/10 text-[#8b5e3c] dark:bg-[#d49b6a]/15 dark:text-[#d49b6a]">
              <DollarSign className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="text-2xl font-bold text-foreground tracking-tight">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                maximumFractionDigits: 0,
              }).format(totalRevenue)}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>
                {isEn
                  ? `${completedBookings} orders completed & paid`
                  : `${completedBookings} pesanan lunas terbayar`}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Bookings */}
        <Card className="border border-border/70 shadow-none bg-card hover:border-foreground/20 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-medium text-muted-foreground">
              {isEn ? "Total Bookings" : "Total Pemesanan"}
            </span>
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="text-2xl font-bold text-foreground tracking-tight">
              {bookings.length}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                {pendingBookings} {isEn ? "pending" : "menunggu"}
              </Badge>
              <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                {confirmedBookings} {isEn ? "active" : "dikonfirmasi"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Therapists Readiness */}
        <Card className="border border-border/70 shadow-none bg-card hover:border-foreground/20 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-medium text-muted-foreground">
              {isEn ? "Therapist Readiness" : "Kesiapan Terapis"}
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="text-2xl font-bold text-foreground tracking-tight flex items-baseline gap-1.5">
              <span>{availableTherapists}</span>
              <span className="text-xs font-normal text-muted-foreground">
                / {therapists.length} {isEn ? "total registered" : "terdaftar"}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              <span>{availableTherapists} {isEn ? "Ready" : "Siap"}</span>
              <span className="text-muted-foreground/40">•</span>
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
              <span>{onDutyTherapists} {isEn ? "On Duty" : "Bertugas"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Clients & Customer Rating */}
        <Card className="border border-border/70 shadow-none bg-card hover:border-foreground/20 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-medium text-muted-foreground">
              {isEn ? "Clients & Rating" : "Pelanggan & Kepuasan"}
            </span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Star className="w-4 h-4 fill-amber-500" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="text-2xl font-bold text-foreground tracking-tight flex items-center justify-between">
              <span>{customers.length}</span>
              <div className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{averageRating}</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {reviews.length > 0
                ? `${reviews.length} ${isEn ? "verified client reviews" : "ulasan pelanggan terverifikasi"}`
                : isEn ? "Customer feedback monitored" : "Ulasan pelanggan terpantau"}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* 3. Analytics Section: Revenue Bar Chart (8 cols) & Top Services (4 cols) */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        {/* Left: Bar Chart with Serena Raga Bronze Gradient */}
        <Card className="lg:col-span-8 border border-border/70 shadow-none bg-card flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="space-y-1">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#8b5e3c] dark:text-[#d49b6a]" />
                <span>{isEn ? "Daily Revenue Trends" : "Tren Pendapatan Harian"}</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {isEn
                  ? "Real revenue based on customer booking dates."
                  : "Akumulasi pendapatan riil berdasarkan tanggal pemesanan."}
              </CardDescription>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-muted/60 text-foreground border border-border/50">
              <span className="text-muted-foreground font-normal">{isEn ? "Period:" : "Total Periode:"}</span>
              <span>
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  maximumFractionDigits: 0,
                }).format(periodTotalRevenue)}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <ChartContainer config={chartConfig} className="h-64 w-full aspect-auto">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
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
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tickFormatter={(val) => `Rp${(val / 1000).toFixed(0)}k`}
                  stroke="hsl(var(--muted-foreground))"
                />
                <ChartTooltip
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                  content={
                    <ChartTooltipContent
                      formatter={(value) => (
                        <span className="font-bold text-foreground">
                          Rp {Number(value).toLocaleString("id-ID")}
                        </span>
                      )}
                    />
                  }
                />
                {/* Serena Bronze Bar */}
                <Bar
                  dataKey="revenue"
                  fill="currentColor"
                  className="fill-[#8b5e3c] dark:fill-[#d49b6a] transition-colors"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            </ChartContainer>

            {/* Bottom Chart Stats Summary */}
            <div className="grid grid-cols-3 gap-2 pt-4 mt-2 border-t border-border/50 text-center">
              <div className="p-2 rounded-lg bg-muted/30 border border-border/40">
                <span className="text-[10px] text-muted-foreground block">{isEn ? "Filtered Total" : "Total Terpilih"}</span>
                <span className="text-xs font-bold text-foreground">
                  Rp {Math.round(periodTotalRevenue / 1000).toLocaleString("id-ID")}k
                </span>
              </div>
              <div className="p-2 rounded-lg bg-muted/30 border border-border/40">
                <span className="text-[10px] text-muted-foreground block">{isEn ? "Daily Average" : "Rata-rata/Hari"}</span>
                <span className="text-xs font-bold text-foreground">
                  Rp {Math.round((periodTotalRevenue / Math.max(chartData.length, 1)) / 1000).toLocaleString("id-ID")}k
                </span>
              </div>
              <div className="p-2 rounded-lg bg-muted/30 border border-border/40">
                <span className="text-[10px] text-muted-foreground block">{isEn ? "Peak Day" : "Hari Tertinggi"}</span>
                <span className="text-xs font-bold text-[#8b5e3c] dark:text-[#d49b6a]">
                  Rp {Math.round(peakDayRevenue / 1000).toLocaleString("id-ID")}k
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: Popular Services (4 cols) */}
        <Card className="lg:col-span-4 border border-border/70 shadow-none bg-card flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#8b5e3c] dark:text-[#d49b6a]" />
              <span>{isEn ? "Top Services" : "Layanan Terlaris"}</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {isEn ? "Most requested massage packages." : "Paket pijat paling banyak dipesan pelanggan."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {serviceStats.length > 0 ? (
              <div className="space-y-3.5">
                {serviceStats.slice(0, 5).map((item, index) => (
                  <div key={item.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[10px] font-bold text-muted-foreground w-4">
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
                        className="h-full bg-gradient-to-r from-[#8b5e3c] to-[#d49b6a] rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(12, (item.count / maxServiceCount) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-muted-foreground space-y-1">
                <Clock className="w-6 h-6 mx-auto text-muted-foreground/50 mb-2" />
                <p className="font-medium text-foreground">{isEn ? "No order data yet" : "Belum ada pesanan"}</p>
                <p className="text-[11px]">{isEn ? "New orders will be ranked here automatically." : "Data layanan terlaris akan otomatis terisi."}</p>
              </div>
            )}

            <div className="pt-2 border-t border-border/50">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between text-xs font-medium text-muted-foreground hover:text-foreground h-8 px-2"
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

      {/* 4. Operational Feed: Recent Bookings (7 cols) & Therapist Status (5 cols) */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        {/* Recent Real Bookings (7 cols) */}
        <Card className="lg:col-span-7 border border-border/70 shadow-none bg-card flex flex-col justify-between">
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
              className="h-8 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
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
                        <Avatar className="h-8 w-8 rounded-lg border border-border/60 bg-transparent text-xs font-semibold text-foreground shrink-0">
                          <AvatarFallback className="rounded-lg bg-transparent text-foreground">
                            {initial}
                          </AvatarFallback>
                        </Avatar>

                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#8b5e3c] dark:text-[#d49b6a]">
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
                          Rp {Number(b.total_price || 0).toLocaleString("id-ID")}
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-medium uppercase px-1.5 py-0",
                            b.status === "completed"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                              : b.status === "confirmed"
                              ? "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20"
                              : b.status === "canceled"
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                          )}
                        >
                          {b.status || "pending"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-muted-foreground">
                {isEn ? "No bookings in database yet." : "Belum ada data pemesanan di database."}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Real Therapist Roster (5 cols) */}
        <Card className="lg:col-span-5 border border-border/70 shadow-none bg-card flex flex-col justify-between">
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
              className="h-8 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
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
                        <Avatar className="h-7 w-7 rounded-full border border-border/50 text-xs font-semibold shrink-0">
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

                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 gap-1 shrink-0",
                          t.status === "available"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                            : t.status === "on_duty"
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                            : "bg-muted text-muted-foreground border-border"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            t.status === "available"
                              ? "bg-emerald-500"
                              : t.status === "on_duty"
                              ? "bg-amber-500 animate-pulse"
                              : "bg-muted-foreground"
                          )}
                        />
                        <span>
                          {t.status === "available"
                            ? isEn ? "Available" : "Siap"
                            : t.status === "on_duty"
                            ? isEn ? "On Duty" : "Bertugas"
                            : isEn ? "Off Duty" : "Libur"}
                        </span>
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-muted-foreground">
                {isEn ? "No therapists registered yet." : "Belum ada terapis terdaftar."}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* 5. Recent Client Reviews & Feedback Highlight */}
      {reviews.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="border border-border/70 shadow-none bg-card">
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
                className="h-8 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
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
                      className="p-3.5 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors space-y-2 flex flex-col justify-between text-xs"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground truncate max-w-[140px]">
                            {rev.customer_name || "Pelanggan"}
                          </span>
                          <div className="flex items-center gap-0.5 text-amber-500 text-[10px]">
                            {[...Array(rating)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-amber-500 text-amber-500" />
                            ))}
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 italic">
                          &ldquo;{rev.comment || (isEn ? "Very satisfied with the service." : "Pijatan sangat enak dan terapis ramah.")}&rdquo;
                        </p>
                      </div>

                      <div className="text-[10px] text-muted-foreground/70 flex items-center justify-between pt-1 border-t border-border/30">
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
    </motion.div>
  );
};
