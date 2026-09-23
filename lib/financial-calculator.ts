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
  therapistFee: number;
  consumablesCost: number;
  netSerenaRaga: number;
}

/**
 * Calculates complete synchronized financial breakdown for a booking & its invoice.
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
    const subtotal = Number(
      invoice.subtotal ?? (invoice.total_amount ? invoice.total_amount : (bookingPrice || servicePrice || 0))
    );
    const discount = Number(invoice.discount || 0);
    const transport = Number(invoice.transport_fee || 0);
    const totalAmount = Number(
      invoice.total_amount ?? Math.max(0, subtotal + transport - discount)
    );

    // Detect applied promo from invoice notes or applied_promo_name
    let promoName = invoice.applied_promo_name || "";
    if (!promoName && invoice.notes && invoice.notes.includes("[Promo:")) {
      const match = invoice.notes.match(/\[Promo:\s*([^\]]+)\]/);
      if (match) promoName = match[1].trim();
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
        // If discount > 0 without explicit promo matching, check if any active promo has deduct_from_therapist_commission
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

    const therapistFee = Math.round((commissionBase * resolvedRate) / 100);
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
      therapistFee,
      consumablesCost: resolvedConsumables,
      netSerenaRaga,
    };
  }

  // Pre-Invoice Estimation (Before Invoice is issued)
  const initialPrice = Number(bookingPrice || servicePrice || 0);
  const commissionBase = initialPrice;
  const therapistFee = Math.round((commissionBase * resolvedRate) / 100);
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
    therapistFee,
    consumablesCost: resolvedConsumables,
    netSerenaRaga,
  };
}
