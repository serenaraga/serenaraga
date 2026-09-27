import { formatDeduplicatedDescription } from "./utils";

export interface BookingFinancialInput {
  bookingPrice?: number | null;
  servicePrice?: number | null;
  consumablesCost?: number | null;
  commissionRate?: number | null;
  targetTherapistId?: number | string | null;
  additionalCharge?: number | null;
  additionalChargeDescription?: string | null;
  invoice?: {
    id?: number | string;
    invoice_number?: string;
    subtotal?: number | null;
    discount?: number | null;
    transport_fee?: number | null;
    additional_charge?: number | null;
    additional_charge_description?: string | null;
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
  bookingNotes?: string | null;
}

export interface BookingItemDetail {
  name: string;
  price: number;
  commission: number;
  bhp: number;
  therapist?: string;
  therapist_id?: number | null;
  transport_fee?: number;
  transport_fee_therapist_share?: number;
  additional_charge?: number;
  additional_charge_description?: string;
  additional_charge_therapist_share?: number;
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
  additionalCharge: number;
  additionalChargeDescription?: string;
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
    targetTherapistId = null,
    additionalCharge = 0,
    additionalChargeDescription = "",
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
    const invAdditionalCharge = Number(invoice.additional_charge || additionalCharge || 0);
    const invAdditionalChargeDesc = invoice.additional_charge_description || additionalChargeDescription || "";
    let totalAmount = Number(
      invoice.total_amount ?? Math.max(0, subtotal + transport + invAdditionalCharge - discount)
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

    // Determine if promo deducts from therapist commission (Post-Discount Policy)
    let isPostDiscount = false;
    if (discount > 0) {
      if (promotions && promotions.length > 0) {
        if (promoName) {
          const foundPromo = promotions.find(
            (p) =>
              p.name?.toLowerCase().trim() === promoName.toLowerCase().trim() ||
              p.code?.toLowerCase().trim() === promoName.toLowerCase().trim()
          );
          if (foundPromo) {
            isPostDiscount = Boolean(foundPromo.deduct_from_therapist_commission);
          } else {
            isPostDiscount = true;
          }
        } else {
          const activeDeductPromo = promotions.find((p) => p.deduct_from_therapist_commission);
          isPostDiscount = activeDeductPromo ? true : false;
        }
      } else {
        isPostDiscount = true;
      }
    }

    // If metadata with exact itemized calculation is present
    if (meta && Array.isArray(meta.items) && meta.items.length > 0) {
      const metaGross = Number(meta.gross_total ?? subtotal);
      const metaDisc = Number(meta.discount ?? discount);
      const metaAddCharge = Number(meta.additional_charge ?? invAdditionalCharge);
      const metaAddChargeDesc = meta.additional_charge_description || invAdditionalChargeDesc;
      const metaDpp = Number(meta.dpp ?? totalAmount);

      const isPureTransportItem = (it: any) => {
        const name = String(it.name || it.service_name || "").toLowerCase();
        return (
          name.includes("transport") ||
          name.includes("ongkir") ||
          name.includes("travel fee") ||
          name.includes("biaya perjalanan")
        );
      };

      // Sum of treatment services only (excluding pure transport line items)
      const treatmentGrossOnly = meta.items.reduce((acc: number, it: any) => {
        return isPureTransportItem(it) ? acc : acc + Number(it.price || 0);
      }, 0);

      // Recalculate each item's commission base and commission accurately
      const computedItems = meta.items.map((it: any) => {
        const itemPrice = Number(it.price || 0);
        const isTransport = isPureTransportItem(it);
        const itemTrans = Number(it.transport_fee || 0);
        const itemTransShare =
          it.transport_fee_therapist_share !== undefined
            ? Number(it.transport_fee_therapist_share)
            : itemTrans;
        const itemCharge = Number(it.additional_charge || 0);
        const itemChargeDesc = it.additional_charge_description || "";
        const itemBhp = Number(it.bhp || 0);

        if (isTransport) {
          return {
            ...it,
            price: itemPrice,
            basis_deduction: 0,
            commission: itemPrice, // 100% full allocation to therapist
            transport_fee: itemPrice,
            transport_fee_therapist_share: itemPrice,
            additional_charge: 0,
            additional_charge_description: "",
            additional_charge_therapist_share: 0,
            rate: 100,
            bhp: 0,
          };
        }

        const itemDeduction =
          isPostDiscount && treatmentGrossOnly > 0
            ? it.basis_deduction !== undefined
              ? Number(it.basis_deduction)
              : Math.round((itemPrice / treatmentGrossOnly) * metaDisc)
            : 0;
        const itemBasis = Math.max(0, itemPrice - itemDeduction);
        const itemRate = Number(it.rate) || resolvedRate;
        const serviceCommission = Math.round((itemBasis * itemRate) / 100);
        const itemChargeShare =
          it.additional_charge_therapist_share !== undefined
            ? Number(it.additional_charge_therapist_share)
            : Math.round((itemCharge * itemRate) / 100);
        const itemComm = serviceCommission + itemChargeShare;

        return {
          ...it,
          price: itemPrice,
          basis_deduction: itemDeduction,
          commission: itemComm,
          transport_fee: itemTrans,
          transport_fee_therapist_share: itemTransShare,
          additional_charge: itemCharge,
          additional_charge_description: itemChargeDesc,
          additional_charge_therapist_share: itemChargeShare,
          rate: itemRate,
          bhp: itemBhp,
        };
      });

      const treatmentItems = computedItems.filter((it: any) => !isPureTransportItem(it));
      const pureTransportItems = computedItems.filter((it: any) => isPureTransportItem(it));

      const calculatedTreatmentGross =
        treatmentItems.length > 0
          ? treatmentItems.reduce((acc: number, it: any) => acc + Number(it.price || 0), 0)
          : metaGross;

      const calculatedTreatmentCommission = treatmentItems.reduce(
        (acc: number, it: any) => acc + Number(it.commission || 0),
        0
      );

      const calculatedItemTransportShare = treatmentItems.reduce(
        (acc: number, it: any) =>
          acc +
          (it.transport_fee_therapist_share !== undefined
            ? Number(it.transport_fee_therapist_share)
            : Number(it.transport_fee || 0)),
        0
      );

      const calculatedItemTransportTotal = treatmentItems.reduce(
        (acc: number, it: any) => acc + Number(it.transport_fee || 0),
        0
      );

      const calculatedItemAdditionalCharges = treatmentItems.reduce(
        (acc: number, it: any) => acc + Number(it.additional_charge || 0),
        0
      );

      const pureTransportSum = pureTransportItems.reduce(
        (acc: number, it: any) => acc + Number(it.price || 0),
        0
      );

      const effectiveCustomerTransport =
        meta.transport_fee !== undefined
          ? Number(meta.transport_fee)
          : pureTransportSum > 0
          ? pureTransportSum + calculatedItemTransportTotal
          : transport || calculatedItemTransportTotal;

      const totalTherapistTransportPayout = pureTransportSum + calculatedItemTransportShare;

      const effectiveTotalAdditionalCharge =
        calculatedItemAdditionalCharges > 0
          ? calculatedItemAdditionalCharges
          : metaAddCharge;

      // If calculating specifically for targetTherapistId in payouts
      if (targetTherapistId != null) {
        const matchingItems = computedItems.filter(
          (it: any) => Number(it.therapist_id) === Number(targetTherapistId)
        );

        if (matchingItems.length > 0) {
          const matchingTreatmentItems = matchingItems.filter((it: any) => !isPureTransportItem(it));
          const matchingPureTransItems = matchingItems.filter((it: any) => isPureTransportItem(it));

          const therapistServiceComm = matchingTreatmentItems.reduce(
            (acc: number, it: any) => acc + Number(it.commission || 0),
            0
          );
          const therapistTransport =
            matchingPureTransItems.reduce((acc: number, it: any) => acc + Number(it.price || 0), 0) +
            matchingTreatmentItems.reduce(
              (acc: number, it: any) =>
                acc +
                (it.transport_fee_therapist_share !== undefined
                  ? Number(it.transport_fee_therapist_share)
                  : Number(it.transport_fee || 0)),
              0
            );

          const therapistCharge = matchingTreatmentItems.reduce(
            (acc: number, it: any) => acc + Number(it.additional_charge || 0),
            0
          );
          const therapistChargeDesc = matchingTreatmentItems.find((it: any) => it.additional_charge > 0)?.additional_charge_description || metaAddChargeDesc;

          const therapistBhp = matchingItems.reduce(
            (acc: number, it: any) => acc + Number(it.bhp || 0),
            0
          );
          // Total payout = Commission (Service + Charge share) + Transport share
          const totalTherapistPayout = therapistServiceComm + therapistTransport;
          const matchingGross = matchingTreatmentItems.reduce(
            (acc: number, it: any) => acc + Number(it.price || 0),
            0
          );
          const matchingDisc = matchingTreatmentItems.reduce(
            (acc: number, it: any) => acc + Number(it.basis_deduction || 0),
            0
          );

          return {
            hasInvoice: true,
            invoiceId: invoice.id,
            invoiceNumber: meta.invoice_number || invoice.invoice_number,
            treatmentGrossPrice: matchingGross,
            discountAmount: matchingDisc,
            appliedPromoName: promoName || undefined,
            isPostDiscountPolicy: isPostDiscount,
            transportFee: therapistTransport,
            additionalCharge: therapistCharge,
            additionalChargeDescription: therapistChargeDesc,
            finalCustomerTotal: matchingGross + therapistTransport + therapistCharge - matchingDisc,
            commissionBase: matchingGross - matchingDisc + therapistCharge,
            commissionRate: resolvedRate,
            serviceCommission: therapistServiceComm,
            therapistFee: totalTherapistPayout,
            consumablesCost: therapistBhp,
            netSerenaRaga: Math.max(0, (matchingGross + therapistCharge - matchingDisc) - totalTherapistPayout - therapistBhp),
            itemsList: matchingItems,
          };
        }
      }

      const totalTherapistPayout = calculatedTreatmentCommission + totalTherapistTransportPayout;
      const totalBhp = computedItems.reduce(
        (acc: number, it: any) => acc + Number(it.bhp || 0),
        0
      );
      const calculatedNetSerenaRaga = Math.max(0, metaDpp - totalTherapistPayout - totalBhp);

      const effectiveChargeDesc = formatDeduplicatedDescription(
        treatmentItems.map((it: any) => it.additional_charge_description) || metaAddChargeDesc
      );

      return {
        hasInvoice: true,
        invoiceId: invoice.id,
        invoiceNumber: meta.invoice_number || invoice.invoice_number,
        treatmentGrossPrice: calculatedTreatmentGross,
        discountAmount: metaDisc,
        appliedPromoName: promoName || undefined,
        isPostDiscountPolicy: isPostDiscount,
        transportFee: effectiveCustomerTransport,
        additionalCharge: effectiveTotalAdditionalCharge,
        additionalChargeDescription: effectiveChargeDesc,
        finalCustomerTotal: metaDpp,
        commissionBase: isPostDiscount ? (calculatedTreatmentGross - metaDisc + effectiveTotalAdditionalCharge) : (calculatedTreatmentGross + effectiveTotalAdditionalCharge),
        commissionRate: resolvedRate,
        serviceCommission: calculatedTreatmentCommission,
        therapistFee: totalTherapistPayout,
        consumablesCost: totalBhp,
        netSerenaRaga: calculatedNetSerenaRaga,
        itemsList: computedItems,
      };
    }

    // Commission Basis:
    // If post-discount policy -> (subtotal - discount + charge)
    // If pre-discount policy -> subtotal + charge
    const commissionBase = isPostDiscount
      ? Math.max(0, subtotal - discount) + invAdditionalCharge
      : subtotal + invAdditionalCharge;

    const serviceCommission = Math.round((commissionBase * resolvedRate) / 100);
    // Transport fee is 100% allocated to therapist (additional charge is shared via serviceCommission)
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
      additionalCharge: invAdditionalCharge,
      additionalChargeDescription: invAdditionalChargeDesc,
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
  // Check if booking notes has itemized metadata
  let bookingMeta: any = null;
  const rawNotes = input.invoice?.notes || (input as any).bookingNotes || "";
  if (rawNotes) {
    try {
      const trimmed = String(rawNotes).trim();
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        bookingMeta = JSON.parse(trimmed);
      }
    } catch (e) {}
  }

