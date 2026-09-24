"use client";

import * as React from "react";
import {
  useRecordContext,
  useTranslate,
  useLocaleState,
  useCreate,
  useNotify,
  useRedirect,
  LinkBase,
} from "ra-core";
import { format } from "date-fns";
import { id as idLocale, enUS as enLocale } from "date-fns/locale";
import { useSearchParams } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { Show } from "@/components/show";
import { DateRangePicker } from "@/components/date-range-picker";
import {
  PayoutSlipCard,
  type PayoutSlipData,
  type BookingBreakdownItem,
} from "@/components/payout-slip-card";
import { calculateBookingFinancials } from "@/lib/financial-calculator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Skeleton,
  FormSkeleton,
  DocumentSlipSkeleton,
} from "@/components/ui/skeleton";
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
  Wallet,
  Calendar as CalendarIcon,
  Building,
  CreditCard,
  User,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ReceiptText,
  Clock,
  Printer,
  Copy,
  Plus,
  RefreshCw,
  Percent,
  Check,
  CalendarDays,
  Banknote,
  DollarSign,
  TrendingDown,
  TrendingUp,
  FileCheck2,
  ChevronDown,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { formatIDR } from "@/lib/utils";

/**
 * Formats a Date object to YYYY-MM-DD string in local time
 */
const formatDateToLocalISO = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getParamFromLocation = (paramName: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    const hash = window.location.hash || "";
    const hashQIdx = hash.indexOf("?");
    if (hashQIdx !== -1) {
      const sp = new URLSearchParams(hash.substring(hashQIdx));
      const val = sp.get(paramName);
      if (val) return val;
    }
    const sp = new URLSearchParams(window.location.search);
    return sp.get(paramName);
  } catch {
    return null;
  }
};

/**
 * Redesigned Clean Payout Generator & Create View
 */
