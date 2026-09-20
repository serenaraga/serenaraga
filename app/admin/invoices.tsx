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
import {
  ReceiptText,
  Sparkles,
  User,
  Calendar,
  CreditCard,
  CheckCircle2,
  Percent,
  Truck,
  FileText,
} from "lucide-react";

import { RowActions } from "@/components/row-actions";

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
 * Minimalist & Clean POS Checkout / Invoice Creator
 */
export const InvoiceCreate = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const notify = useNotify();
  const redirect = useRedirect();
  const [create, { isPending }] = useCreate();

  // Load bookings and services for quick import
  const { data: bookings = [] } = useGetList("bookings", {
    pagination: { page: 1, perPage: 50 },
    sort: { field: "id", order: "DESC" },
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
                  <SelectValue placeholder={isEn ? "— Choose a booking (Optional) —" : "— Pilih dari booking (Opsional) —"} />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover border border-border max-h-60">
                  <SelectItem value="none" className="text-xs text-muted-foreground">
                    {isEn ? "Manual entry (No booking)" : "Input Manual (Tanpa booking)"}
                  </SelectItem>
                  {bookings.map((b) => (
                    <SelectItem key={b.id} value={b.id.toString()} className="text-xs">
                      <span className="font-semibold text-primary mr-1.5">#{b.id}</span>
                      <span className="mr-1">{b.booking_date}</span>
                      <span className="text-muted-foreground truncate">
                        ({b.service_address || "Home"}) • Rp {Number(b.total_price || 0).toLocaleString("id-ID")}
                      </span>
                    </SelectItem>
                  ))}
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
                        <SelectValue placeholder={formData.service_name || (isEn ? "Select service" : "Pilih layanan")} />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-popover border border-border">
                        {services.map((s) => (
                          <SelectItem key={s.id} value={s.id.toString()} className="text-xs">
                            {s.name} ({s.duration_minutes} mnt • Rp {Number(s.price || 0).toLocaleString("id-ID")})
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
                        <SelectValue placeholder={formData.therapist_name || (isEn ? "Select therapist" : "Pilih terapis")} />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-popover border border-border">
                        {therapists.map((t) => (
                          <SelectItem key={t.id} value={t.id.toString()} className="text-xs">
                            {t.name} ({t.status === "available" ? "🟢 Tersedia" : t.status === "on_duty" ? "🟡 Bertugas" : "⚪ Libur"})
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
                    <Input
                      type="date"
                      value={formData.booking_date}
                      onChange={(e) => setFormData((prev) => ({ ...prev, booking_date: e.target.value }))}
                      className="h-9 text-xs bg-background"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      {isEn ? "Service Time" : "Jam Layanan"}
                    </label>
                    <Input
                      type="time"
                      value={formData.booking_time}
                      onChange={(e) => setFormData((prev) => ({ ...prev, booking_time: e.target.value }))}
                      className="h-9 text-xs bg-background"
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
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-popover border border-border">
                        <SelectItem value="cash" className="text-xs">{isEn ? "Cash" : "Tunai (Cash)"}</SelectItem>
                        <SelectItem value="qris" className="text-xs">QRIS (Instant Pay)</SelectItem>
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
                        <SelectValue />
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
          <InvoiceCard invoice={formData} showShareActions={false} />
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
      <InvoiceCard invoice={record as any} showShareActions={true} />
    </div>
  );
};

export const InvoiceShow = () => (
  <Show>
    <InvoiceShowView />
  </Show>
);