  const bookingItems = bookingMeta?.items || bookingMeta?.services || [];

  if (bookingMeta && Array.isArray(bookingItems) && bookingItems.length > 0) {
    const totalGross = bookingItems.reduce((acc: number, it: any) => acc + Number(it.price || 0), 0);
    const totalTransport = bookingItems.reduce((acc: number, it: any) => acc + Number(it.transport_fee || 0), 0);
    const totalAddCharge = bookingItems.reduce((acc: number, it: any) => acc + Number(it.additional_charge || 0), 0) || Number(additionalCharge || 0);
    const addChargeDesc = bookingItems.find((it: any) => it.additional_charge > 0)?.additional_charge_description || additionalChargeDescription || "";
    const totalComm = bookingItems.reduce((acc: number, it: any) => {
      const rate = Number(it.rate) || resolvedRate;
      const baseComm = Math.round((Number(it.price || 0) * rate) / 100);
      const transShare =
        it.transport_fee_therapist_share !== undefined
          ? Number(it.transport_fee_therapist_share)
          : Number(it.transport_fee || 0);
      const addChg = Number(it.additional_charge || 0);
      const addChgShare =
        it.additional_charge_therapist_share !== undefined
          ? Number(it.additional_charge_therapist_share)
          : Math.round((addChg * rate) / 100);
      return acc + baseComm + transShare + addChgShare;
    }, 0);
    const totalBhp = bookingItems.reduce((acc: number, it: any) => acc + Number(it.bhp || 0), 0);
    const grandTotal = totalGross + totalTransport + totalAddCharge;
    const netOwner = Math.max(0, grandTotal - totalComm - totalBhp);

    return {
      hasInvoice: false,
      treatmentGrossPrice: totalGross,
      discountAmount: 0,
      isPostDiscountPolicy: false,
      transportFee: totalTransport,
      additionalCharge: totalAddCharge,
      additionalChargeDescription: addChargeDesc,
      finalCustomerTotal: grandTotal,
      commissionBase: totalGross + totalAddCharge,
      commissionRate: resolvedRate,
      serviceCommission: Math.round(((totalGross + totalAddCharge) * resolvedRate) / 100),
      therapistFee: totalComm,
      consumablesCost: totalBhp,
      netSerenaRaga: netOwner,
      itemsList: bookingItems.map((it: any) => {
        const itemRate = Number(it.rate) || resolvedRate;
        const itemPrice = Number(it.price || 0);
        const itemCharge = Number(it.additional_charge || 0);
        const itemChargeShare =
          it.additional_charge_therapist_share !== undefined
            ? Number(it.additional_charge_therapist_share)
            : Math.round((itemCharge * itemRate) / 100);
        const itemTrans = Number(it.transport_fee || 0);
        const itemTransShare =
          it.transport_fee_therapist_share !== undefined
            ? Number(it.transport_fee_therapist_share)
            : itemTrans;
        return {
          ...it,
          commission: Math.round((itemPrice * itemRate) / 100) + itemChargeShare,
          transport_fee: itemTrans,
          transport_fee_therapist_share: itemTransShare,
          additional_charge: itemCharge,
          additional_charge_therapist_share: itemChargeShare,
        };
      }),
    };
  }

  const initialPrice = Number(bookingPrice || servicePrice || 0);
  const initialAddCharge = Number(additionalCharge || 0);
  const commissionBase = initialPrice + initialAddCharge;
  const serviceCommission = Math.round((commissionBase * resolvedRate) / 100);
  const therapistFee = serviceCommission;
  const grandTotal = initialPrice + initialAddCharge;
  const netSerenaRaga = Math.max(0, grandTotal - therapistFee - resolvedConsumables);

  return {
    hasInvoice: false,
    treatmentGrossPrice: initialPrice,
    discountAmount: 0,
    isPostDiscountPolicy: false,
    transportFee: 0,
    additionalCharge: initialAddCharge,
    additionalChargeDescription: additionalChargeDescription || "",
    finalCustomerTotal: grandTotal,
    commissionBase,
    commissionRate: resolvedRate,
    serviceCommission,
    therapistFee,
    consumablesCost: resolvedConsumables,
    netSerenaRaga,
  };
}
