/**
 * Serena Raga Unified Financial Calculator
 * Ensures 100% consistent financial, commission, and profit calculations across:
 * - Bookings & Booking Details
 * - Invoices & POS Checkout
 * - Therapist Payout Slips & Remuneration
 * - Financial Reports & Dashboard
 */

export interface BookingFinancialInput {
  bookingPrice?: number | null;
  servicePrice?: number | null;
  consumablesCost?: number | null;
  commissionRate?: number | null;
  invoice?: {
    id?: number | string;
    invoice_number?: string;
    subtotal?: number | null;
    discount?: number | null;
    transport_fee?: number | null;
    total_amount?: number | null;
    notes?: string | null;
    applied_promo_name?: string | null;
    created_at?: string | null;
  } | null;
  promotions?: Array<{
    id?: number | string;
    name?: string;
    code?: string;
    type?: string;
    value?: number;
    deduct_from_therapist_commission?: boolean;
    scope?: string;
  }> | null;
}

export interface BookingItemDetail {
  name: string;
  price: number;
  commission: number;
  bhp: number;
  therapist?: string;
  therapist_id?: number;
  rate?: number;
  basis_deduction?: number;
}

export interface BookingFinancialResult {
  hasInvoice: boolean;
  invoiceId?: number | string;
  invoiceNumber?: string;
  treatmentGrossPrice: number;
  discountAmount: number;
  appliedPromoName?: string;
  isPostDiscountPolicy: boolean;
  transportFee: number;
  finalCustomerTotal: number;
  commissionBase: number;
  commissionRate: number;
  serviceCommission: number;
  therapistFee: number;
  consumablesCost: number;
  netSerenaRaga: number;
  itemsList?: BookingItemDetail[];
}

/**
 * Calculates complete synchronized financial breakdown for a booking & its invoice.
 * Supports exact itemized metadata when present in invoice notes.
 */
export function calculateBookingFinancials(
  input: BookingFinancialInput
): BookingFinancialResult {
  const {
    bookingPrice = 0,
    servicePrice = 0,
    consumablesCost = 0,
    commissionRate = 60,
    invoice = null,
    promotions = [],
  } = input;

  const resolvedRate = Number(commissionRate) || 60;
  const resolvedConsumables = Number(consumablesCost) || 0;

  if (invoice) {
    let subtotal = Number(
      invoice.subtotal ?? (invoice.total_amount ? invoice.total_amount : (bookingPrice || servicePrice || 0))
    );
    let discount = Number(invoice.discount || 0);
    const transport = Number(invoice.transport_fee || 0);
    let totalAmount = Number(
      invoice.total_amount ?? Math.max(0, subtotal + transport - discount)
    );

    // Parse JSON metadata if stored in notes
    let meta: any = null;
    if (invoice.notes) {
      try {
        const trimmed = invoice.notes.trim();
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
          meta = JSON.parse(trimmed);
        }
      } catch (e) {}
    }

    // Detect applied promo from invoice notes or applied_promo_name
    let promoName = invoice.applied_promo_name || meta?.promo_name || "";
    if (!promoName && invoice.notes && invoice.notes.includes("[Promo:")) {
      const match = invoice.notes.match(/\[Promo:\s*([^\]]+)\]/);
      if (match) promoName = match[1].trim();
    }

    // If metadata with exact itemized calculation is present
    if (meta && Array.isArray(meta.items) && meta.items.length > 0) {
      const metaGross = Number(meta.gross_total ?? subtotal);
      const metaDisc = Number(meta.discount ?? discount);
      const metaDpp = Number(meta.dpp ?? totalAmount);
      const metaComm = Number(meta.therapist_fee);
      const metaBhp = Number(meta.bhp_cost ?? resolvedConsumables);
      const metaNet = Number(meta.net_owner ?? (metaDpp - metaComm - metaBhp));

      return {
        hasInvoice: true,
        invoiceId: invoice.id,
        invoiceNumber: meta.invoice_number || invoice.invoice_number,
        treatmentGrossPrice: metaGross,
        discountAmount: metaDisc,
        appliedPromoName: promoName || undefined,
        isPostDiscountPolicy: metaDisc > 0,
        transportFee: transport,
        finalCustomerTotal: metaDpp,
        commissionBase: metaGross - metaDisc,
        commissionRate: resolvedRate,
        serviceCommission: metaComm - transport,
        therapistFee: metaComm,
        consumablesCost: metaBhp,
        netSerenaRaga: metaNet,
        itemsList: meta.items,
      };
    }

    // Determine if promo deducts from therapist commission (Post-Discount Policy)
    let isPostDiscount = false;
    if (discount > 0 && promotions && promotions.length > 0) {
      if (promoName) {
        const foundPromo = promotions.find(
          (p) =>
            p.name?.toLowerCase().trim() === promoName.toLowerCase().trim() ||
            p.code?.toLowerCase().trim() === promoName.toLowerCase().trim()
        );
        if (foundPromo && Boolean(foundPromo.deduct_from_therapist_commission)) {
          isPostDiscount = true;
        }
      } else {
        const activeDeductPromo = promotions.find((p) => p.deduct_from_therapist_commission);
        if (activeDeductPromo) {
          isPostDiscount = true;
        }
      }
    }

    // Commission Basis:
    // If post-discount policy -> (subtotal - discount)
    // If pre-discount policy -> subtotal (Gross price before discount)
    const commissionBase = isPostDiscount
      ? Math.max(0, subtotal - discount)
      : subtotal;

    const serviceCommission = Math.round((commissionBase * resolvedRate) / 100);
    // Transport fee is 100% allocated to therapist
    const therapistFee = serviceCommission + transport;
    const netSerenaRaga = Math.max(0, totalAmount - therapistFee - resolvedConsumables);

    return {
      hasInvoice: true,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      treatmentGrossPrice: subtotal,
      discountAmount: discount,
      appliedPromoName: promoName || undefined,
      isPostDiscountPolicy: isPostDiscount,
      transportFee: transport,
      finalCustomerTotal: totalAmount,
      commissionBase,
      commissionRate: resolvedRate,
      serviceCommission,
      therapistFee,
      consumablesCost: resolvedConsumables,
      netSerenaRaga,
    };
  }

  // Pre-Invoice Estimation (Before Invoice is issued)
  const initialPrice = Number(bookingPrice || servicePrice || 0);
  const commissionBase = initialPrice;
  const serviceCommission = Math.round((commissionBase * resolvedRate) / 100);
  const therapistFee = serviceCommission;
  const netSerenaRaga = Math.max(0, initialPrice - therapistFee - resolvedConsumables);

  return {
    hasInvoice: false,
    treatmentGrossPrice: initialPrice,
    discountAmount: 0,
    isPostDiscountPolicy: false,
    transportFee: 0,
    finalCustomerTotal: initialPrice,
    commissionBase,
    commissionRate: resolvedRate,
    serviceCommission,
    therapistFee,
    consumablesCost: resolvedConsumables,
    netSerenaRaga,
  };
}
