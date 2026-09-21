"use client";

import * as React from "react";
import {
  useGetList,
  useLocaleState,
  useNotify,
  useRedirect,
  useCreate,
  useShowContext,
} from "ra-core";
import { List } from "@/components/list";
import { DataTable, DataTableCol } from "@/components/data-table";
import { NumberField } from "@/components/number-field";
import { BadgeField } from "@/components/badge-field";
import { Show } from "@/components/show";
import { ShowButton } from "@/components/show-button";
import { DeleteButton } from "@/components/delete-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InvoiceCard, type InvoiceData } from "@/components/invoice-card";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale/id";
import { enUS as localeEn } from "date-fns/locale/en-US";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ReceiptText,
  Sparkles,
  User,
  Calendar as CalendarIcon,
  CreditCard,
  CheckCircle2,
  Percent,
  Truck,
  FileText,
  Clock,
  X,
} from "lucide-react";

import { RowActions } from "@/components/row-actions";
import { cn, formatIDR } from "@/lib/utils";

/**
 * List view of all generated Invoices & Receipts
 */
export const InvoiceList = () => {
  return (
    <List>
      <DataTable>
        <DataTableCol
          source="invoice_number"
          cellClassName="text-xs font-semibold text-foreground"
        />
        <DataTableCol source="customer_name" />
        <DataTableCol source="service_name" />
        <DataTableCol source="booking_date" />
        <DataTableCol source="total_amount" cellClassName="text-xs font-semibold">
          <NumberField
            source="total_amount"
            options={{ style: "currency", currency: "IDR", maximumFractionDigits: 0 }}
          />
        </DataTableCol>
        <DataTableCol source="payment_method" />
        <DataTableCol source="payment_status">
          <BadgeField source="payment_status" />
        </DataTableCol>
        <DataTableCol label="ra.action.name" headerClassName="text-right w-16" cellClassName="text-right">
          <RowActions showEdit={false} />
        </DataTableCol>
      </DataTable>
    </List>
  );
};

/**
 * Shadcn Date Picker Component for POS Form
 */
const POSDatePicker: React.FC<{
  value?: string;
  onChange: (dateStr: string) => void;
  isEn: boolean;
}> = ({ value, onChange, isEn }) => {
  const [open, setOpen] = React.useState(false);
  const currentLocaleObj = isEn ? localeEn : localeId;

  const selectedDate = React.useMemo(() => {
    if (!value) return undefined;
    const parts = value.split("-");
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return isNaN(d.getTime()) ? undefined : d;
    }
    const d = new Date(value);
    return isNaN(d.getTime()) ? undefined : d;
  }, [value]);

  const formattedDisplay = selectedDate
    ? format(selectedDate, isEn ? "MMM dd, yyyy" : "dd MMMM yyyy", {
        locale: currentLocaleObj,
      })
    : isEn ? "Pick a date" : "Pilih tanggal layanan";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-9 px-3 text-xs bg-background border-input hover:bg-accent/40",
              !value && "text-muted-foreground"
            )}
          />
        }
      >
        <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-70" />
        <span className="truncate flex-1 font-medium">{formattedDisplay}</span>
        {value && (
          <span
            role="button"
            tabIndex={0}
            aria-label={isEn ? "Clear date" : "Hapus tanggal"}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onChange("");
            }}
            className="p-0.5 -mr-1 hover:bg-muted rounded text-muted-foreground opacity-60 hover:opacity-100 flex items-center justify-center shrink-0"
          >
            <X className="h-3 w-3" />
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-50 bg-popover border border-border shadow-md rounded-xl" align="start">
        <ShadcnCalendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (!date) {
              onChange("");
            } else {
              const y = date.getFullYear();
              const m = String(date.getMonth() + 1).padStart(2, "0");
              const d = String(date.getDate()).padStart(2, "0");
              onChange(`${y}-${m}-${d}`);
            }
            setOpen(false);
          }}
          locale={currentLocaleObj}
          defaultMonth={selectedDate || new Date()}
        />
      </PopoverContent>
    </Popover>
  );
};

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

/**
 * Shadcn Time Picker Component for POS Form
 */
