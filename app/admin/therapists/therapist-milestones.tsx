"use client";

import * as React from "react";
import { useLocaleState, LinkBase, Translate } from "ra-core";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { formatIDR, standardizePhoneNumber } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbPage,
} from "@/components/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Award,
  TrendingUp,
  Wallet,
  Sparkles,
  Star,
  CheckCircle2,
  Users,
  Search,
  Download,
  ChevronRight,
  ReceiptText,
  UserCheck,
  Medal,
  Clock,
  Phone,
} from "lucide-react";

export type TimeFilter = "all" | "this_year" | "this_month" | "this_week" | "custom_month";

export interface TherapistMilestoneData {
  id: number;
  name: string;
  phone: string;
  photo_url?: string;
  nik?: string;
  status: string;
  commission_rate: number;
  joined_date?: string;
  rating?: number | null;
  // Computed milestone metrics
  completed_bookings: number;
  gross_revenue: number;
  therapist_earnings: number;
  average_rating: number | null;
  review_count: number;
  top_service?: string;
  tier: "master" | "gold" | "silver" | "bronze" | "rookie";
  recent_bookings: Array<{
    id: number;
    booking_date: string;
    booking_time: string;
    service_name: string;
    customer_name: string;
    total_price: number;
    therapist_share: number;
  }>;
}

