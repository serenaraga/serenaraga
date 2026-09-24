"use client";

import * as React from "react";
import type { RaRecord } from "ra-core";
import { useFieldValue } from "ra-core";
import { cn } from "@/lib/utils";
import type { FieldProps } from "@/lib/field.type";
import { resolveChoiceIcon } from "@/components/select-input";

export type PaymentMethodType = "qris" | "cash" | "bank_transfer";

export interface PaymentMethodOption {
  id: PaymentMethodType;
  value: PaymentMethodType;
  name: string;
  label: string;
}

export const PAYMENT_METHODS: PaymentMethodOption[] = [
  { id: "qris", value: "qris", name: "QRIS", label: "QRIS" },
  { id: "cash", value: "cash", name: "CASH", label: "CASH" },
  { id: "bank_transfer", value: "bank_transfer", name: "BANK TRANSFER", label: "BANK TRANSFER" },
];

/**
 * Normalizes and formats payment method code into standardized uppercase text
 */
export function getPaymentMethodLabel(method?: string | null): string {
  if (!method) return "-";
  const m = method.toLowerCase().trim();
  if (m === "qris") return "QRIS";
  if (m === "cash" || m === "tunai") return "CASH";
  if (m === "bank_transfer" || m === "transfer") return "BANK TRANSFER";
  return m.replace(/_/g, " ").toUpperCase();
}

/**
 * Standard visual badge for payment methods across the entire dashboard
 */
export const PaymentMethodBadge: React.FC<{
  method?: string | null;
  className?: string;
  showIcon?: boolean;
}> = ({ method, className, showIcon = true }) => {
  const label = getPaymentMethodLabel(method);
  const icon = showIcon && method ? resolveChoiceIcon(method) : null;

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

/**
 * RA-Core data table field for displaying payment methods
 */
export const PaymentMethodField = <RecordType extends RaRecord = RaRecord>({
  defaultValue,
  source,
  record,
  empty = "-",
  className,
  showIcon = true,
}: PaymentMethodFieldProps<RecordType>) => {
  const value = useFieldValue({ defaultValue, source, record });

  if (value == null || value === "") {
    return <span className="text-xs text-muted-foreground">{empty}</span>;
  }

  const strValue = typeof value !== "string" ? value.toString() : value;

  return (
    <PaymentMethodBadge
      method={strValue}
      className={className}
      showIcon={showIcon}
    />
  );
};

export interface PaymentMethodFieldProps<RecordType extends RaRecord = RaRecord>
  extends FieldProps<RecordType> {
  defaultValue?: any;
  className?: string;
  showIcon?: boolean;
}
