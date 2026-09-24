"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { resolveChoiceIcon } from "@/components/select-input";

export type BookingStatusType = "pending" | "confirmed" | "completed" | "canceled" | "cancelled";
export type PaymentStatusType = "unpaid" | "paid" | "refunded";
export type PayoutStatusType = "pending" | "paid";

export interface StatusOption<T extends string = string> {
  id: T;
  value: T;
  name: string;
  label?: string;
  labelId: string;
  labelEn: string;
}

export const BOOKING_STATUS_CHOICES: StatusOption<BookingStatusType>[] = [
  { id: "pending", value: "pending", name: "resources.bookings.status.pending", label: "Menunggu Konfirmasi", labelId: "Menunggu Konfirmasi", labelEn: "Pending Confirmation" },
  { id: "confirmed", value: "confirmed", name: "resources.bookings.status.confirmed", label: "Dikonfirmasi", labelId: "Dikonfirmasi", labelEn: "Confirmed" },
  { id: "completed", value: "completed", name: "resources.bookings.status.completed", label: "Selesai", labelId: "Selesai", labelEn: "Completed" },
  { id: "canceled", value: "canceled", name: "resources.bookings.status.canceled", label: "Dibatalkan", labelId: "Dibatalkan", labelEn: "Cancelled" },
];

export const PAYMENT_STATUS_CHOICES: StatusOption<PaymentStatusType>[] = [
  { id: "paid", value: "paid", name: "resources.bookings.payment_status.paid", label: "Lunas", labelId: "Lunas", labelEn: "Paid" },
  { id: "unpaid", value: "unpaid", name: "resources.bookings.payment_status.unpaid", label: "Belum Bayar", labelId: "Belum Bayar", labelEn: "Unpaid" },
  { id: "refunded", value: "refunded", name: "resources.bookings.payment_status.refunded", label: "Refund", labelId: "Refund", labelEn: "Refunded" },
];

export const PAYOUT_STATUS_CHOICES: StatusOption<PayoutStatusType>[] = [
  { id: "paid", value: "paid", name: "resources.payouts.payment_status.paid", label: "Sudah Ditransfer", labelId: "Sudah Ditransfer", labelEn: "Transferred" },
  { id: "pending", value: "pending", name: "resources.payouts.payment_status.pending", label: "Menunggu Transfer", labelId: "Menunggu Transfer", labelEn: "Pending Transfer" },
];

/**
 * Returns formatted select items with localized label for Shadcn Select
 */
export function getPaymentStatusSelectItems(isEn = false) {
  return PAYMENT_STATUS_CHOICES.map((item) => ({
    value: item.value,
    label: isEn ? item.labelEn : item.labelId,
  }));
}

/**
 * Returns formatted select items with localized label for Shadcn Select
 */
export function getBookingStatusSelectItems(isEn = false) {
  return BOOKING_STATUS_CHOICES.map((item) => ({
    value: item.value,
    label: isEn ? item.labelEn : item.labelId,
  }));
}

/**
 * Normalizes and formats payment status label
 */
export function getPaymentStatusLabel(status?: string | null, isEn = false): string {
  if (!status) return "-";
  const s = status.toLowerCase().trim();
  const match = PAYMENT_STATUS_CHOICES.find((item) => item.id === s);
  if (match) return isEn ? match.labelEn : match.labelId;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Normalizes and formats booking status label
 */
export function getBookingStatusLabel(status?: string | null, isEn = false): string {
  if (!status) return "-";
  const s = status.toLowerCase().trim();
  const match = BOOKING_STATUS_CHOICES.find((item) => item.id === s || (s === "cancelled" && item.id === "canceled"));
  if (match) return isEn ? match.labelEn : match.labelId;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Normalizes and formats payout status label
 */
export function getPayoutStatusLabel(status?: string | null, isEn = false): string {
  if (!status) return "-";
  const s = status.toLowerCase().trim();
  const match = PAYOUT_STATUS_CHOICES.find((item) => item.id === s);
  if (match) return isEn ? match.labelEn : match.labelId;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Standard visual badge for any status across the application with Lucide icons
 */
export const StatusBadge: React.FC<{
  status?: string | null;
  type?: "booking" | "payment" | "payout";
  isEn?: boolean;
  className?: string;
  showIcon?: boolean;
}> = ({ status, type = "payment", isEn = false, className, showIcon = true }) => {
  if (!status) return <span className="text-xs text-muted-foreground">-</span>;

  let label = status;
  if (type === "booking") {
    label = getBookingStatusLabel(status, isEn);
  } else if (type === "payout") {
    label = getPayoutStatusLabel(status, isEn);
  } else {
    label = getPaymentStatusLabel(status, isEn);
  }

  const icon = showIcon ? resolveChoiceIcon(status) : null;

  return (
    <span
      className={cn(
        "text-xs font-medium text-foreground whitespace-nowrap inline-flex items-center gap-1.5",
        className
      )}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
};