const POSTimePicker: React.FC<{
  value?: string;
  onChange: (timeStr: string) => void;
  isEn: boolean;
}> = ({ value, onChange, isEn }) => {
  const [open, setOpen] = React.useState(false);
  const hourRef = React.useRef<HTMLDivElement>(null);
  const minRef = React.useRef<HTMLDivElement>(null);

  const { currentHour, currentMinute } = React.useMemo(() => {
    const val = value ? value.trim() : "";
    if (!val) return { currentHour: "", currentMinute: "" };
    const parts = val.split(":");
    return {
      currentHour: parts[0] ? parts[0].padStart(2, "0") : "",
      currentMinute: parts[1] ? parts[1].padStart(2, "0") : "00",
    };
  }, [value]);

  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        if (hourRef.current) {
          const sel = hourRef.current.querySelector<HTMLElement>('[data-selected="true"]');
          if (sel) {
            hourRef.current.scrollTop = sel.offsetTop - hourRef.current.clientHeight / 2 + sel.clientHeight / 2;
          }
        }
        if (minRef.current) {
          const sel = minRef.current.querySelector<HTMLElement>('[data-selected="true"]');
          if (sel) {
            minRef.current.scrollTop = sel.offsetTop - minRef.current.clientHeight / 2 + sel.clientHeight / 2;
          }
        }
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const formattedDisplay = value
    ? isEn
      ? value
      : `${value} WIB`
    : isEn ? "Pick a time" : "Pilih jam layanan";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-9 px-3 text-xs bg-background border-input hover:bg-accent/40",
              !value && "text-muted-foreground"
            )}
          />
        }
      >
        <Clock className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-70" />
        <span className="truncate flex-1 font-medium">{formattedDisplay}</span>
        {value && (
          <span
            role="button"
            tabIndex={0}
            aria-label={isEn ? "Clear time" : "Hapus jam"}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onChange("");
            }}
            className="p-0.5 -mr-1 hover:bg-muted rounded text-muted-foreground opacity-60 hover:opacity-100 flex items-center justify-center shrink-0"
          >
            <X className="h-3 w-3" />
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2 z-50 bg-popover border border-border shadow-md rounded-xl" align="start">
        <div className="grid grid-cols-2 divide-x divide-border text-center">
          <div className="pr-1">
            <div className="text-[11px] font-medium text-muted-foreground pb-1.5 border-b border-border/50">
              {isEn ? "Hour" : "Jam"}
            </div>
            <div
              ref={hourRef}
              className="h-44 overflow-y-auto pt-1 space-y-0.5 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {HOURS.map((h) => {
                const isSelected = currentHour === h;
                return (
                  <button
                    key={h}
                    type="button"
                    data-selected={isSelected}
                    onClick={() => {
                      const m = currentMinute || "00";
                      onChange(`${h}:${m}`);
                    }}
                    className={cn(
                      "w-full text-center py-1.5 text-xs rounded-md transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "hover:bg-accent hover:text-accent-foreground text-foreground"
                    )}
                  >
                    {h}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="pl-1">
            <div className="text-[11px] font-medium text-muted-foreground pb-1.5 border-b border-border/50">
              {isEn ? "Minute" : "Menit"}
            </div>
            <div
              ref={minRef}
              className="h-44 overflow-y-auto pt-1 space-y-0.5 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {MINUTES.map((m) => {
                const isSelected = currentMinute === m;
                return (
                  <button
                    key={m}
                    type="button"
                    data-selected={isSelected}
                    onClick={() => {
                      const h = currentHour || "10";
                      onChange(`${h}:${m}`);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full text-center py-1.5 text-xs rounded-md transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "hover:bg-accent hover:text-accent-foreground text-foreground"
                    )}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

/**
 * Minimalist & Clean POS Checkout / Invoice Creator
 */
export const InvoiceCreate = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const notify = useNotify();
  const redirect = useRedirect();
  const [create, { isPending }] = useCreate();

  // Load bookings, services, therapists, customers, and existing invoices
  const { data: bookings = [] } = useGetList("bookings", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "id", order: "DESC" },
  });
  const { data: invoices = [] } = useGetList("invoices", {
    pagination: { page: 1, perPage: 1000 },
  });
  const { data: services = [] } = useGetList("services", {
    pagination: { page: 1, perPage: 50 },
  });
  const { data: therapists = [] } = useGetList("therapists", {
    pagination: { page: 1, perPage: 50 },
  });
  const { data: customers = [] } = useGetList("customers", {
    pagination: { page: 1, perPage: 50 },
  });

  // Set of booking IDs that already have an invoice
  const invoicedBookingIds = React.useMemo(() => {
    const set = new Set<number>();
    invoices.forEach((inv) => {
      if (inv.booking_id) {
        set.add(Number(inv.booking_id));
      }
    });
    return set;
  }, [invoices]);

  // Invoice Number Generator: SR-YYMMDD-XXXX
  const defaultInvoiceNumber = React.useMemo(() => {
    const today = new Date();
    const yy = String(today.getFullYear()).slice(2);
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `SR-${yy}${mm}${dd}-${rand}`;
  }, []);

  const todayStr = React.useMemo(() => new Date().toISOString().split("T")[0], []);

  // Form State
  const [formData, setFormData] = React.useState<InvoiceData>({
    invoice_number: defaultInvoiceNumber,
    booking_id: null,
    customer_id: null,
    customer_name: "",
    customer_phone: "+62",
    service_id: null,
    service_name: "",
    therapist_id: null,
    therapist_name: "",
    booking_date: todayStr,
    booking_time: "10:00",
    service_address: "",
    subtotal: 185000,
    discount: 0,
    transport_fee: 0,
    total_amount: 185000,
    payment_method: "cash",
    payment_status: "paid",
    notes: "",
  });

  // Recalculate total amount when subtotal, discount, transport_fee change
  const updateTotal = (sub: number, disc: number, trans: number) => {
    const total = Math.max(0, sub + trans - disc);
    setFormData((prev) => ({
      ...prev,
      subtotal: sub,
      discount: disc,
      transport_fee: trans,
      total_amount: total,
    }));
  };

  // Only show bookings that do not have an invoice yet (or currently selected)
  const availableBookings = React.useMemo(() => {
    return bookings.filter(
      (b) => !invoicedBookingIds.has(Number(b.id)) || (formData.booking_id != null && b.id === formData.booking_id)
    );
  }, [bookings, invoicedBookingIds, formData.booking_id]);

  // Handle Booking Import
  const handleSelectBooking = (bookingIdStr: string | null) => {
    if (!bookingIdStr || bookingIdStr === "none") {
      setFormData((prev) => ({ ...prev, booking_id: null }));
      return;
    }

    const bId = Number(bookingIdStr);
    const booking = bookings.find((b) => b.id === bId);
    if (!booking) return;

    const cust = customers.find((c) => c.id === booking.customer_id);
    const srv = services.find((s) => s.id === booking.service_id);
    const thp = therapists.find((t) => t.id === booking.therapist_id);

    const sub = Number(booking.total_price || srv?.price || 185000);
    const disc = 0;
    const trans = 0;
    const total = sub;

    setFormData((prev) => ({
      ...prev,
      booking_id: booking.id,
      customer_id: booking.customer_id,
      customer_name: cust?.full_name || prev.customer_name || `Pelanggan #${booking.customer_id}`,
      customer_phone: cust?.phone || prev.customer_phone,
      service_id: booking.service_id,
      service_name: srv?.name || `Layanan #${booking.service_id}`,
      therapist_id: booking.therapist_id,
      therapist_name: thp?.name || "",
      booking_date: booking.booking_date || prev.booking_date,
      booking_time: booking.booking_time || prev.booking_time,
      service_address: booking.service_address || cust?.address || "",
      subtotal: sub,
      discount: disc,
      transport_fee: trans,
      total_amount: total,
      payment_method: booking.payment_method || "cash",
      payment_status: booking.payment_status || "paid",
      notes: booking.special_requests || "",
    }));

    toast.success(
      isEn
        ? `Imported data from Booking #${booking.id}`
        : `Data dari Booking #${booking.id} berhasil dimuat!`
    );
  };

  // Handle Service Selection
  const handleSelectService = (serviceIdStr: string | null) => {
    if (!serviceIdStr) return;
    const sId = Number(serviceIdStr);
    const srv = services.find((s) => s.id === sId);
    if (!srv) return;

    const sub = Number(srv.price || 0);
    setFormData((prev) => {
      const total = Math.max(0, sub + (prev.transport_fee || 0) - (prev.discount || 0));
      return {
        ...prev,
        service_id: srv.id,
        service_name: srv.name,
        subtotal: sub,
        total_amount: total,
      };
    });
  };

  // Handle Therapist Selection
  const handleSelectTherapist = (therapistIdStr: string | null) => {
    if (!therapistIdStr) return;
    const tId = Number(therapistIdStr);
    const thp = therapists.find((t) => t.id === tId);
    setFormData((prev) => ({
      ...prev,
      therapist_id: thp ? thp.id : null,
      therapist_name: thp ? thp.name : "",
    }));
  };

  // Handle Submit Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_name.trim()) {
      notify(isEn ? "Customer name is required" : "Nama pelanggan wajib diisi", {
        type: "error",
      });
      return;
    }

    if (!formData.service_name.trim()) {
      notify(isEn ? "Service description is required" : "Layanan wajib dipilih atau diisi", {
        type: "error",
      });
      return;
    }

    create(
      "invoices",
      { data: formData },
      {
        onSuccess: (data) => {
          notify(isEn ? "Invoice created successfully!" : "Nota berhasil diterbitkan!", {
            type: "success",
          });
          redirect("show", "invoices", data.id);
        },
        onError: (error: any) => {
          notify(error?.message || "Failed to create invoice", { type: "error" });
        },
      }
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {isEn ? "POS Checkout & Invoice" : "Kasir & Pembuatan Nota"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isEn
              ? "Create official receipts manually or auto-fill directly from active bookings."
              : "Buat nota resmi secara manual atau impor otomatis dari pemesanan pelanggan."}
          </p>
        </div>
      </div>

      {/* 2-Column Minimalist Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Clean POS Form (7 Cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-5">
          <div className="bg-card border border-border/70 rounded-xl p-5 sm:p-6 space-y-6">
            {/* 1. Quick Booking Autofill */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>{isEn ? "Auto-fill from Booking" : "Impor Otomatis dari Booking"}</span>
              </label>
              <Select onValueChange={handleSelectBooking}>
                <SelectTrigger className="w-full bg-background h-9 text-xs">
                  <SelectValue placeholder={isEn ? "— Choose a booking (Optional) —" : "— Pilih dari booking (Opsional) —"}>
                    {(value) => {
                      if (!value || value === "none") return isEn ? "— Choose a booking (Optional) —" : "— Pilih dari booking (Opsional) —";
                      const b = bookings.find((bk) => bk.id.toString() === value);
                      if (!b) return `Booking #${value}`;
                      const cust = customers.find((c) => c.id === b.customer_id);
                      return `Booking #${b.id} - ${cust?.full_name || "Pelanggan"} (${b.booking_date} • ${b.booking_time}) • ${formatIDR(b.total_price)}`;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover border border-border max-h-60">
                  <SelectItem value="none" className="text-xs text-muted-foreground">
                    {isEn ? "Manual entry (No booking)" : "Input Manual (Tanpa booking)"}
                  </SelectItem>
                  {availableBookings.length === 0 ? (
                    <div className="py-2.5 px-3 text-xs text-muted-foreground text-center italic">
                      {isEn ? "All active bookings have invoices" : "Semua pesanan aktif sudah dibuatkan invoice"}
                    </div>
                  ) : (
                    availableBookings.map((b) => {
                      const cust = customers.find((c) => c.id === b.customer_id);
                      return (
                        <SelectItem
                          key={b.id}
                          value={b.id.toString()}
                          className="text-xs"
                        >
                          <span className="font-semibold text-primary mr-1.5">#{b.id}</span>
                          <span className="mr-1 font-medium">{cust?.full_name || "Pelanggan"}</span>
                          <span className="text-muted-foreground truncate">
                            ({b.booking_date} • {b.booking_time}) • {formatIDR(b.total_price)}
                          </span>
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t border-border/50 pt-4 space-y-4">
              {/* 2. Client Details */}
              <div className="space-y-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  {isEn ? "Client Details" : "Data Pelanggan"}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      {isEn ? "Customer Name *" : "Nama Pelanggan *"}
                    </label>
                    <Input
                      value={formData.customer_name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, customer_name: e.target.value }))}
                      placeholder={isEn ? "e.g. Sarah Jenkins" : "Contoh: Budi Santoso"}
                      className="h-9 text-xs bg-background"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      {isEn ? "WhatsApp Number" : "Nomor WhatsApp"}
                    </label>
                    <Input
                      value={formData.customer_phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, customer_phone: e.target.value }))}
                      placeholder="+628123456789"
                      className="h-9 text-xs bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    {isEn ? "Service Address" : "Alamat Layanan"}
                  </label>
                  <Input
                    value={formData.service_address}
                    onChange={(e) => setFormData((prev) => ({ ...prev, service_address: e.target.value }))}
                    placeholder={isEn ? "Home address..." : "Alamat rumah pelanggan..."}
                    className="h-9 text-xs bg-background"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border/50 pt-4 space-y-4">
              {/* 3. Service & Schedule */}
              <div className="space-y-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  {isEn ? "Service & Schedule" : "Layanan & Jadwal"}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      {isEn ? "Select Service *" : "Pilih Layanan *"}
                    </label>
                    <Select
                      value={formData.service_id ? formData.service_id.toString() : ""}
                      onValueChange={handleSelectService}
                    >
                      <SelectTrigger className="w-full bg-background h-9 text-xs">
                        <SelectValue placeholder={isEn ? "Select service" : "Pilih layanan"}>
                          {(value) => {
                            if (!value) return formData.service_name || (isEn ? "Select service" : "Pilih layanan");
                            const s = services.find((srv) => srv.id.toString() === value);
                            if (!s) return formData.service_name || value;
                            return `${s.name} (${s.duration_minutes} mnt • ${formatIDR(s.price)})`;
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-popover border border-border">
                        {services.map((s) => (
                          <SelectItem
                            key={s.id}
                            value={s.id.toString()}
                            className="text-xs"
                          >
                            {s.name} ({s.duration_minutes} mnt • {formatIDR(s.price)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      {isEn ? "Assigned Therapist" : "Terapis"}
                    </label>
                    <Select
                      value={formData.therapist_id ? formData.therapist_id.toString() : ""}
                      onValueChange={handleSelectTherapist}
                    >
                      <SelectTrigger className="w-full bg-background h-9 text-xs">
                        <SelectValue placeholder={isEn ? "Select therapist" : "Pilih terapis"}>
                          {(value) => {
                            if (!value) return formData.therapist_name || (isEn ? "Select therapist" : "Pilih terapis");
                            const t = therapists.find((thp) => thp.id.toString() === value);
                            if (!t) return formData.therapist_name || value;
                            const statusLabel =
                              t.status === "available"
                                ? isEn ? "Available" : "Tersedia"
                                : t.status === "on_duty"
                                  ? isEn ? "On Duty" : "Bertugas"
                                  : isEn ? "Off Duty" : "Libur";
                            return `${t.name} (${statusLabel})`;
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-popover border border-border">
                        {therapists.map((t) => (
                          <SelectItem
                            key={t.id}
                            value={t.id.toString()}
                            className="text-xs"
                          >
                            {t.name} ({t.status === "available" ? (isEn ? "Available" : "Tersedia") : t.status === "on_duty" ? (isEn ? "On Duty" : "Bertugas") : (isEn ? "Off Duty" : "Libur")})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      {isEn ? "Service Date" : "Tanggal Layanan"}
                    </label>
                    <POSDatePicker
                      value={formData.booking_date}
                      onChange={(date) => setFormData((prev) => ({ ...prev, booking_date: date }))}
                      isEn={isEn}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      {isEn ? "Service Time" : "Jam Layanan"}
                    </label>
                    <POSTimePicker
                      value={formData.booking_time}
                      onChange={(time) => setFormData((prev) => ({ ...prev, booking_time: time }))}
                      isEn={isEn}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border/50 pt-4 space-y-4">
              {/* 4. Pricing & Payment */}
              <div className="space-y-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  {isEn ? "Pricing & Payment" : "Biaya & Pembayaran"}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      {isEn ? "Subtotal (Rp)" : "Subtotal (Rp)"}
                    </label>
                    <Input
                      type="number"
                      value={formData.subtotal}
                      onChange={(e) =>
                        updateTotal(
                          Number(e.target.value) || 0,
                          Number(formData.discount) || 0,
                          Number(formData.transport_fee) || 0
                        )
                      }
                      className="h-9 text-xs bg-background"
                      min={0}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      {isEn ? "Transport (Rp)" : "Transport (Rp)"}
                    </label>
                    <Input
                      type="number"
                      value={formData.transport_fee}
                      onChange={(e) =>
                        updateTotal(
                          Number(formData.subtotal) || 0,
                          Number(formData.discount) || 0,
                          Number(e.target.value) || 0
                        )
                      }
                      className="h-9 text-xs bg-background"
                      min={0}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      {isEn ? "Discount (Rp)" : "Diskon (Rp)"}
                    </label>
                    <Input
                      type="number"
                      value={formData.discount}
                      onChange={(e) =>
                        updateTotal(
                          Number(formData.subtotal) || 0,
                          Number(e.target.value) || 0,
                          Number(formData.transport_fee) || 0
                        )
                      }
                      className="h-9 text-xs bg-background text-emerald-600"
                      min={0}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      {isEn ? "Payment Method" : "Metode Pembayaran"}
                    </label>
                    <Select
                      value={formData.payment_method}
                      onValueChange={(val) => setFormData((prev) => ({ ...prev, payment_method: val || "cash" }))}
                    >
                      <SelectTrigger className="w-full bg-background h-9 text-xs">
                        <SelectValue>
                          {(val) => {
                            if (val === "qris") return "QRIS";
                            if (val === "bank_transfer") return isEn ? "Bank Transfer" : "Transfer Bank";
                            return isEn ? "Cash" : "Tunai (Cash)";
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-popover border border-border">
                        <SelectItem value="cash" className="text-xs">{isEn ? "Cash" : "Tunai (Cash)"}</SelectItem>
                        <SelectItem value="qris" className="text-xs">QRIS</SelectItem>
                        <SelectItem value="bank_transfer" className="text-xs">{isEn ? "Bank Transfer" : "Transfer Bank"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      {isEn ? "Payment Status" : "Status Pembayaran"}
                    </label>
                    <Select
                      value={formData.payment_status}
                      onValueChange={(val) => setFormData((prev) => ({ ...prev, payment_status: val || "paid" }))}
                    >
                      <SelectTrigger className="w-full bg-background h-9 text-xs">
                        <SelectValue>
                          {(val) => {
                            if (val === "paid") return isEn ? "Paid (Lunas)" : "Lunas (Paid)";
                            if (val === "refunded") return isEn ? "Refunded" : "Dikembalikan (Refund)";
                            return isEn ? "Unpaid (Pending)" : "Belum Bayar (Pending)";
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-popover border border-border">
                        <SelectItem value="paid" className="text-xs text-emerald-600 font-medium">
                          {isEn ? "Paid (Lunas)" : "Lunas (Paid)"}
                        </SelectItem>
                        <SelectItem value="unpaid" className="text-xs text-amber-600 font-medium">
                          {isEn ? "Unpaid (Pending)" : "Belum Bayar (Pending)"}
                        </SelectItem>
                        <SelectItem value="refunded" className="text-xs text-rose-600 font-medium">
                          {isEn ? "Refunded" : "Refund"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    {isEn ? "Invoice / Receipt Notes" : "Catatan Nota"}
                  </label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder={isEn ? "Optional notes or instructions..." : "Catatan tambahan atau instruksi khusus..."}
                    rows={2}
                    className="text-xs bg-background"
                  />
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-10 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-lg shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isPending
                  ? isEn ? "Generating Invoice..." : "Menerbitkan Nota..."
                  : isEn ? "Generate & Save Invoice" : "Terbitkan & Simpan Nota"}
              </Button>
            </div>
          </div>
        </form>

        {/* Right Column: Live Sticky Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-3 lg:sticky lg:top-6">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-primary" />
              {isEn ? "Live Receipt Preview" : "Pratinjau Nota Langsung"}
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              {formData.invoice_number}
            </span>
          </div>

          {/* Live Rendered Card */}
          <InvoiceCard invoice={formData} showShareActions={false} forcedLocale={locale} />
        </div>
      </div>
    </div>
  );
};

/**
 * Detailed view of an existing Invoice
 */
const InvoiceShowView = () => {
  const { record, isPending } = useShowContext();
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  if (isPending || !record) {
    return (
      <div className="p-12 text-center text-xs text-muted-foreground animate-pulse">
        {isEn ? "Loading receipt..." : "Memuat nota..."}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-4">
      <InvoiceCard invoice={record as any} showShareActions={true} forcedLocale={locale} />
    </div>
  );
};

export const InvoiceShow = () => (
  <Show>
    <InvoiceShowView />
  </Show>
);