export const TherapistMilestonesPage: React.FC = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const urlTherapistId = searchParams.get("therapist_id");

  const [timeFilter, setTimeFilter] = React.useState<TimeFilter>("all");
  const [selectedYear, setSelectedYear] = React.useState<string>(String(new Date().getFullYear()));
  const [selectedMonth, setSelectedMonth] = React.useState<string>(String(new Date().getMonth() + 1));
  const [activeTab, setActiveTab] = React.useState<string>(urlTherapistId ? "individual" : "leaderboard");
  const [focusedTherapistId, setFocusedTherapistId] = React.useState<number | null>(
    urlTherapistId ? Number(urlTherapistId) : null
  );
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const [loading, setLoading] = React.useState<boolean>(true);
  const [therapistsData, setTherapistsData] = React.useState<TherapistMilestoneData[]>([]);

  // Load and compute milestone metrics from Supabase
  const loadMilestoneMetrics = React.useCallback(async () => {
    try {
      setLoading(true);

      // 1. Fetch Therapists
      const { data: rawTherapists, error: thErr } = await supabase
        .from("therapists")
        .select("*")
        .order("name", { ascending: true });

      if (thErr) throw thErr;

      // 2. Fetch Completed Bookings & Booking Items
      const { data: rawBookings, error: bkErr } = await supabase
        .from("bookings")
        .select(`
          id,
          therapist_id,
          booking_date,
          booking_time,
          total_price,
          status,
          payment_status,
          service_id,
          created_at,
          customers (
            full_name
          ),
          services (
            name
          )
        `)
        .in("status", ["completed", "confirmed", "in_progress"]);

      if (bkErr) throw bkErr;

      // 2b. Fetch Booking Items snapshot (for multi-therapist support)
      const { data: rawBookingItems } = await supabase
        .from("booking_items")
        .select("*");

      // 3. Fetch Reviews
      const { data: rawReviews } = await supabase
        .from("reviews")
        .select("*");

      // Filter dates based on current timeFilter selection
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      const isDateInRange = (dateStr?: string) => {
        if (!dateStr) return true;
        if (timeFilter === "all") return true;

        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return true;

        if (timeFilter === "this_year") {
          return d.getFullYear() === currentYear;
        }
        if (timeFilter === "this_month") {
          return d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth;
        }
        if (timeFilter === "this_week") {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return d >= sevenDaysAgo && d <= now;
        }
        if (timeFilter === "custom_month") {
          return (
            d.getFullYear() === Number(selectedYear) &&
            d.getMonth() + 1 === Number(selectedMonth)
          );
        }
        return true;
      };

      // Aggregate metrics per therapist
      const computed: TherapistMilestoneData[] = (rawTherapists || []).map((th: any) => {
        const thId = th.id;
        const defaultRate = Number(th.commission_rate) || 60;

        // Match bookings directly or via booking_items
        const matchedBookings: any[] = [];

        (rawBookings || []).forEach((b: any) => {
          if (!isDateInRange(b.booking_date || b.created_at)) return;

          // Check direct assignment
          if (b.therapist_id === thId) {
            matchedBookings.push({
              id: b.id,
              booking_date: b.booking_date,
              booking_time: b.booking_time,
              service_name: b.services?.name || "Massage Service",
              customer_name: b.customers?.full_name || "Pelanggan",
              total_price: Number(b.total_price) || 0,
              therapist_share: (Number(b.total_price) * defaultRate) / 100,
            });
            return;
          }

          // Check multi-item assignment
          const matchedItem = (rawBookingItems || []).find(
            (bi: any) => bi.booking_id === b.id && bi.therapist_id === thId
          );
          if (matchedItem) {
            const itemPrice = Number(matchedItem.price) || 0;
            const itemRate = Number(matchedItem.commission_rate_snapshot) || defaultRate;
            matchedBookings.push({
              id: b.id,
              booking_date: b.booking_date,
              booking_time: b.booking_time,
              service_name: matchedItem.service_name_snapshot || b.services?.name || "Massage Service",
              customer_name: b.customers?.full_name || "Pelanggan",
              total_price: itemPrice,
              therapist_share: (itemPrice * itemRate) / 100,
            });
          }
        });

        // Compute sums
        const completedCount = matchedBookings.length;
        const grossRev = matchedBookings.reduce((sum, b) => sum + b.total_price, 0);
        const netEarnings = matchedBookings.reduce((sum, b) => sum + b.therapist_share, 0);

        // Find top service
        const serviceCounts: Record<string, number> = {};
        matchedBookings.forEach((b) => {
          const sName = b.service_name || "Massage";
          serviceCounts[sName] = (serviceCounts[sName] || 0) + 1;
        });
        const topService =
          Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

        // Rating calculation strictly from real reviews and database rating
        const thReviews = (rawReviews || []).filter(
          (r: any) =>
            r.therapist_id === thId ||
            (r.booking_id && matchedBookings.some((mb) => mb.id === r.booking_id))
        );
        let avgRating: number | null = null;
        if (thReviews.length > 0) {
          const rSum = thReviews.reduce((sum: number, r: any) => sum + (Number(r.rating) || 0), 0);
          avgRating = Number((rSum / thReviews.length).toFixed(1));
        } else if (th.rating != null && !isNaN(Number(th.rating)) && Number(th.rating) > 0) {
          avgRating = Number(Number(th.rating).toFixed(1));
        }

        // Determine Milestone Career Tier
        let tier: TherapistMilestoneData["tier"] = "rookie";
        if (completedCount >= 100) tier = "master";
        else if (completedCount >= 50) tier = "gold";
        else if (completedCount >= 20) tier = "silver";
        else if (completedCount >= 5) tier = "bronze";

        return {
          id: th.id,
          name: th.name || `Terapis #${th.id}`,
          phone: th.phone || "",
          photo_url: th.photo_url || "",
          nik: th.nik || "",
          status: th.status || "active",
          commission_rate: defaultRate,
          joined_date: th.joined_date || "",
          rating: avgRating,
          completed_bookings: completedCount,
          gross_revenue: grossRev,
          therapist_earnings: netEarnings,
          average_rating: avgRating,
          review_count: thReviews.length,
          top_service: topService,
          tier,
          recent_bookings: matchedBookings.slice(-10).reverse(),
        };
      });

      // Sort by completed bookings descending (leaderboard order)
      computed.sort((a, b) => b.completed_bookings - a.completed_bookings || b.gross_revenue - a.gross_revenue);

      setTherapistsData(computed);

      // Default focus first therapist if none selected
      if (!focusedTherapistId && computed.length > 0) {
        setFocusedTherapistId(urlTherapistId ? Number(urlTherapistId) : computed[0].id);
      }
    } catch (err) {
      console.error("Error calculating therapist milestone career metrics:", err);
    } finally {
      setLoading(false);
    }
  }, [timeFilter, selectedYear, selectedMonth, focusedTherapistId, urlTherapistId]);

  React.useEffect(() => {
    loadMilestoneMetrics();
  }, [loadMilestoneMetrics]);

  // Aggregate totals across all therapists
  const totalCompletedBookings = React.useMemo(
    () => therapistsData.reduce((sum, t) => sum + t.completed_bookings, 0),
    [therapistsData]
  );
  const totalGrossRevenue = React.useMemo(
    () => therapistsData.reduce((sum, t) => sum + t.gross_revenue, 0),
    [therapistsData]
  );
  const totalTherapistEarnings = React.useMemo(
    () => therapistsData.reduce((sum, t) => sum + t.therapist_earnings, 0),
    [therapistsData]
  );
  const topPerformer = therapistsData[0] || null;

  // Filtered list for search
  const filteredTherapists = React.useMemo(() => {
    if (!searchQuery.trim()) return therapistsData;
    const q = searchQuery.toLowerCase();
    return therapistsData.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.phone.toLowerCase().includes(q) ||
        (t.top_service && t.top_service.toLowerCase().includes(q))
    );
  }, [therapistsData, searchQuery]);

  const focusedTherapist = React.useMemo(
    () => therapistsData.find((t) => t.id === focusedTherapistId) || therapistsData[0] || null,
    [therapistsData, focusedTherapistId]
  );

  const getTierBadge = (tier: TherapistMilestoneData["tier"]) => {
    switch (tier) {
      case "master":
        return (
          <Badge className="bg-purple-600/15 text-purple-600 dark:text-purple-400 border-0 gap-1 font-semibold text-[11px] shadow-none">
            <Sparkles className="w-3 h-3 text-purple-500" />
            <span>{isEn ? "Master Sanctuary" : "Master Sanctuary"}</span>
          </Badge>
        );
      case "gold":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-0 gap-1 font-semibold text-[11px] shadow-none">
            <Medal className="w-3 h-3 text-amber-500" />
            <span>{isEn ? "Gold Elite" : "Gold Elite"}</span>
          </Badge>
        );
      case "silver":
        return (
          <Badge className="bg-slate-500/15 text-slate-700 dark:text-slate-300 border-0 gap-1 font-semibold text-[11px] shadow-none">
            <Award className="w-3 h-3 text-slate-400" />
            <span>{isEn ? "Silver Specialist" : "Silver Specialist"}</span>
          </Badge>
        );
      case "bronze":
        return (
          <Badge className="bg-amber-700/15 text-amber-800 dark:text-amber-300 border-0 gap-1 font-semibold text-[11px] shadow-none">
            <Award className="w-3 h-3 text-amber-700" />
            <span>{isEn ? "Bronze Star" : "Bronze Star"}</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="border-0 text-muted-foreground gap-1 text-[11px] shadow-none">
            <span>{isEn ? "Rising Talent" : "Terapis Baru"}</span>
          </Badge>
        );
    }
  };

  const exportCSV = () => {
    const headers = [
      "ID",
      "Nama Terapis",
      "No. WhatsApp",
      "Status",
      "Tier Karir",
      "Booking Selesai",
      "Gross Omzet (IDR)",
      "Komisi Terapis (IDR)",
      "Rating",
      "Layanan Terbanyak",
    ];
    const rows = therapistsData.map((t) => [
      t.id,
      `"${t.name}"`,
      `"${standardizePhoneNumber(t.phone)}"`,
      t.status,
      t.tier,
      t.completed_bookings,
      t.gross_revenue,
      t.therapist_earnings,
      t.average_rating != null ? t.average_rating.toFixed(1) : "-",
      `"${t.top_service || "-"}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `serenaraga_therapist_milestones_${timeFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 pb-16">
      {/* 1. Portal Breadcrumb to Top Header (Matching standard Therapists hierarchy) */}
      <Breadcrumb>
        <BreadcrumbItem>
          <LinkBase to="/">
            <Translate i18nKey="ra.page.dashboard">Home</Translate>
          </LinkBase>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <LinkBase to="/therapists">
            {isEn ? "Therapists" : "Terapis"}
          </LinkBase>
        </BreadcrumbItem>
        <BreadcrumbPage>
          {isEn ? "Career & Milestones" : "Milestone & Karir"}
        </BreadcrumbPage>
      </Breadcrumb>

      {/* 2. Top Page Title & Time Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 my-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {isEn ? "Therapist Milestones & Career" : "Milestone & Karir Terapis"}
          </h2>
        </div>

        {/* Time Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-lg border border-border p-0.5 bg-card shadow-xs text-xs">
            <Button
              type="button"
              variant={timeFilter === "all" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setTimeFilter("all")}
              className="h-8 text-xs px-3 font-medium cursor-pointer"
            >
              {isEn ? "All Time" : "Semua Waktu"}
            </Button>
            <Button
              type="button"
              variant={timeFilter === "this_year" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setTimeFilter("this_year")}
              className="h-8 text-xs px-3 font-medium cursor-pointer"
            >
              {isEn ? "This Year" : "Tahun Ini"}
            </Button>
            <Button
              type="button"
              variant={timeFilter === "this_month" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setTimeFilter("this_month")}
              className="h-8 text-xs px-3 font-medium cursor-pointer"
            >
              {isEn ? "This Month" : "Bulan Ini"}
            </Button>
            <Button
              type="button"
              variant={timeFilter === "this_week" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setTimeFilter("this_week")}
              className="h-8 text-xs px-3 font-medium cursor-pointer"
            >
              {isEn ? "7 Days" : "7 Hari"}
            </Button>
            <Button
              type="button"
              variant={timeFilter === "custom_month" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setTimeFilter("custom_month")}
              className="h-8 text-xs px-3 font-medium cursor-pointer"
            >
              {isEn ? "Custom" : "Pilih Bulan"}
            </Button>
          </div>

          {timeFilter === "custom_month" && (
            <div className="flex items-center gap-1.5">
              <Select
                value={selectedMonth}
                onValueChange={(val) => {
                  if (val) setSelectedMonth(val);
                }}
              >
                <SelectTrigger className="h-8 text-xs w-[110px] bg-card">
                  <SelectValue placeholder="Bulan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Januari</SelectItem>
                  <SelectItem value="2">Februari</SelectItem>
                  <SelectItem value="3">Maret</SelectItem>
                  <SelectItem value="4">April</SelectItem>
                  <SelectItem value="5">Mei</SelectItem>
                  <SelectItem value="6">Juni</SelectItem>
                  <SelectItem value="7">Juli</SelectItem>
                  <SelectItem value="8">Agustus</SelectItem>
                  <SelectItem value="9">September</SelectItem>
                  <SelectItem value="10">Oktober</SelectItem>
                  <SelectItem value="11">November</SelectItem>
                  <SelectItem value="12">Desember</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={selectedYear}
                onValueChange={(val) => {
                  if (val) setSelectedYear(val);
                }}
              >
                <SelectTrigger className="h-8 text-xs w-[90px] bg-card">
                  <SelectValue placeholder="Tahun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2027">2027</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={exportCSV}
            className="h-8 gap-1.5 text-xs shadow-none cursor-pointer border-border"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">{isEn ? "Export CSV" : "Ekspor CSV"}</span>
          </Button>
        </div>
      </div>

      {/* 3. Executive KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Completed Bookings */}
        <Card className="border border-border bg-card shadow-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                {isEn ? "Total Jobs Done" : "Total Booking Selesai"}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">
                  {loading ? <Skeleton className="h-7 w-16" /> : totalCompletedBookings}
                </span>
                <span className="text-xs text-muted-foreground font-medium">Order</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Gross Omzet Serena Raga */}
        <Card className="border border-border bg-card shadow-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                {isEn ? "Gross Omzet Generated" : "Omzet Kotor Dihasilkan"}
              </span>
              <div className="text-xl font-bold text-foreground">
                {loading ? <Skeleton className="h-7 w-28" /> : formatIDR(totalGrossRevenue)}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Total Net Therapist Payout */}
        <Card className="border border-border bg-card shadow-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                {isEn ? "Therapist Net Earnings" : "Total Komisi Terapis"}
              </span>
              <div className="text-xl font-bold text-primary">
                {loading ? <Skeleton className="h-7 w-28" /> : formatIDR(totalTherapistEarnings)}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Top Performer MVP */}
        <Card className="border border-border bg-card shadow-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1 min-w-0 pr-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                {isEn ? "Top Performer MVP" : "Terapis Teratas (MVP)"}
              </span>
              {loading ? (
                <Skeleton className="h-6 w-24" />
              ) : topPerformer ? (
                <div className="truncate">
                  <span className="text-sm font-bold text-foreground truncate block">
                    {topPerformer.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {topPerformer.completed_bookings} Order ({formatIDR(topPerformer.gross_revenue)})
                  </span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">-</span>
              )}
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Medal className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2 gap-4 flex-wrap">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="leaderboard" className="gap-2 text-xs cursor-pointer">
              <Award className="w-3.5 h-3.5" />
              <span>{isEn ? "Leaderboard & All Therapists" : "Leaderboard & Rekapan Semua"}</span>
            </TabsTrigger>
            <TabsTrigger value="individual" className="gap-2 text-xs cursor-pointer">
              <UserCheck className="w-3.5 h-3.5" />
              <span>{isEn ? "Individual Career Dossier" : "Rapor Karir Individual"}</span>
            </TabsTrigger>
          </TabsList>

          {/* Search Bar */}
          {activeTab === "leaderboard" && (
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isEn ? "Search therapist name or skill..." : "Cari nama terapis..."}
                className="w-full h-9 pl-8 pr-3 text-xs rounded-lg border border-border bg-card placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}
        </div>

        {/* TAB 1: LEADERBOARD & REKAPAN SEMUA */}
        <TabsContent value="leaderboard" className="m-0 space-y-3">
          <Card className="border border-border bg-card shadow-none">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : filteredTherapists.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-xs">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="font-semibold">{isEn ? "No therapist records found" : "Tidak ada data terapis yang sesuai"}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b border-border/80">
                        <TableHead className="w-12 text-center text-xs">#</TableHead>
                        <TableHead className="text-xs min-w-[200px]">{isEn ? "Therapist" : "Terapis"}</TableHead>
                        <TableHead className="text-xs text-center">{isEn ? "Career Tier" : "Level / Tier"}</TableHead>
                        <TableHead className="text-xs text-center">{isEn ? "Jobs Done" : "Order Selesai"}</TableHead>
                        <TableHead className="text-xs text-right">{isEn ? "Gross Omzet" : "Omzet Kotor"}</TableHead>
                        <TableHead className="text-xs text-right">{isEn ? "Therapist Share" : "Komisi Terapis"}</TableHead>
                        <TableHead className="text-xs text-center">{isEn ? "Rating" : "Rating ⭐"}</TableHead>
                        <TableHead className="text-xs text-right w-24">{isEn ? "Action" : "Aksi"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTherapists.map((th, index) => {
                        return (
                          <TableRow
                            key={th.id}
                            onClick={() => {
                              setFocusedTherapistId(th.id);
                              setActiveTab("individual");
                            }}
                            className="hover:bg-muted/40 cursor-pointer transition-colors"
                          >
                            <TableCell className="text-center text-xs font-bold">
                              {index === 0 ? (
                                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 inline-flex items-center justify-center text-xs">
                                  🥇
                                </span>
                              ) : index === 1 ? (
                                <span className="w-6 h-6 rounded-full bg-slate-500/20 text-slate-600 dark:text-slate-300 inline-flex items-center justify-center text-xs">
                                  🥈
                                </span>
                              ) : index === 2 ? (
                                <span className="w-6 h-6 rounded-full bg-amber-700/20 text-amber-800 dark:text-amber-400 inline-flex items-center justify-center text-xs">
                                  🥉
                                </span>
                              ) : (
                                <span className="text-muted-foreground">{index + 1}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 shrink-0 border border-border">
                                  <AvatarImage src={th.photo_url} alt={th.name} />
                                  <AvatarFallback className="text-xs font-bold">
                                    {th.name?.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <span className="font-bold text-xs text-foreground block truncate">
                                    {th.name}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground truncate block">
                                    {standardizePhoneNumber(th.phone) || th.phone || "-"}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {getTierBadge(th.tier)}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-foreground">
                                <span>{th.completed_bookings}</span>
                                <span className="text-[10px] text-muted-foreground font-normal">Job</span>
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground font-medium">
                              {formatIDR(th.gross_revenue)}
                            </TableCell>
                            <TableCell className="text-right text-xs font-bold text-primary">
                              {formatIDR(th.therapist_earnings)}
                            </TableCell>
                            <TableCell className="text-center">
                              {th.average_rating != null ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground">
                                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                                  <span>{th.average_rating.toFixed(1)}</span>
                                  {th.review_count > 0 && (
                                    <span className="text-[10px] text-muted-foreground font-normal">({th.review_count})</span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground font-normal">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFocusedTherapistId(th.id);
                                  setActiveTab("individual");
                                }}
                                className="h-7 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10 cursor-pointer"
                              >
                                <span>{isEn ? "View" : "Rapor"}</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: RAPOR & KARIR INDIVIDUAL */}
        <TabsContent value="individual" className="m-0 space-y-4">
          {/* Select Therapist Switcher */}
          <div className="flex items-center justify-between gap-3 bg-card p-3.5 rounded-xl border border-border flex-wrap">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-foreground">{isEn ? "Selected Therapist:" : "Pilih Terapis:"}</span>
            </div>
            <Select
              value={String(focusedTherapistId || "")}
              onValueChange={(val) => {
                if (val) setFocusedTherapistId(Number(val));
              }}
            >
              <SelectTrigger className="h-9 text-xs min-w-[260px] bg-background">
                <SelectValue placeholder="Pilih Terapis" />
              </SelectTrigger>
              <SelectContent>
                {therapistsData.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name} ({t.completed_bookings} Job - {formatIDR(t.therapist_earnings)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {focusedTherapist ? (
            <div className="space-y-4">
              {/* Therapist Highlight Profile Header */}
              <div className="p-5 rounded-xl border border-border bg-card flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 border-2 border-primary/20 shrink-0">
                    <AvatarImage src={focusedTherapist.photo_url} alt={focusedTherapist.name} />
                    <AvatarFallback className="text-base font-bold bg-primary/10 text-primary">
                      {focusedTherapist.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-foreground">{focusedTherapist.name}</h3>
                      {getTierBadge(focusedTherapist.tier)}
                      <Badge variant="outline" className="text-[10px]">
                        {focusedTherapist.status === "active" ? "Aktif" : "Non-Aktif"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        {standardizePhoneNumber(focusedTherapist.phone) || focusedTherapist.phone || "-"}
                      </span>
                      {focusedTherapist.nik && (
                        <span>NIK: {focusedTherapist.nik}</span>
                      )}
                      <span>
                        {isEn ? "Joined:" : "Bergabung:"} {focusedTherapist.joined_date || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-border pt-3 md:pt-0 md:pl-5">
                  <div className="text-center px-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-semibold">
                      {isEn ? "Commission Rate" : "Bagi Hasil"}
                    </span>
                    <span className="text-base font-bold text-foreground">
                      {focusedTherapist.commission_rate}%
                    </span>
                  </div>
                  <div className="text-center px-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-semibold">
                      {isEn ? "Average Rating" : "Rating"}
                    </span>
                    {focusedTherapist.average_rating != null ? (
                      <span className="text-base font-bold text-amber-500 inline-flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-500" />
                        {focusedTherapist.average_rating.toFixed(1)}
                        {focusedTherapist.review_count > 0 && (
                          <span className="text-xs text-muted-foreground font-normal">
                            ({focusedTherapist.review_count} {isEn ? "reviews" : "ulasan"})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground font-medium block mt-1">
                        {isEn ? "No reviews yet" : "Belum ada ulasan"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 3 Metric Cards for this Therapist */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border border-border bg-card shadow-none">
                  <CardContent className="p-4 space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      {isEn ? "Completed Bookings" : "Total Booking Dikerjakan"}
                    </span>
                    <div className="text-xl font-bold text-foreground">
                      {focusedTherapist.completed_bookings} <span className="text-xs font-normal text-muted-foreground">Order</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-border bg-card shadow-none">
                  <CardContent className="p-4 space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      {isEn ? "Gross Generated" : "Omzet Kotor Serena Raga"}
                    </span>
                    <div className="text-xl font-bold text-foreground">
                      {formatIDR(focusedTherapist.gross_revenue)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-border bg-card shadow-none">
                  <CardContent className="p-4 space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      {isEn ? "Therapist Net Share" : "Hak Komisi Terapis"}
                    </span>
                    <div className="text-xl font-bold text-primary">
                      {formatIDR(focusedTherapist.therapist_earnings)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Work History Table */}
              <Card className="border border-border bg-card shadow-none">
                <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>{isEn ? "Recent Completed Jobs (Latest 10)" : "Riwayat Booking Terakhir (10 Terakhir)"}</span>
                  </CardTitle>
                  <Badge variant="secondary" className="text-[10px]">
                    {focusedTherapist.recent_bookings.length} {isEn ? "Entries" : "Data"}
                  </Badge>
                </CardHeader>
                <CardContent className="p-0">
                  {focusedTherapist.recent_bookings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-xs">
                      <ReceiptText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p>{isEn ? "No completed jobs in this timeframe." : "Belum ada pesanan yang selesai pada periode ini."}</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="text-xs">{isEn ? "Date & Time" : "Tanggal & Jam"}</TableHead>
                            <TableHead className="text-xs">{isEn ? "Customer" : "Pelanggan"}</TableHead>
                            <TableHead className="text-xs">{isEn ? "Service" : "Layanan"}</TableHead>
                            <TableHead className="text-xs text-right">{isEn ? "Gross Price" : "Tarif Layanan"}</TableHead>
                            <TableHead className="text-xs text-right">{isEn ? "Therapist Share" : "Hak Terapis"}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {focusedTherapist.recent_bookings.map((b) => (
                            <TableRow key={b.id} className="hover:bg-muted/30">
                              <TableCell className="text-xs text-foreground">
                                {b.booking_date} {b.booking_time ? `• ${b.booking_time}` : ""}
                              </TableCell>
                              <TableCell className="text-xs font-medium text-foreground">
                                {b.customer_name}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {b.service_name}
                              </TableCell>
                              <TableCell className="text-xs text-right text-muted-foreground">
                                {formatIDR(b.total_price)}
                              </TableCell>
                              <TableCell className="text-xs text-right font-bold text-primary">
                                {formatIDR(b.therapist_share)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
};