export const PayoutCreate = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const dateFnsLocale = isEn ? enLocale : idLocale;

  const [therapists, setTherapists] = React.useState<any[]>([]);
  const [loadingTherapists, setLoadingTherapists] = React.useState(true);
  const [selectedTherapistId, setSelectedTherapistId] = React.useState<string>(
    () => getParamFromLocation("therapist_id") || ""
  );
  const [selectedTherapist, setSelectedTherapist] = React.useState<any>(null);

  React.useEffect(() => {
    const handleUrlChange = () => {
      const tid = getParamFromLocation("therapist_id");
      if (tid) {
        setSelectedTherapistId(tid);
      }
    };
    handleUrlChange();
    window.addEventListener("hashchange", handleUrlChange);
    return () => window.removeEventListener("hashchange", handleUrlChange);
  }, []);

  // Period state: default to today
  const today = new Date();
  const [startDate, setStartDate] = React.useState<string>(
    formatDateToLocalISO(today)
  );
  const [endDate, setEndDate] = React.useState<string>(
    formatDateToLocalISO(today)
  );

  // Calculation & Form State
  const [bookings, setBookings] = React.useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = React.useState<boolean>(false);
  const [alreadySettledCount, setAlreadySettledCount] = React.useState<number>(0);
  const [bonusAmount, setBonusAmount] = React.useState<number>(0);
  const [deductionAmount, setDeductionAmount] = React.useState<number>(0);
  const [paymentStatus, setPaymentStatus] = React.useState<string>("paid");
  const [paymentDate, setPaymentDate] = React.useState<string>(
    formatDateToLocalISO(today)
  );
  const [paymentDateOpen, setPaymentDateOpen] = React.useState(false);
  const [notes, setNotes] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  const [create] = useCreate();
  const notify = useNotify();
  const redirect = useRedirect();

  // Load therapists list
  React.useEffect(() => {
    async function fetchTherapists() {
      try {
        setLoadingTherapists(true);
        const { data, error } = await supabase
          .from("therapists")
          .select("*")
          .order("name", { ascending: true });

        if (error) {
          console.error("Error loading therapists:", error);
          return;
        }

        if (data && data.length > 0) {
          setTherapists(data);
          const targetId = getParamFromLocation("therapist_id") || selectedTherapistId;
          if (targetId) {
            const found = data.find(
              (t) => String(t.id) === String(targetId)
            );
            if (found) {
              setSelectedTherapist(found);
              setSelectedTherapistId(String(found.id));
              return;
            }
          }
          if (data[0]) {
            setSelectedTherapist(data[0]);
            setSelectedTherapistId(String(data[0].id));
          }
        }
      } finally {
        setLoadingTherapists(false);
      }
    }
    fetchTherapists();
  }, []);

  // Handle therapist dropdown change
  const handleTherapistSelect = (id: string | null) => {
    if (!id) return;
    setSelectedTherapistId(id);
    const found = therapists.find((item) => String(item.id) === String(id));
    setSelectedTherapist(found || null);
  };

  // Fetch bookings for therapist in date range with invoice & promo sync, excluding already-settled bookings
  const fetchEligibleBookings = React.useCallback(async () => {
    if (!selectedTherapistId || !startDate || !endDate) return;

    try {
      setLoadingBookings(true);

      // 1. Fetch existing payouts for this therapist to prevent double payout
      const { data: existingPayouts } = await supabase
        .from("therapist_payouts")
        .select("id, payout_number, period_start, period_end, payment_status, bookings_breakdown")
        .eq("therapist_id", selectedTherapistId);

      const paidBookingIds = new Set<number>();

      if (existingPayouts && existingPayouts.length > 0) {
        for (const p of existingPayouts) {
          if (Array.isArray(p.bookings_breakdown) && p.bookings_breakdown.length > 0) {
            for (const item of p.bookings_breakdown) {
              if (item?.id) paidBookingIds.add(Number(item.id));
            }
          } else if (p.period_start && p.period_end) {
            // Fallback if json column was not stored: check previous period bookings
            const { data: prevPeriodBookings } = await supabase
              .from("bookings")
              .select("id")
              .eq("therapist_id", selectedTherapistId)
              .gte("booking_date", p.period_start)
              .lte("booking_date", p.period_end)
              .in("status", ["confirmed", "completed"]);

            if (prevPeriodBookings) {
              for (const pb of prevPeriodBookings) {
                paidBookingIds.add(Number(pb.id));
              }
            }
          }
        }
      }

      // 2. Fetch raw bookings in current requested date range
      const { data: bData, error } = await supabase
        .from("bookings")
        .select(
          "id, booking_date, booking_time, total_price, status, payment_status, service_id, services(name, price, consumables_cost), customers(full_name)"
        )
        .eq("therapist_id", selectedTherapistId)
        .gte("booking_date", startDate)
        .lte("booking_date", endDate)
        .in("status", ["confirmed", "completed"])
        .order("booking_date", { ascending: false });

      if (error) {
        console.error("Fetch bookings error:", error);
        return;
      }

      const allActive = bData || [];
      // Filter out bookings that were already settled in a previous payout
      const activeBookings = allActive.filter((b) => !paidBookingIds.has(Number(b.id)));
      setAlreadySettledCount(allActive.length - activeBookings.length);

      const bookingIds = activeBookings.map((b) => b.id);

      // 3. Fetch corresponding invoices if any
      let invoicesData: any[] = [];
      if (bookingIds.length > 0) {
        const { data: invData } = await supabase
          .from("invoices")
          .select("*")
          .in("booking_id", bookingIds);
        invoicesData = invData || [];
      }

      // 4. Fetch promotions to know deduct_from_therapist_commission policy
      const { data: promosData } = await supabase
        .from("promotions")
        .select("*");

      const commRate = Number(selectedTherapist?.commission_rate || 60);

      // 5. Compute unified financial items for each eligible booking
      const computedList = activeBookings.map((b: any) => {
        const matchedInv = invoicesData.find(
          (inv: any) => Number(inv.booking_id) === Number(b.id)
        );

        const fin = calculateBookingFinancials({
          bookingPrice: Number(b.total_price || b.services?.price || 0),
          servicePrice: Number(b.services?.price || 0),
          consumablesCost: Number(b.services?.consumables_cost || 0),
          commissionRate: commRate,
          invoice: matchedInv,
          promotions: promosData,
        });

        return {
          ...b,
          financial: fin,
        };
      });

      setBookings(computedList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBookings(false);
    }
  }, [selectedTherapistId, startDate, endDate, selectedTherapist]);

  React.useEffect(() => {
    fetchEligibleBookings();
  }, [fetchEligibleBookings]);

  // Financial calculations using synchronized financial breakdown
  const totalBookingsCount = bookings.length;
  const grossRevenue = bookings.reduce(
    (sum, b) => sum + Number(b.financial?.treatmentGrossPrice ?? b.total_price ?? 0),
    0
  );
  const commissionRate = Number(selectedTherapist?.commission_rate || 60);
  const therapistCommissionFee = bookings.reduce(
    (sum, b) =>
      sum +
      Number(
        b.financial?.therapistFee ??
          Math.round(((Number(b.total_price || 0)) * commissionRate) / 100)
      ),
    0
  );
  const companyShare = Math.max(0, grossRevenue - therapistCommissionFee);
  const netDisbursementAmount = Math.max(
    0,
    therapistCommissionFee + Number(bonusAmount || 0) - Number(deductionAmount || 0)
  );

  // Live Slip Data Object
  const previewPayout: PayoutSlipData = {
    payout_number: "PREVIEW-SLIP",
    therapist_id: selectedTherapist?.id,
    therapist_name: selectedTherapist?.name || (isEn ? "Select Therapist" : "Pilih Terapis"),
    period_type: "custom",
    period_start: startDate,
    period_end: endDate,
    total_bookings: totalBookingsCount,
    gross_amount: grossRevenue,
    commission_rate: commissionRate,
    therapist_fee: therapistCommissionFee,
    company_fee: companyShare,
    bonus_amount: Number(bonusAmount || 0),
    deduction_amount: Number(deductionAmount || 0),
    net_amount: netDisbursementAmount,
    bank_name: selectedTherapist?.bank_name || "BCA",
    bank_account_number: selectedTherapist?.bank_account_number || "-",
    bank_account_name: selectedTherapist?.bank_account_name || selectedTherapist?.name || "-",
    payment_status: paymentStatus,
    payment_date: paymentDate,
    notes: notes,
    bookings_breakdown: bookings.map((b) => ({
      id: b.id,
      booking_date: b.booking_date,
      booking_time: b.booking_time,
      customer_name: b.customers?.full_name || "Pelanggan",
      service_name: b.services?.name || "Treatment",
      total_price: b.financial?.treatmentGrossPrice ?? Number(b.total_price || 0),
      discount_amount: b.financial?.discountAmount ?? 0,
      applied_promo_name: b.financial?.appliedPromoName,
      is_post_discount: b.financial?.isPostDiscountPolicy,
      commission_base: b.financial?.commissionBase ?? Number(b.total_price || 0),
      therapist_fee: b.financial?.therapistFee ?? Math.round((Number(b.total_price || 0) * commissionRate) / 100),
      invoice_number: b.financial?.invoiceNumber,
    })),
  };

  // Handle Save / Submit Payout
  const handleCreatePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTherapist) {
      toast.error(isEn ? "Please select a therapist first" : "Silakan pilih terapis terlebih dahulu");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        therapist_id: selectedTherapist.id,
        therapist_name: selectedTherapist.name,
        period_type: startDate === endDate ? "daily" : "custom",
        period_start: startDate,
        period_end: endDate,
        total_bookings: totalBookingsCount,
        gross_amount: grossRevenue,
        commission_rate: commissionRate,
        therapist_fee: therapistCommissionFee,
        company_fee: companyShare,
        bonus_amount: Number(bonusAmount || 0),
        deduction_amount: Number(deductionAmount || 0),
        net_amount: netDisbursementAmount,
        bank_name: selectedTherapist.bank_name || "BCA",
        bank_account_number: selectedTherapist.bank_account_number || "",
        bank_account_name: selectedTherapist.bank_account_name || selectedTherapist.name || "",
        payment_status: paymentStatus,
        payment_date: paymentDate,
        notes: notes,
        bookings_breakdown: previewPayout.bookings_breakdown,
      };

      await create(
        "payouts",
        { data: payload },
        {
          onSuccess: (res: any) => {
            notify(isEn ? "Payout slip generated successfully" : "Slip bagi hasil berhasil disimpan!", {
              type: "success",
            });
            const createdId = res?.id || res?.data?.id;
            if (createdId) {
              redirect("show", "payouts", createdId);
            } else {
              redirect("/therapists");
            }
          },
          onError: (err: any) => {
            console.error("Payout creation failed:", err);
            notify(err?.message || (isEn ? "Failed to create payout" : "Gagal menyimpan slip bagi hasil"), {
              type: "error",
            });
          },
        }
      );
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error submitting payout");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingTherapists) {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in-50 duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-3.5 w-80 max-w-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-28 rounded-md" />
            <Skeleton className="h-9 w-36 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 space-y-5">
            <div className="rounded-xl border border-border/80 bg-card p-5 space-y-4 shadow-2xs">
              <FormSkeleton fields={4} columns={1} />
            </div>
            <div className="rounded-xl border border-border/80 bg-card p-5 space-y-4 shadow-2xs">
              <FormSkeleton fields={3} columns={2} />
            </div>
          </div>
          <div className="lg:col-span-7">
            <DocumentSlipSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Submenu Breadcrumb: Dashboard > Therapists > [Therapist Name] > Make Payout */}
      <Breadcrumb>
        <Breadcrumb.Item>
          <LinkBase to="/">{isEn ? "Dashboard" : "Beranda"}</LinkBase>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <LinkBase to="/therapists">{isEn ? "Therapists" : "Terapis"}</LinkBase>
        </Breadcrumb.Item>
        {selectedTherapist && (
          <Breadcrumb.Item>
            <LinkBase to={`/therapists/${selectedTherapist.id}/show`}>
              {selectedTherapist.name}
            </LinkBase>
          </Breadcrumb.Item>
        )}
        <Breadcrumb.PageItem>
          {isEn ? "Make Payout" : "Rekap Bagi Hasil"}
        </Breadcrumb.PageItem>
      </Breadcrumb>

      {/* Page Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <LinkBase to="/therapists">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </LinkBase>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <span>{isEn ? "Therapist Payout & Commission Recap" : "Rekap Bagi Hasil & Komisi Terapis"}</span>
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1 ml-10">
            {isEn
              ? "Calculate earnings, manage bonuses/deductions, and generate digital payout slips."
              : "Hitung otomatis omset per booking, fee komisi bagi hasil, dan buat slip pembayaran digital."}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
          <LinkBase to="/therapists">
            <Button variant="outline" size="sm" className="h-9 text-xs shadow-none">
              {isEn ? "Back to Therapists" : "Kembali ke Data Terapis"}
            </Button>
          </LinkBase>
          <Button
            type="button"
            size="sm"
            onClick={handleCreatePayout}
            disabled={isSubmitting || loadingBookings || !selectedTherapist}
            className="h-9 text-xs gap-1.5 font-medium shadow-xs cursor-pointer"
          >
            {isSubmitting ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileCheck2 className="h-3.5 w-3.5" />
            )}
            <span>{isSubmitting ? (isEn ? "Saving..." : "Menyimpan...") : (isEn ? "Save & Issue Payout" : "Simpan Slip Bagi Hasil")}</span>
          </Button>
        </div>
      </div>

      {/* Two Column Layout: Left Form (5 cols) & Right Preview (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form & Parameter Setup */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card 1: Therapist & Period Selector */}
          <Card className="border border-border/80 bg-card shadow-2xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-primary" />
                <span>{isEn ? "1. Therapist & Time Period" : "1. Pilih Terapis & Rentang Periode"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              {/* Therapist Dropdown with Clear Full Names */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>{isEn ? "Therapist" : "Nama Terapis"}</span>
                  {selectedTherapist && (
                    <span className="text-[11px] font-normal text-muted-foreground">
                      Komisi: <strong className="text-foreground">{selectedTherapist.commission_rate ?? 60}%</strong>
                    </span>
                  )}
                </Label>
                <SearchableCombobox
                  options={therapists.map((t) => ({
                    value: String(t.id),
                    label: `${t.name} (Komisi ${t.commission_rate ?? 60}%)`,
                  }))}
                  value={selectedTherapistId}
                  placeholder={isEn ? "Select therapist..." : "Pilih nama terapis..."}
                  searchPlaceholder={isEn ? "Search therapist name..." : "Cari nama terapis..."}
                  onValueChange={handleTherapistSelect}
                />
              </div>

              {/* Date Range Picker with Shadcn Calendar */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>{isEn ? "Recap Date Range" : "Rentang Tanggal Rekap"}</span>
                  <span className="text-[11px] font-normal text-muted-foreground">
                    {loadingBookings ? (
                      <span className="inline-flex items-center gap-1 text-primary">
                        <RefreshCw className="h-2.5 w-2.5 animate-spin" /> {isEn ? "Fetching..." : "Memuat..."}
                      </span>
                    ) : (
                      <span>{totalBookingsCount} {isEn ? "Completed Orders" : "Order Selesai"}</span>
                    )}
                  </span>
                </Label>
                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  locale={locale}
                  onChange={({ startDate: s, endDate: e }) => {
                    setStartDate(s);
                    setEndDate(e);
                  }}
                />
                {alreadySettledCount > 0 && (
                  <Alert className="rounded-none border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 py-2 px-2.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <AlertDescription className="text-[11px] text-amber-900 dark:text-amber-200 leading-normal font-medium">
                      {isEn
                        ? `${alreadySettledCount} order(s) in this date range were already paid in previous payout slips and excluded automatically to prevent double payment.`
                        : `${alreadySettledCount} pesanan pada rentang ini sudah pernah dibayarkan pada slip payout sebelumnya dan otomatis dilewati agar tidak terjadi duplikasi.`}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Therapist Selected Mini Badge */}
              {selectedTherapist && (
                <div className="p-2.5 rounded-lg border border-border/60 bg-muted/40 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-foreground">{selectedTherapist.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Rek: {selectedTherapist.bank_name || "BCA"} - {selectedTherapist.bank_account_number || "Belum ada"} (a.n {selectedTherapist.bank_account_name || selectedTherapist.name})
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[11px] font-medium bg-background">
                    {selectedTherapist.commission_rate ?? 60}% Bagi Hasil
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Financial Adjustments (Bonus & Potongan) */}
          <Card className="border border-border/80 bg-card shadow-2xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5 text-primary" />
                <span>{isEn ? "2. Bonus, Deductions & Status" : "2. Penyesuaian Bonus & Potongan"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Bonus */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-muted-foreground" />
                    <span>{isEn ? "Bonus / Tips (Rp)" : "Bonus / Insentif (Rp)"}</span>
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step={5000}
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="h-9 text-xs font-medium bg-background"
                  />
                </div>

                {/* Deductions */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <TrendingDown className="w-3 h-3 text-muted-foreground" />
                    <span>{isEn ? "Deduction (Rp)" : "Potongan Kasbon/Lain (Rp)"}</span>
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step={5000}
                    value={deductionAmount}
                    onChange={(e) => setDeductionAmount(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="h-9 text-xs font-medium bg-background"
                  />
                </div>
              </div>

              {/* Payment Date & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Disbursement Date using Shadcn Popover DatePicker */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    {isEn ? "Disbursement Date" : "Tanggal Transfer / Bayar"}
                  </Label>
                  <Popover open={paymentDateOpen} onOpenChange={setPaymentDateOpen}>
                    <PopoverTrigger
                      render={
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-between text-left font-normal h-9 text-xs border-input shadow-2xs hover:bg-accent/50",
                            !paymentDate && "text-muted-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate font-medium text-foreground">
                              {paymentDate
                                ? format(new Date(paymentDate), "dd MMM yyyy", { locale: dateFnsLocale })
                                : (isEn ? "Pick a date" : "Pilih tanggal")}
                            </span>
                          </div>
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-60" />
                        </Button>
                      }
                    />
                    <PopoverContent className="w-auto p-0 border border-border shadow-md" align="start">
                      <Calendar
                        mode="single"
                        selected={paymentDate ? new Date(paymentDate) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setPaymentDate(format(date, "yyyy-MM-dd"));
                            setPaymentDateOpen(false);
                          }
                        }}
                        locale={dateFnsLocale}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Clean Neutral Payment Status Select */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    {isEn ? "Payment Status" : "Status Pembayaran"}
                  </Label>
                  {(() => {
                    const statusItems = [
                      { value: "paid", label: isEn ? "Paid / Disbursed" : "Sudah Ditransfer (Paid)" },
                      { value: "pending", label: isEn ? "Pending" : "Menunggu Transfer (Pending)" },
                    ];
                    return (
                      <Select
                        items={statusItems}
                        value={paymentStatus}
                        onValueChange={(val) => {
                          if (val) setPaymentStatus(val);
                        }}
                      >
                        <SelectTrigger className="w-full h-8 text-xs bg-background">
                          <SelectValue placeholder={isEn ? "Select status..." : "Pilih status..."}>
                            {(val) => {
                              const item = statusItems.find((s) => s.value === val);
                              if (!item) return isEn ? "Select status..." : "Pilih status...";
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
                            {statusItems.map((item) => (
                              <SelectItem key={item.value} value={item.value} className="text-xs py-1 px-2 flex items-center gap-1.5">
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
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  {isEn ? "Internal Accounting Notes" : "Catatan Rekap / Slip (Opsional)"}
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isEn ? "e.g. Regular monthly payout with performance bonus" : "Contoh: Rekap bagi hasil treatment reguler + bonus kehadiran"}
                  rows={2}
                  className="text-xs resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Live Quick Calculation Summary */}
          <Card className="border border-border/80 bg-muted/20 shadow-2xs">
            <CardContent className="pt-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>{isEn ? "Total Completed Bookings" : "Total Booking Selesai"}</span>
                <span className="font-semibold text-foreground">{totalBookingsCount} Order</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>{isEn ? "Gross Treatment Revenue" : "Total Nilai Omzet Kotor"}</span>
                <span className="font-medium text-foreground">{formatIDR(grossRevenue)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>{isEn ? "Therapist Fee" : `Bagi Hasil Terapis (${commissionRate}%)`}</span>
                <span className="font-semibold text-foreground">{formatIDR(therapistCommissionFee)}</span>
              </div>
              {(bonusAmount > 0 || deductionAmount > 0) && (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>{isEn ? "Bonus / Deductions" : "Bonus / Penyesuaian"}</span>
                  <span className="font-medium text-foreground">
                    {bonusAmount >= deductionAmount ? "+" : ""}{formatIDR(bonusAmount - deductionAmount)}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-between pt-1">
                <span className="font-bold text-foreground text-xs uppercase tracking-wider">
                  {isEn ? "Net Payout Transfer" : "Total Bersih Diterima Terapis"}
                </span>
                <span className="font-bold text-sm text-foreground">
                  {formatIDR(netDisbursementAmount)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Digital Payout Slip Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <ReceiptText className="w-4 h-4 text-primary" />
              <span>{isEn ? "Digital Payout Slip Preview" : "Pratinjau Slip Bagi Hasil"}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={fetchEligibleBookings}
              className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={cn("w-3 h-3", loadingBookings && "animate-spin")} />
              <span>{isEn ? "Refresh Data" : "Segarkan Booking"}</span>
            </Button>
          </div>

          {/* Payout Slip Card (Minimal 1px border matching action buttons) */}
          <PayoutSlipCard payout={previewPayout} showShareActions={false} borderless={false} />
        </div>
      </div>
    </div>
  );
};

/**
 * Show View for Stored Payout Record
 */
const PayoutShowContent = () => {
  const record = useRecordContext();
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  const [breakdown, setBreakdown] = React.useState<BookingBreakdownItem[]>(
    Array.isArray(record?.bookings_breakdown) ? record.bookings_breakdown : []
  );
  const [loadingBreakdown, setLoadingBreakdown] = React.useState(false);

  React.useEffect(() => {
    if (!record) return;

    if (Array.isArray(record.bookings_breakdown) && record.bookings_breakdown.length > 0) {
      setBreakdown(record.bookings_breakdown);
      return;
    }

    if (record.therapist_id && record.period_start && record.period_end) {
      const therapistId = record.therapist_id;
      const periodStart = record.period_start;
      const periodEnd = record.period_end;
      const commRate = Number(record.commission_rate || 60);

      let isMounted = true;
      setLoadingBreakdown(true);

      async function loadBreakdown() {
        try {
          const { data: bData, error } = await supabase
            .from("bookings")
            .select(
              "id, booking_date, booking_time, total_price, status, payment_status, service_id, services(name, price, consumables_cost), customers(full_name)"
            )
            .eq("therapist_id", therapistId)
            .gte("booking_date", periodStart)
            .lte("booking_date", periodEnd)
            .in("status", ["confirmed", "completed"])
            .order("booking_date", { ascending: false });

          if (error || !bData || !isMounted) return;

          const bookingIds = bData.map((b) => b.id);
          let invoicesData: any[] = [];
          if (bookingIds.length > 0) {
            const { data: invData } = await supabase
              .from("invoices")
              .select("*")
              .in("booking_id", bookingIds);
            invoicesData = invData || [];
          }

          const { data: promosData } = await supabase
            .from("promotions")
            .select("*");

          const computedItems: BookingBreakdownItem[] = bData.map((b: any) => {
            const matchedInv = invoicesData.find(
              (inv: any) => Number(inv.booking_id) === Number(b.id)
            );

            const fin = calculateBookingFinancials({
              bookingPrice: Number(b.total_price || b.services?.price || 0),
              servicePrice: Number(b.services?.price || 0),
              consumablesCost: Number(b.services?.consumables_cost || 0),
              commissionRate: commRate,
              invoice: matchedInv,
              promotions: promosData,
            });

            return {
              id: b.id,
              booking_date: b.booking_date,
              booking_time: b.booking_time,
              customer_name: b.customers?.full_name || "Pelanggan",
              service_name: b.services?.name || "Treatment",
              total_price: fin.treatmentGrossPrice ?? Number(b.total_price || 0),
              discount_amount: fin.discountAmount ?? 0,
              applied_promo_name: fin.appliedPromoName,
              is_post_discount: fin.isPostDiscountPolicy,
              commission_base: fin.commissionBase ?? Number(b.total_price || 0),
              therapist_fee:
                fin.therapistFee ??
                Math.round((Number(b.total_price || 0) * commRate) / 100),
              invoice_number: fin.invoiceNumber,
            };
          });

          if (isMounted) {
            setBreakdown(computedItems);
          }
        } catch (e) {
          console.error("Error loading payout breakdown:", e);
        } finally {
          if (isMounted) setLoadingBreakdown(false);
        }
      }

      loadBreakdown();

      return () => {
        isMounted = false;
      };
    }
  }, [record]);

  if (!record) return null;

  const enrichedPayout = {
    ...record,
    bookings_breakdown: breakdown,
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Submenu Breadcrumb for Show View */}
      <Breadcrumb>
        <Breadcrumb.Item>
          <LinkBase to="/">{isEn ? "Dashboard" : "Beranda"}</LinkBase>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <LinkBase to="/therapists">{isEn ? "Therapists" : "Terapis"}</LinkBase>
        </Breadcrumb.Item>
        {record.therapist_id && (
          <Breadcrumb.Item>
            <LinkBase to={`/therapists/${record.therapist_id}/show`}>
              {record.therapist_name || (isEn ? "Therapist Dossier" : "Data Terapis")}
            </LinkBase>
          </Breadcrumb.Item>
        )}
        <Breadcrumb.PageItem>
          {record.payout_number || (isEn ? "Payout Slip" : "Slip Bagi Hasil")}
        </Breadcrumb.PageItem>
      </Breadcrumb>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-3">
        <div className="flex items-center gap-2">
          <LinkBase to="/therapists">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </LinkBase>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {isEn ? "Payout Slip" : "Slip Bagi Hasil Terapis"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {record.payout_number} • {record.therapist_name}
            </p>
          </div>
        </div>

        <LinkBase to="/therapists">
          <Button variant="outline" size="sm" className="h-8 text-xs">
            {isEn ? "Back to Therapists" : "Kembali ke Terapis"}
          </Button>
        </LinkBase>
      </div>

      <div className="max-w-4xl mx-auto">
        <PayoutSlipCard payout={enrichedPayout as any} showShareActions={true} />
      </div>
    </div>
  );
};

export const PayoutShow = () => {
  return (
    <Show disableBreadcrumb>
      <PayoutShowContent />
    </Show>
  );
};
