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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

/**
 * Redesigned Clean Payout Generator & Create View
 */
export const PayoutCreate = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const dateFnsLocale = isEn ? enLocale : idLocale;
  const searchParams = useSearchParams();
  const preSelectedTherapistId = searchParams.get("therapist_id");

  const [therapists, setTherapists] = React.useState<any[]>([]);
  const [loadingTherapists, setLoadingTherapists] = React.useState(true);
  const [selectedTherapistId, setSelectedTherapistId] = React.useState<string>(
    preSelectedTherapistId || ""
  );
  const [selectedTherapist, setSelectedTherapist] = React.useState<any>(null);

  // Period state: default to this month
  const today = new Date();
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const [startDate, setStartDate] = React.useState<string>(
    formatDateToLocalISO(defaultStart)
  );
  const [endDate, setEndDate] = React.useState<string>(
    formatDateToLocalISO(today)
  );

  // Calculation & Form State
  const [bookings, setBookings] = React.useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = React.useState<boolean>(false);
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
          if (preSelectedTherapistId) {
            const found = data.find(
              (t) => String(t.id) === String(preSelectedTherapistId)
            );
            if (found) {
              setSelectedTherapist(found);
              setSelectedTherapistId(String(found.id));
            }
          } else if (!selectedTherapistId) {
            setSelectedTherapist(data[0]);
            setSelectedTherapistId(String(data[0].id));
          }
        }
      } finally {
        setLoadingTherapists(false);
      }
    }
    fetchTherapists();
  }, [preSelectedTherapistId]);

  // Handle therapist dropdown change
  const handleTherapistSelect = (id: string | null) => {
    if (!id) return;
    setSelectedTherapistId(id);
    const found = therapists.find((item) => String(item.id) === String(id));
    setSelectedTherapist(found || null);
  };

  // Fetch bookings for therapist in date range
  const fetchEligibleBookings = React.useCallback(async () => {
    if (!selectedTherapistId || !startDate || !endDate) return;

    try {
      setLoadingBookings(true);
      const { data, error } = await supabase
        .from("bookings")
        .select(
          "id, booking_date, booking_time, total_price, status, payment_status, service_id, services(name), customers(full_name)"
        )
        .eq("therapist_id", selectedTherapistId)
        .gte("booking_date", startDate)
        .lte("booking_date", endDate)
        .in("status", ["confirmed", "completed"])
        .order("booking_date", { ascending: false });

      if (error) {
        console.error("Fetch bookings error:", error);
      } else {
        setBookings(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBookings(false);
    }
  }, [selectedTherapistId, startDate, endDate]);

  React.useEffect(() => {
    fetchEligibleBookings();
  }, [fetchEligibleBookings]);

  // Financial calculations
  const totalBookingsCount = bookings.length;
  const grossRevenue = bookings.reduce(
    (sum, b) => sum + Number(b.total_price || 0),
    0
  );
  const commissionRate = Number(selectedTherapist?.commission_rate || 60);
  const therapistCommissionFee = (grossRevenue * commissionRate) / 100;
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
      total_price: Number(b.total_price || 0),
      therapist_fee: (Number(b.total_price || 0) * commissionRate) / 100,
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
        bank_name: selectedTherapist.bank_name || "BCA",
        bank_account_number: selectedTherapist.bank_account_number || "",
        bank_account_name: selectedTherapist.bank_account_name || selectedTherapist.name || "",
        payment_status: paymentStatus,
        payment_date: paymentDate,
        notes: notes,
      };

      await create(
        "payouts",
        { data: payload },
        {
          onSuccess: (res: any) => {
            notify(isEn ? "Payout slip generated successfully" : "Slip bagi hasil berhasil disimpan!", {
              type: "success",
            });
            if (res?.data?.id) {
              redirect(`/payouts/${res.data.id}/show`);
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
                <Select
                  value={selectedTherapistId}
                  onValueChange={handleTherapistSelect}
                >
                  <SelectTrigger className="w-full h-10 text-xs">
                    <SelectValue placeholder={isEn ? "Select therapist..." : "Pilih terapis..."}>
                      {selectedTherapist ? (
                        <div className="flex items-center gap-2 text-left truncate">
                          <Avatar className="h-5 w-5 shrink-0 rounded-full border border-border">
                            <AvatarImage src={selectedTherapist.photo_url || ""} />
                            <AvatarFallback className="text-[9px] bg-muted font-bold">
                              {selectedTherapist.name?.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium truncate text-foreground">
                            {selectedTherapist.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground shrink-0">
                            ({selectedTherapist.commission_rate ?? 60}%)
                          </span>
                        </div>
                      ) : (
                        <span>{isEn ? "Select therapist..." : "Pilih nama terapis..."}</span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {therapists.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)} className="cursor-pointer py-2">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-6 w-6 shrink-0 rounded-full border border-border">
                            <AvatarImage src={t.photo_url || ""} />
                            <AvatarFallback className="text-[10px] bg-muted font-bold">
                              {t.name?.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col text-left">
                            <span className="font-semibold text-foreground text-xs leading-none">
                              {t.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">
                              Komisi: {t.commission_rate ?? 60}% • Bank: {t.bank_name || "BCA"} ({t.bank_account_number || "-"})
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <div className="grid grid-cols-2 gap-3">
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
                    className="h-9 text-xs font-medium"
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
                    className="h-9 text-xs font-medium"
                  />
                </div>
              </div>

              {/* Payment Date & Status */}
              <div className="grid grid-cols-2 gap-3">
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
                  <Select value={paymentStatus} onValueChange={(val) => val && setPaymentStatus(val)}>
                    <SelectTrigger className="w-full h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">
                        <span className="font-normal text-foreground">
                          {isEn ? "Paid / Disbursed" : "Sudah Ditransfer (Paid)"}
                        </span>
                      </SelectItem>
                      <SelectItem value="pending">
                        <span className="font-normal text-foreground">
                          {isEn ? "Pending" : "Menunggu Transfer (Pending)"}
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
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

          {/* Payout Slip Card */}
          <PayoutSlipCard payout={previewPayout} showShareActions={false} />
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

  if (!record) return null;

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
        <PayoutSlipCard payout={record as any} showShareActions={true} />
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
