"use client";

import * as React from "react";
import {
  useGetList,
  useLocaleState,
  useNotify,
  useRedirect,
  useCreate,
} from "ra-core";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { InvoiceCard, type InvoiceData } from "@/components/invoice-card";
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
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  CheckCircle2,
  FileText,
  TicketPercent,
  Crown,
  Medal,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  formatIDR,
  localizePromoName,
  formatDeduplicatedDescription,
  isCoupleService,
  standardizePhoneNumber,
  generateInvoicePublicToken,
} from "@/lib/utils";
import { PAYMENT_METHODS } from "@/components/payment-method";
import { getPaymentStatusSelectItems } from "@/components/status-badge";
import { POSDatePicker, POSTimePicker } from "./pos-pickers";
import { POSItemRows, type InvoiceItemRow } from "./pos-item-rows";
import { supabase } from "@/lib/supabase";

/**
 * Minimalist & Clean POS Checkout / Invoice Creator
 */
export const InvoiceCreate = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const location = useLocation();
  const notify = useNotify();
  const redirect = useRedirect();
  const [create, { isPending }] = useCreate();
  const queryClient = useQueryClient();

  // Load bookings, services, therapists, customers, existing invoices, and promotions
  const { data: bookings = [] } = useGetList("bookings", {
    pagination: { page: 1, perPage: 50 },
    sort: { field: "id", order: "DESC" },
  });
  const { data: invoices = [] } = useGetList("invoices", {
    filter: { payment_status: "paid" },
    pagination: { page: 1, perPage: 200 },
  });
  const { data: services = [] } = useGetList("services", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "name", order: "ASC" },
  });
  const { data: therapists = [] } = useGetList("therapists", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "name", order: "ASC" },
  });
  const { data: customers = [] } = useGetList("customers", {
    pagination: { page: 1, perPage: 50 },
  });
  const { data: dbPromotions = [] } = useGetList("promotions", {
    pagination: { page: 1, perPage: 50 },
  });

  // Active promotions strictly from Supabase database
  const allActivePromotions = React.useMemo(() => {
    if (!dbPromotions || !Array.isArray(dbPromotions)) return [];
    return dbPromotions.filter((p: any) => p.is_active !== false);
  }, [dbPromotions]);

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

  const defaultPublicToken = React.useMemo(() => generateInvoicePublicToken(), []);
  const todayStr = React.useMemo(() => new Date().toISOString().split("T")[0], []);

  // Form State
  const [formData, setFormData] = React.useState<InvoiceData>({
    invoice_number: defaultInvoiceNumber,
    public_token: defaultPublicToken,
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
    payment_method: "qris",
    payment_status: "paid",
    booking_status: "completed",
    notes: "",
    applied_promo_name: "",
  });

  const [items, setItems] = React.useState<InvoiceItemRow[]>([
    {
      id: "inv-item-1",
      service_id: null,
      service_name: "",
      therapist_id: null,
      therapist_name: "",
      price: 185000,
      transport_fee: 0,
      additional_charge: 0,
      additional_charge_description: "",
      rate: 60,
      bhp: 0,
    },
  ]);

  const [rawNotes, setRawNotes] = React.useState<string>("");

  // Synchronize items with formData and live receipt preview
  const syncItems = React.useCallback(
    (
      newItems: InvoiceItemRow[],
      override?: {
        discount?: number;
        transport_fee?: number;
        promoName?: string;
        notes?: string;
        customer_name?: string;
        customer_phone?: string;
        service_address?: string;
        booking_id?: number | null;
        booking_date?: string;
        booking_time?: string;
        payment_method?: string;
        payment_status?: string;
      }
    ) => {
      const sub = newItems.reduce((acc, it) => {
        const isCoupleSplit = it.is_couple && it.therapist_mode === "couple_split";
        const p1 = Number(it.price) || 0;
        const p2 = isCoupleSplit ? Number(it.secondary_price) || 0 : 0;
        return acc + p1 + p2;
      }, 0);

      const itemTransportSum = newItems.reduce((acc, it) => {
        const isCoupleSplit = it.is_couple && it.therapist_mode === "couple_split";
        const t1 = Number(it.transport_fee) || 0;
        const t2 = isCoupleSplit ? Number(it.secondary_transport_fee) || 0 : 0;
        return acc + t1 + t2;
      }, 0);

      const itemAdditionalChargeSum = newItems.reduce((acc, it) => {
        const isCoupleSplit = it.is_couple && it.therapist_mode === "couple_split";
        const c1 = Number(it.additional_charge) || 0;
        const c2 = isCoupleSplit ? Number(it.secondary_additional_charge) || 0 : 0;
        return acc + c1 + c2;
      }, 0);

      const allChargeDescs: (string | undefined)[] = [];
      newItems.forEach((it) => {
        if (it.additional_charge_description) allChargeDescs.push(it.additional_charge_description);
        if (it.is_couple && it.therapist_mode === "couple_split" && it.secondary_additional_charge_description) {
          allChargeDescs.push(it.secondary_additional_charge_description);
        }
      });
      const itemAdditionalChargeDescs = formatDeduplicatedDescription(allChargeDescs);

      const disc = override?.discount !== undefined ? override.discount : Number(formData.discount || 0);
      const trans = override?.transport_fee !== undefined ? override.transport_fee : itemTransportSum;
      const tot = Math.max(0, sub + trans + itemAdditionalChargeSum - disc);
      const pName = override?.promoName !== undefined ? override.promoName : disc === 0 ? "" : formData.applied_promo_name;
      const cleanNotesText = override?.notes !== undefined ? override.notes : rawNotes;

      // Determine if promo deducts from therapist commission (Post-Discount Policy)
      const promoObj = allActivePromotions.find(
        (p: any) =>
          p.name?.toLowerCase().trim() === (pName || "").toLowerCase().trim() ||
          p.code?.toLowerCase().trim() === (pName || "").toLowerCase().trim()
      );
      const isPostDiscount = disc > 0 && (promoObj ? Boolean(promoObj.deduct_from_therapist_commission) : true);

      const itemsWithComputedCommission: any[] = [];

      newItems.forEach((it) => {
        const isCoupleSplit = it.is_couple && it.therapist_mode === "couple_split";

        if (isCoupleSplit) {
          const t1 = therapists.find((x: any) => Number(x.id) === Number(it.therapist_id));
          const t2 = therapists.find((x: any) => Number(x.id) === Number(it.secondary_therapist_id));
          const srv = services.find((x: any) => Number(x.id) === Number(it.service_id));

          const price1 = Number(it.price || 0);
          const price2 = Number(it.secondary_price || 0);

          const itemDeduction1 = isPostDiscount && sub > 0 ? Math.round((price1 / sub) * disc) : 0;
          const itemDeduction2 = isPostDiscount && sub > 0 ? Math.round((price2 / sub) * disc) : 0;

          const itemBasis1 = Math.max(0, price1 - itemDeduction1);
          const itemBasis2 = Math.max(0, price2 - itemDeduction2);

          const rate1 = Number(it.rate ?? t1?.commission_rate ?? 60);
          const rate2 = Number(it.secondary_rate ?? t2?.commission_rate ?? 60);

          const charge1 = Number(it.additional_charge || 0);
          const charge2 = Number(it.secondary_additional_charge || 0);

          const chargeShare1 =
            it.additional_charge_therapist_share !== undefined
              ? Number(it.additional_charge_therapist_share)
              : Math.round((charge1 * rate1) / 100);
          const chargeShare2 =
            it.secondary_additional_charge_therapist_share !== undefined
              ? Number(it.secondary_additional_charge_therapist_share)
              : Math.round((charge2 * rate2) / 100);

          const comm1 = Math.round((itemBasis1 * rate1) / 100) + chargeShare1;
          const comm2 = Math.round((itemBasis2 * rate2) / 100) + chargeShare2;

          const trans1 = Number(it.transport_fee || 0);
          const trans2 = Number(it.secondary_transport_fee || 0);
          const transShare1 =
            it.transport_fee_therapist_share !== undefined ? Number(it.transport_fee_therapist_share) : trans1;
          const transShare2 =
            it.secondary_transport_fee_therapist_share !== undefined
              ? Number(it.secondary_transport_fee_therapist_share)
              : trans2;

          const totalBhp = Number(srv?.consumables_cost || it.bhp || 0);
          const halfBhp = Math.round(totalBhp / 2);

          itemsWithComputedCommission.push({
            service_id: it.service_id,
            name: `${it.service_name || srv?.name || "Couple Package"} (Terapis #1: ${t1?.name || it.therapist_name || "Terapis 1"})`,
            parent_package_name: it.service_name || srv?.name || "Couple Package",
            is_couple_package: true,
            package_total_price: price1 + price2,
            therapist_id: it.therapist_id,
            therapist: t1?.name || it.therapist_name || "Terapis 1",
            price: price1,
            basis_deduction: itemDeduction1,
            transport_fee: trans1,
            transport_fee_therapist_share: transShare1,
            additional_charge: charge1,
            additional_charge_description: it.additional_charge_description || "",
            additional_charge_therapist_share: chargeShare1,
            rate: rate1,
            commission: comm1,
            bhp: halfBhp,
          });

          itemsWithComputedCommission.push({
            service_id: it.service_id,
            name: `${it.service_name || srv?.name || "Couple Package"} (Terapis #2: ${t2?.name || it.secondary_therapist_name || "Terapis 2"})`,
            parent_package_name: it.service_name || srv?.name || "Couple Package",
            is_couple_package: true,
            package_total_price: price1 + price2,
            therapist_id: it.secondary_therapist_id,
            therapist: t2?.name || it.secondary_therapist_name || "Terapis 2",
            price: price2,
            basis_deduction: itemDeduction2,
            transport_fee: trans2,
            transport_fee_therapist_share: transShare2,
            additional_charge: charge2,
            additional_charge_description: it.secondary_additional_charge_description || "",
            additional_charge_therapist_share: chargeShare2,
            rate: rate2,
            commission: comm2,
            bhp: totalBhp - halfBhp,
          });
        } else {
          const itemPrice = Number(it.price || 0);
          const itemDeduction = isPostDiscount && sub > 0 ? Math.round((itemPrice / sub) * disc) : 0;
          const itemBasis = Math.max(0, itemPrice - itemDeduction);
          const itemRate = Number(it.rate || 60);
          const itemCharge = Number(it.additional_charge || 0);
          const chargeShare =
            it.additional_charge_therapist_share !== undefined
              ? Number(it.additional_charge_therapist_share)
              : Math.round((itemCharge * itemRate) / 100);
          const serviceCommission = Math.round((itemBasis * itemRate) / 100);
          const itemComm = serviceCommission + chargeShare;
          const itemTrans = Number(it.transport_fee || 0);
          const transShare =
            it.transport_fee_therapist_share !== undefined ? Number(it.transport_fee_therapist_share) : itemTrans;
          const itemChargeDesc = it.additional_charge_description || "";
          const itemBhp = Number(it.bhp || 0);

          itemsWithComputedCommission.push({
            service_id: it.service_id,
            name: it.service_name || "Layanan",
            therapist_id: it.therapist_id,
            therapist: it.therapist_name || "Terapis",
            price: itemPrice,
            basis_deduction: itemDeduction,
            transport_fee: itemTrans,
            transport_fee_therapist_share: transShare,
            additional_charge: itemCharge,
            additional_charge_description: itemChargeDesc,
            additional_charge_therapist_share: chargeShare,
            rate: itemRate,
            commission: itemComm,
            bhp: itemBhp,
          });
        }
      });

      // Therapist receives service + charge commission + therapist portion of transport
      const totalTherapistFee = itemsWithComputedCommission.reduce(
        (acc, it) => acc + it.commission + (it.transport_fee_therapist_share !== undefined ? it.transport_fee_therapist_share : it.transport_fee),
        0
      );
      const totalBhp = itemsWithComputedCommission.reduce((acc, it) => acc + it.bhp, 0);
      const netOwner = Math.max(0, tot - totalTherapistFee - totalBhp);

      const metadata = {
        items: itemsWithComputedCommission,
        gross_total: sub,
        discount: disc,
        dpp: tot,
        transport_fee: trans,
        additional_charge: itemAdditionalChargeSum,
        additional_charge_description: itemAdditionalChargeDescs,
        therapist_fee: totalTherapistFee,
        bhp_cost: totalBhp,
        net_owner: netOwner,
        raw_notes: cleanNotesText,
        promo_name: pName,
      };

      const allServiceNames = newItems.map((it) => it.service_name || "Layanan").join(" + ") || "Layanan Pijat";
      const allTherapistNames = newItems
        .map((it) => {
          if (it.is_couple && it.therapist_mode === "couple_split") {
            const n1 = it.therapist_name || "Terapis 1";
            const n2 = it.secondary_therapist_name || "Terapis 2";
            return `${n1}, ${n2}`;
          }
          return it.therapist_name || "Terapis";
        })
        .filter(Boolean)
        .join(", ");

      setFormData((prev) => ({
        ...prev,
        booking_id: override?.booking_id !== undefined ? override.booking_id : prev.booking_id,
        customer_name: override?.customer_name !== undefined ? override.customer_name : prev.customer_name,
        customer_phone: override?.customer_phone !== undefined ? override.customer_phone : prev.customer_phone,
        service_address: override?.service_address !== undefined ? override.service_address : prev.service_address,
        booking_date: override?.booking_date !== undefined ? override.booking_date : prev.booking_date,
        booking_time: override?.booking_time !== undefined ? override.booking_time : prev.booking_time,
        payment_method: override?.payment_method !== undefined ? override.payment_method : prev.payment_method,
        payment_status: override?.payment_status !== undefined ? override.payment_status : prev.payment_status,
        service_id: newItems[0]?.service_id || null,
        service_name: allServiceNames,
        therapist_id: newItems[0]?.therapist_id || null,
        therapist_name: allTherapistNames,
        subtotal: sub,
        discount: disc,
        transport_fee: trans,
        additional_charge: itemAdditionalChargeSum,
        additional_charge_description: itemAdditionalChargeDescs,
        total_amount: tot,
        applied_promo_name: pName,
        notes: JSON.stringify(metadata),
        items: newItems,
      } as any));
    },
    [formData.discount, formData.applied_promo_name, rawNotes, allActivePromotions, therapists, services]
  );

  // Recalculate total amount when subtotal, discount, transport_fee change
  const updateTotal = (sub: number, disc: number, trans: number, promoName?: string) => {
    syncItems(items, { discount: disc, transport_fee: trans, promoName });
  };

  const handleAddItem = () => {
    const newItems = [
      ...items,
      {
        id: `inv-item-${Date.now()}-${Math.random()}`,
        service_id: null,
        service_name: "",
        therapist_id: null,
        therapist_name: "",
        price: 0,
        transport_fee: 0,
        additional_charge: 0,
        additional_charge_description: "",
        rate: 60,
        bhp: 0,
      },
    ];
    setItems(newItems);
    syncItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    const newItems = items.filter((_, idx) => idx !== index);
    setItems(newItems);
    syncItems(newItems);
  };

  const handleItemChange = (index: number, updatedFields: Partial<InvoiceItemRow>) => {
    const newItems = items.map((it, idx) => {
      if (idx === index) {
        return { ...it, ...updatedFields };
      }
      return it;
    });
    setItems(newItems);
    syncItems(newItems);
  };

  // Smart Detection: First-Time Customer based on WhatsApp phone number & order history
  const cleanPhone = React.useMemo(() => {
    return formData.customer_phone?.replace(/\D/g, "") || "";
  }, [formData.customer_phone]);

  const previousInvoicesCount = React.useMemo(() => {
    if (!cleanPhone || cleanPhone.length < 6) return 0;

    const cust = customers.find((c: any) => {
      const cPhone = c.phone?.replace(/\D/g, "") || "";
      return (
        (formData.customer_id && c.id === formData.customer_id) ||
        (cleanPhone.length >= 8 && cPhone && cPhone.endsWith(cleanPhone.slice(-8)))
      );
    });
    const manualCount = Number(cust?.manual_orders_count || 0);

    const invoiceCount = invoices.filter((inv) => {
      const invPhone = inv.customer_phone?.replace(/\D/g, "") || "";
      const isPaid = inv.payment_status === "paid";
      return (
        isPaid &&
        ((invPhone && invPhone.endsWith(cleanPhone.slice(-8))) ||
          (formData.customer_id && inv.customer_id === formData.customer_id))
      );
    }).length;

    return invoiceCount + manualCount;
  }, [cleanPhone, invoices, formData.customer_id, customers]);

  const isFirstTimeCustomer = React.useMemo(() => {
    return cleanPhone.length >= 8 && previousInvoicesCount === 0;
  }, [cleanPhone, previousInvoicesCount]);

  const isDormantCustomer = React.useMemo(() => {
    if (!cleanPhone || cleanPhone.length < 6 || previousInvoicesCount === 0) return false;
    const paidInvoices = invoices.filter((inv) => {
      const invPhone = inv.customer_phone?.replace(/\D/g, "") || "";
      const isPaid = inv.payment_status === "paid";
      return (
        isPaid &&
        ((invPhone && invPhone.endsWith(cleanPhone.slice(-8))) ||
          (formData.customer_id && inv.customer_id === formData.customer_id))
      );
    });
    if (paidInvoices.length === 0) return false;
    const latestDate = paidInvoices[0]?.created_at || paidInvoices[0]?.booking_date;
    if (!latestDate) return false;
    const diffMs = Date.now() - new Date(latestDate).getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return days >= 30;
  }, [cleanPhone, previousInvoicesCount, invoices, formData.customer_id]);

  // Recommended Promotion for this customer with multi-tier loyalty & win-back support
  const recommendedPromo = React.useMemo(() => {
    if (!allActivePromotions || allActivePromotions.length === 0) return null;

    // 1. First-Time Customer Check (0 previous orders)
    if (isFirstTimeCustomer) {
      const firstPromo = allActivePromotions.find((p: any) => p.scope === "first_order");
      if (firstPromo) return firstPromo;
    }

    // 2. Loyalty Milestone Check (e.g. Completed >= 10 orders -> Order ke-11)
    if (previousInvoicesCount > 0) {
      const loyaltyPromos = allActivePromotions
        .filter(
          (p: any) =>
            p.scope === "loyalty_milestone" &&
            Number(p.min_orders_count || 10) <= previousInvoicesCount
        )
        .sort((a: any, b: any) => Number(b.min_orders_count || 0) - Number(a.min_orders_count || 0));

      if (loyaltyPromos.length > 0) return loyaltyPromos[0];
    }

    // 3. Win-Back Inactive Customer Check (>= 30 days since last order)
    if (isDormantCustomer) {
      const winbackPromo = allActivePromotions.find((p: any) => p.scope === "dormant_winback");
      if (winbackPromo) return winbackPromo;
    }

    // 4. Minimum Order Spend Check
    const subtotal = Number(formData.subtotal || 0);
    const minOrderPromo = allActivePromotions.find(
      (p: any) =>
        p.scope === "min_order" &&
        subtotal >= Number(p.min_order_amount || 0)
    );
    if (minOrderPromo) return minOrderPromo;

    // 5. General Promotion
    return allActivePromotions.find((p: any) => p.scope === "all") || null;
  }, [isFirstTimeCustomer, previousInvoicesCount, isDormantCustomer, allActivePromotions, formData.subtotal]);

  // Apply a promotion
  const handleApplyPromo = (promo: any) => {
    if (!promo) return;
    let disc = 0;
    if (promo.type === "percentage") {
      disc = Math.round((Number(formData.subtotal || 0) * Number(promo.value || 0)) / 100);
      if (promo.max_discount_cap && Number(promo.max_discount_cap) > 0) {
        disc = Math.min(disc, Number(promo.max_discount_cap));
      }
    } else {
      disc = Number(promo.value || 0);
    }

    updateTotal(
      Number(formData.subtotal || 0),
      disc,
      Number(formData.transport_fee || 0),
      promo.name
    );

    toast.success(
      isEn
        ? `Applied '${promo.name}' discount (-${formatIDR(disc)})`
        : `Diskon '${promo.name}' berhasil diterapkan! (-${formatIDR(disc)})`
    );
  };

  // Only show bookings that do not have an invoice yet (or currently selected)
  const availableBookings = React.useMemo(() => {
    return bookings.filter(
      (b) => !invoicedBookingIds.has(Number(b.id)) || (formData.booking_id != null && b.id === formData.booking_id)
    );
  }, [bookings, invoicedBookingIds, formData.booking_id]);

  // Helper to extract booking_id from URL (supporting both HashRouter and browser routing)
  const getBookingIdFromUrl = (): string | null => {
    if (typeof window === "undefined") return null;
    try {
      const hash = window.location.hash || "";
      const hashQIdx = hash.indexOf("?");
      if (hashQIdx !== -1) {
        const sp = new URLSearchParams(hash.substring(hashQIdx));
        const val = sp.get("booking_id");
        if (val) return val;
      }
      const sp = new URLSearchParams(window.location.search);
      return sp.get("booking_id");
    } catch {
      return null;
    }
  };

  const [importedBooking, setImportedBooking] = React.useState<any>(null);

  // Available bookings options (combines query list + directly imported booking)
  const bookingOptions = React.useMemo(() => {
    const list = [
      { value: "none", label: isEn ? "Manual entry (No booking)" : "Input Manual (Tanpa booking)" },
      ...availableBookings.map((b) => {
        const cust = customers.find((c) => c.id === b.customer_id) || b.customers;
        return {
          value: b.id.toString(),
          label: `#${b.id} - ${cust?.full_name || "Pelanggan"} (${b.booking_date} • ${b.booking_time}) • ${formatIDR(b.total_price)}`,
        };
      }),
    ];

    if (importedBooking && !list.some((opt) => opt.value === String(importedBooking.id))) {
      const cust = customers.find((c) => c.id === importedBooking.customer_id) || importedBooking.customers;
      list.push({
        value: String(importedBooking.id),
        label: `#${importedBooking.id} - ${cust?.full_name || "Pelanggan"} (${importedBooking.booking_date} • ${importedBooking.booking_time}) • ${formatIDR(importedBooking.total_price)}`,
      });
    }

    return list;
  }, [availableBookings, customers, isEn, importedBooking]);

  // Handle Booking Import
  const handleSelectBooking = async (bookingIdStr: string | null) => {
    if (!bookingIdStr || bookingIdStr === "none") {
      setFormData((prev) => ({ ...prev, booking_id: null }));
      setImportedBooking(null);
      return;
    }

    const bId = Number(bookingIdStr);
    let booking = bookings.find((b) => Number(b.id) === bId);

    // If not found in loaded page 1, fetch directly from Supabase with relations
    if (!booking) {
      try {
        const { data: directBooking } = await supabase
          .from("bookings")
          .select("*, services(*), customers(*), therapists(*)")
          .eq("id", bId)
          .maybeSingle();

        if (directBooking) {
          booking = directBooking;
        }
      } catch (err) {
        console.error("Direct fetch booking error:", err);
      }
    }

    if (!booking) return;
    setImportedBooking(booking);

    const cust = customers.find((c) => c.id === booking.customer_id) || booking.customers;
    let loadedItems: InvoiceItemRow[] = [];
    let extractedNotes = "";
    let extractedTransport = 0;

    if (booking.special_requests) {
      try {
        const trimmed = String(booking.special_requests).trim();
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
          const parsed = JSON.parse(trimmed);
          extractedNotes = parsed.raw_notes || parsed.notes || "";
          extractedTransport = Number(parsed.transport_fee || 0);
          if (Array.isArray(parsed.items) && parsed.items.length > 0 && (!booking.relational_items || booking.relational_items.length === 0)) {
            const rawParsedItems = parsed.items;
            const itemsProcessed: InvoiceItemRow[] = [];
            let i = 0;
            while (i < rawParsedItems.length) {
              const it = rawParsedItems[i];
              const s = services.find((x: any) => Number(x.id) === Number(it.service_id));
              const isCouple = Boolean(it.is_couple_package || (s && isCoupleService(s)));

              if (
                isCouple &&
                i + 1 < rawParsedItems.length &&
                rawParsedItems[i + 1].is_couple_package &&
                rawParsedItems[i + 1].service_id === it.service_id
              ) {
                // Couple split pair!
                const it2 = rawParsedItems[i + 1];
                const t1 = therapists.find((x: any) => Number(x.id) === Number(it.therapist_id));
                const t2 = therapists.find((x: any) => Number(x.id) === Number(it2.therapist_id));
                itemsProcessed.push({
                  id: `inv-item-${i}-${Date.now()}`,
                  service_id: it.service_id || null,
                  service_name: it.parent_package_name || s?.name || "Couple Package",
                  is_couple: true,
                  therapist_mode: "couple_split",
                  therapist_id: it.therapist_id || null,
                  therapist_name: it.therapist || t1?.name || "Terapis 1",
                  price: Number(it.price || Math.round((s?.price || 0) / 2)),
                  transport_fee: Number(it.transport_fee || 0),
                  transport_fee_therapist_share:
                    it.transport_fee_therapist_share !== undefined
                      ? Number(it.transport_fee_therapist_share)
                      : Number(it.transport_fee || 0),
                  additional_charge: Number(it.additional_charge || 0),
                  additional_charge_description: it.additional_charge_description || "",
                  additional_charge_therapist_share:
                    it.additional_charge_therapist_share !== undefined
                      ? Number(it.additional_charge_therapist_share)
                      : Math.round(
                          (Number(it.additional_charge || 0) * Number(it.rate || t1?.commission_rate || 60)) / 100
                        ),
                  rate: Number(it.rate || t1?.commission_rate || 60),
                  bhp: Number(it.bhp || Math.round((s?.consumables_cost || 0) / 2)),
                  secondary_therapist_id: it2.therapist_id || null,
                  secondary_therapist_name: it2.therapist || t2?.name || "Terapis 2",
                  secondary_price: Number(it2.price || Math.round((s?.price || 0) / 2)),
                  secondary_transport_fee: Number(it2.transport_fee || 0),
                  secondary_transport_fee_therapist_share:
                    it2.transport_fee_therapist_share !== undefined
                      ? Number(it2.transport_fee_therapist_share)
                      : Number(it2.transport_fee || 0),
                  secondary_additional_charge: Number(it2.additional_charge || 0),
                  secondary_additional_charge_description: it2.additional_charge_description || "",
                  secondary_additional_charge_therapist_share:
                    it2.additional_charge_therapist_share !== undefined
                      ? Number(it2.additional_charge_therapist_share)
                      : Math.round(
                          (Number(it2.additional_charge || 0) * Number(it2.rate || t2?.commission_rate || 60)) / 100
                        ),
                  secondary_rate: Number(it2.rate || t2?.commission_rate || 60),
                  secondary_bhp: Number(it2.bhp || Math.round((s?.consumables_cost || 0) / 2)),
                });
                i += 2;
              } else {
                const t = therapists.find((x: any) => Number(x.id) === Number(it.therapist_id));
                const itemTrans = Number(
                  it.transport_fee !== undefined
                    ? it.transport_fee
                    : i === 0
                    ? extractedTransport
                    : 0
                );
                const itemTransShare =
                  it.transport_fee_therapist_share !== undefined
                    ? Number(it.transport_fee_therapist_share)
                    : itemTrans;
                const itemCharge = Number(
                  it.additional_charge !== undefined
                    ? it.additional_charge
                    : i === 0
                    ? parsed.additional_charge
                    : 0
                ) || 0;
                const itemChargeShare =
                  it.additional_charge_therapist_share !== undefined
                    ? Number(it.additional_charge_therapist_share)
                    : Math.round((itemCharge * Number(it.rate || t?.commission_rate || 60)) / 100);

                itemsProcessed.push({
                  id: `inv-item-${i}-${Date.now()}`,
                  service_id: it.service_id || null,
                  service_name: it.name || s?.name || "Layanan",
                  is_couple: isCouple,
                  therapist_mode: isCouple ? "single" : undefined,
                  therapist_id: it.therapist_id || null,
                  therapist_name: it.therapist || t?.name || "Terapis",
                  price: Number(it.price || s?.price || 0),
                  transport_fee: itemTrans,
                  transport_fee_therapist_share: itemTransShare,
                  additional_charge: itemCharge,
                  additional_charge_description:
                    it.additional_charge_description ||
                    (i === 0 ? parsed.additional_charge_description : "") ||
                    "",
                  additional_charge_therapist_share: itemChargeShare,
                  rate: Number(it.rate || t?.commission_rate || 60),
                  bhp: Number(it.bhp || s?.consumables_cost || 0),
                });
                i++;
              }
            }
            loadedItems = itemsProcessed;
          }
        } else {
          extractedNotes = booking.special_requests;
        }
      } catch (e) {
        extractedNotes = booking.special_requests || "";
      }
    }

    if (Array.isArray(booking.relational_items) && booking.relational_items.length > 0) {
      loadedItems = booking.relational_items.map((it: any, idx: number) => {
        const s = services.find((x: any) => Number(x.id) === Number(it.service_id));
        const t = therapists.find((x: any) => Number(x.id) === Number(it.therapist_id));
        const isCouple = isCoupleService(s);
        return {
          id: `inv-item-${idx}-${Date.now()}`,
          service_id: it.service_id || null,
          service_name: it.service_name_snapshot || it.name || s?.name || "Layanan",
          is_couple: isCouple,
          therapist_mode: isCouple ? "single" : undefined,
          therapist_id: it.therapist_id || null,
          therapist_name: it.therapist_name_snapshot || it.therapist || t?.name || "Terapis",
          price: Number(it.price || s?.price || 0),
          transport_fee: Number(it.transport_fee || 0),
          additional_charge: Number(it.additional_charge || 0),
          additional_charge_description: it.additional_charge_description || "",
          rate: Number(it.commission_rate_snapshot || it.rate || t?.commission_rate || 60),
          bhp: Number(it.consumables_cost_snapshot || it.bhp || s?.consumables_cost || 0),
        };
      });
    }

    if (loadedItems.length === 0) {
      const srv = services.find((s) => s.id === booking.service_id) || booking.services;
      const thp = therapists.find((t) => t.id === booking.therapist_id) || booking.therapists;
      const isCouple = isCoupleService(srv);
      loadedItems = [
        {
          id: `inv-item-1-${Date.now()}`,
          service_id: booking.service_id,
          service_name: srv?.name || `Layanan #${booking.service_id}`,
          is_couple: isCouple,
          therapist_mode: isCouple ? "single" : undefined,
          therapist_id: booking.therapist_id,
          therapist_name: thp?.name || "",
          price: Number(booking.total_price || srv?.price || 185000),
          transport_fee: extractedTransport,
          additional_charge: 0,
          additional_charge_description: "",
          rate: Number(thp?.commission_rate || 60),
          bhp: Number(srv?.consumables_cost || 0),
        },
      ];
    }

    setItems(loadedItems);
    setRawNotes(extractedNotes);

    syncItems(loadedItems, {
      booking_id: booking.id,
      customer_name: cust?.full_name || formData.customer_name || `Pelanggan #${booking.customer_id}`,
      customer_phone: standardizePhoneNumber(cust?.phone) || cust?.phone || formData.customer_phone,
      service_address: booking.service_address || cust?.address || "",
      booking_date: booking.booking_date || formData.booking_date,
      booking_time: booking.booking_time || formData.booking_time,
      payment_method: booking.payment_method || "qris",
      payment_status: booking.payment_status || "paid",
      notes: extractedNotes,
      discount: 0,
      transport_fee: extractedTransport,
    });

    toast.success(
      isEn
        ? `Imported data from Booking #${booking.id}`
        : `Data dari Booking #${booking.id} berhasil dimuat!`
    );
  };

  // Auto-detect booking_id from URL query params (React Router, HashRouter & browser routing)
  React.useEffect(() => {
    const checkUrlBookingParam = () => {
      const searchParams = new URLSearchParams(location.search);
      const bookingIdFromRouter = searchParams.get("booking_id");
      const urlBookingId = bookingIdFromRouter || getBookingIdFromUrl();

      if (urlBookingId && (!formData.booking_id || String(formData.booking_id) !== urlBookingId)) {
        handleSelectBooking(urlBookingId);
      }
    };

    checkUrlBookingParam();
    window.addEventListener("hashchange", checkUrlBookingParam);
    return () => window.removeEventListener("hashchange", checkUrlBookingParam);
  }, [location.search, location.hash, bookings]);

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

    const finalData = {
      ...formData,
      customer_phone: standardizePhoneNumber(formData.customer_phone) || formData.customer_phone,
    };

    create(
      "invoices",
      { data: finalData },
      {
        onSuccess: (data) => {
          // Immediately invalidate react-query caches so Booking list & Invoices reflect real-time DB state
          queryClient.invalidateQueries({ queryKey: ["bookings"] });
          queryClient.invalidateQueries({ queryKey: ["invoices"] });
          queryClient.invalidateQueries({ queryKey: ["customers"] });

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
              <SearchableCombobox
                options={bookingOptions}
                value={formData.booking_id ? String(formData.booking_id) : "none"}
                placeholder={isEn ? "— Choose a booking (Optional) —" : "— Pilih dari booking (Opsional) —"}
                searchPlaceholder={isEn ? "Search booking # or customer name..." : "Cari no. booking atau nama..."}
                emptyText={isEn ? "No active bookings available" : "Tidak ada booking aktif"}
                onValueChange={handleSelectBooking}
              />
            </div>

            <div className="border-t border-border/50 pt-4 space-y-4">
              {/* 2. Client Details */}
              <div className="space-y-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  {isEn ? "Client Details" : "Data Pelanggan"}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground flex items-center gap-1">
                      <span>{isEn ? "Customer Name" : "Nama Pelanggan"}</span>
                      <span className="text-destructive">*</span>
                    </label>
                    <Input
                      value={formData.customer_name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({ ...prev, customer_name: val }));
                      }}
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
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({ ...prev, customer_phone: val }));
                      }}
                      onBlur={() => {
                        if (formData.customer_phone) {
                          const std = standardizePhoneNumber(formData.customer_phone);
                          if (std && std !== formData.customer_phone) {
                            setFormData((prev) => ({ ...prev, customer_phone: std }));
                          }
                        }
                      }}
                      placeholder="+628123456789 / 0812..."
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
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({ ...prev, service_address: val }));
                    }}
                    placeholder={isEn ? "Home address..." : "Alamat rumah pelanggan..."}
                    className="h-9 text-xs bg-background"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border/50 pt-4 space-y-4">
              {/* 3. Service & Schedule */}
              <div className="space-y-3">
                <POSItemRows
                  items={items}
                  services={services}
                  therapists={therapists}
                  isEn={isEn}
                  onAddItem={handleAddItem}
                  onRemoveItem={handleRemoveItem}
                  onItemChange={handleItemChange}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-border/40">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      {isEn ? "Service Date" : "Tanggal Layanan"}
                    </label>
                    <POSDatePicker
                      value={formData.booking_date}
                      onChange={(date) => {
                        setFormData((prev) => ({ ...prev, booking_date: date }));
                      }}
                      isEn={isEn}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      {isEn ? "Service Time" : "Jam Layanan"}
                    </label>
                    <POSTimePicker
                      value={formData.booking_time}
                      onChange={(time) => {
                        setFormData((prev) => ({ ...prev, booking_time: time }));
                      }}
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

                {/* Smart Promotion & Auto-Detection Recommendation */}
                {recommendedPromo && (
                  <div className="bg-muted/40 dark:bg-muted/20 border border-border/80 rounded-xl p-3.5 space-y-2.5 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0 mt-0.5">
                          <TicketPercent className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-semibold text-foreground">
                              {localizePromoName(recommendedPromo.name, isEn)}
                            </span>
                            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-medium">
                              {isFirstTimeCustomer ? (
                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  {isEn ? "First-Time Customer" : "Pelanggan Pertama"}
                                </span>
                              ) : recommendedPromo.scope === "loyalty_milestone" ? (
                                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                  <Crown className="w-2.5 h-2.5" />
                                  {isEn
                                    ? `Loyalty Reward (Order #${previousInvoicesCount + 1})`
                                    : `Promo Loyalitas (Order ke-${previousInvoicesCount + 1})`}
                                </span>
                              ) : recommendedPromo.scope === "dormant_winback" ? (
                                <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                                  <RotateCcw className="w-2.5 h-2.5" />
                                  {isEn ? "Win-Back Offer" : "Promo Win-Back"}
                                </span>
                              ) : previousInvoicesCount >= 10 ? (
                                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                  <Crown className="w-2.5 h-2.5" />
                                  {isEn ? `Loyal VIP (${previousInvoicesCount}x)` : `Pelanggan Setia (${previousInvoicesCount}x)`}
                                </span>
                              ) : previousInvoicesCount >= 5 ? (
                                <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                                  <Medal className="w-2.5 h-2.5" />
                                  {isEn ? `Silver VIP (${previousInvoicesCount}x)` : `Silver VIP (${previousInvoicesCount}x)`}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  {isEn ? "Special Promo" : "Promo Spesial"}
                                </span>
                              )}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {isFirstTimeCustomer
                              ? isEn
                                ? "This WhatsApp number has no previous orders. 1-click apply eligible first-timer discount."
                                : "Nomor WhatsApp ini belum pernah memiliki riwayat order. Rekomendasi diskon 1-klik siap digunakan."
                              : recommendedPromo.scope === "loyalty_milestone"
                              ? isEn
                                ? `Customer has completed ${previousInvoicesCount} paid orders. Eligible for loyalty milestone reward on this order #${previousInvoicesCount + 1}!`
                                : `Pelanggan telah menyelesaikan ${previousInvoicesCount} order lunas. Berhak mendapatkan diskon reward loyalitas pada order ke-${previousInvoicesCount + 1} ini!`
                              : recommendedPromo.scope === "dormant_winback"
                              ? isEn
                                ? "Customer has been inactive for more than 30 days. Win-back discount recommended."
                                : "Pelanggan sudah lebih dari 30 hari belum memesan kembali. Diskon win-back direkomendasikan."
                              : isEn
                              ? "Eligible promotional discount available for this order."
                              : "Tersedia promo diskon yang sesuai untuk pesanan ini."}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleApplyPromo(recommendedPromo)}
                          className="h-8 px-3 text-xs font-medium rounded-lg shadow-xs cursor-pointer gap-1.5"
                        >
                          <TicketPercent className="w-3.5 h-3.5" />
                          <span>
                            {isEn
                              ? `Apply (${recommendedPromo.type === "percentage" ? `${recommendedPromo.value}%` : formatIDR(recommendedPromo.value)})`
                              : `Gunakan Diskon (${recommendedPromo.type === "percentage" ? `${recommendedPromo.value}%` : formatIDR(recommendedPromo.value)})`}
                          </span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

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
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-foreground">
                        {isEn ? "Discount (Rp)" : "Diskon (Rp)"}
                      </label>
                      {(formData.discount || 0) > 0 && (
                        <button
                          type="button"
                          onClick={() => updateTotal(formData.subtotal, 0, formData.transport_fee || 0, "")}
                          className="text-[10px] text-destructive hover:underline cursor-pointer"
                        >
                          {isEn ? "Clear" : "Hapus"}
                        </button>
                      )}
                    </div>
                    <Input
                      type="number"
                      value={formData.discount || 0}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        updateTotal(
                          Number(formData.subtotal) || 0,
                          val,
                          Number(formData.transport_fee) || 0,
                          val === 0 ? "" : undefined
                        );
                      }}
                      className="h-9 text-xs bg-background text-emerald-600 font-semibold"
                      min={0}
                    />
                    {(formData.discount || 0) > 0 && (
                      <div className="flex items-center gap-1 text-[10.5px] text-emerald-600 dark:text-emerald-400 font-medium pt-0.5 truncate">
                        <TicketPercent className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          {localizePromoName(formData.applied_promo_name, isEn)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Optional Promo Dropdown Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-1 border-t border-border/40">
                  <span className="text-muted-foreground text-[11px] flex items-center gap-1.5">
                    <TicketPercent className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{isEn ? "Select Active Promo:" : "Pilih Promo / Voucher Lain:"}</span>
                  </span>
                  <div className="w-full sm:w-64">
                    <SearchableCombobox
                      options={[
                        { value: "none", label: isEn ? "— No Promo (Manual) —" : "— Tanpa Promo (Manual) —" },
                        ...allActivePromotions.map((p: any) => ({
                          value: p.id.toString(),
                          label: `${localizePromoName(p.name, isEn)} (${p.type === "percentage" ? `${p.value}%` : formatIDR(p.value)})`,
                        })),
                      ]}
                      placeholder={isEn ? "Choose Promo..." : "Pilih Promo..."}
                      searchPlaceholder={isEn ? "Search promo..." : "Cari promo..."}
                      onValueChange={(val) => {
                        if (!val || val === "none") {
                          updateTotal(formData.subtotal, 0, formData.transport_fee || 0, "");
                        } else {
                          const p = allActivePromotions.find((x: any) => x.id.toString() === val);
                          if (p) handleApplyPromo(p);
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      {isEn ? "Order Status" : "Status Pesanan"}
                    </label>
                    {(() => {
                      const orderStatusItems = [
                        { value: "completed", label: isEn ? "Completed" : "Selesai" },
                        { value: "confirmed", label: isEn ? "Confirmed" : "Dikonfirmasi" },
                        { value: "pending", label: isEn ? "Pending" : "Menunggu Konfirmasi" },
                        { value: "canceled", label: isEn ? "Canceled" : "Dibatalkan" },
                      ];
                      return (
                        <Select
                          items={orderStatusItems}
                          value={formData.booking_status || "completed"}
                          onValueChange={(val) => {
                            if (val) setFormData((prev) => ({ ...prev, booking_status: val }));
                          }}
                        >
                          <SelectTrigger className="w-full h-8 text-xs bg-background">
                            <SelectValue placeholder={isEn ? "Select status" : "Pilih status"}>
                              {(val) => {
                                const item = orderStatusItems.find((m) => m.value === val);
                                if (!item) return isEn ? "Select status" : "Pilih status";
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
                              {orderStatusItems.map((item) => (
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

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      {isEn ? "Payment Method" : "Metode Pembayaran"}
                    </label>
                    <Select
                      items={PAYMENT_METHODS}
                      value={formData.payment_method}
                      onValueChange={(val) => {
                        if (val) setFormData((prev) => ({ ...prev, payment_method: val }));
                      }}
                    >
                      <SelectTrigger className="w-full h-8 text-xs bg-background">
                        <SelectValue placeholder={isEn ? "Select method" : "Pilih metode"}>
                          {(val) => {
                            const item = PAYMENT_METHODS.find((m) => m.value === val);
                            if (!item) return isEn ? "Select method" : "Pilih metode";
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
                          {PAYMENT_METHODS.map((item) => (
                            <SelectItem key={item.value} value={item.value} className="text-xs py-1 px-2 flex items-center gap-1.5">
                              <span className="shrink-0 flex items-center">{resolveChoiceIcon(item.value)}</span>
                              <span>{item.label}</span>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      {isEn ? "Payment Status" : "Status Pembayaran"}
                    </label>
                    <Select
                      items={getPaymentStatusSelectItems(isEn)}
                      value={formData.payment_status}
                      onValueChange={(val) => {
                        if (val) setFormData((prev) => ({ ...prev, payment_status: val }));
                      }}
                    >
                      <SelectTrigger className="w-full h-8 text-xs bg-background">
                        <SelectValue placeholder={isEn ? "Select status" : "Pilih status"}>
                          {(val) => {
                            const items = getPaymentStatusSelectItems(isEn);
                            const item = items.find((s) => s.value === val);
                            if (!item) return isEn ? "Select status" : "Pilih status";
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
                          {getPaymentStatusSelectItems(isEn).map((item) => (
                            <SelectItem key={item.value} value={item.value} className="text-xs py-1 px-2 flex items-center gap-1.5">
                              <span className="shrink-0 flex items-center">{resolveChoiceIcon(item.value)}</span>
                              <span>{item.label}</span>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    {isEn ? "Invoice / Receipt Notes" : "Catatan Nota"}
                  </label>
                  <Textarea
                    value={rawNotes}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRawNotes(val);
                      syncItems(items, { notes: val });
                    }}
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
            <span className="text-[11px] text-muted-foreground">
              {formData.invoice_number}
            </span>
          </div>

          {/* Live Rendered Card (Minimal 1px border matching action buttons) */}
          <InvoiceCard
            invoice={formData}
            showShareActions={false}
            forcedLocale={locale}
            borderless={false}
          />
        </div>
      </div>
    </div>
  );
};
