"use client";

import * as React from "react";
import { useUpdate, useRefresh, useLocaleState } from "ra-core";
import { useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAYMENT_STATUS_CHOICES } from "@/components/status-badge";
import { resolveChoiceIcon } from "@/components/select-input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface InvoicePaymentStatusSelectProps {
  record: any;
  className?: string;
}

/**
 * Seamless, standard payment status selector for Invoices.
 * Uses exact standard payment status names (Paid / Unpaid / Refunded / Lunas / Belum Bayar / Refund)
 * and automatically triggers bidirectional sync with linked bookings and accounting.
 */
export const InvoicePaymentStatusSelect: React.FC<InvoicePaymentStatusSelectProps> = ({
  record,
  className,
}) => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const [update, { isPending }] = useUpdate();
  const refresh = useRefresh();
  const queryClient = useQueryClient();

  const currentStatus = record?.payment_status || "unpaid";

  const handleStatusChange = async (newStatus: string) => {
    if (!record?.id || newStatus === currentStatus || isPending) return;

    try {
      await update(
        "invoices",
        {
          id: record.id,
          data: {
            ...record,
            payment_status: newStatus,
          },
          previousData: record,
        },
        {
          mutationMode: "pessimistic",
          onSuccess: () => {
            refresh();
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
            queryClient.invalidateQueries({ queryKey: ["bookings"] });
            queryClient.invalidateQueries({ queryKey: ["financials"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });

            const choice = PAYMENT_STATUS_CHOICES.find((c) => c.value === newStatus);
            const label = isEn ? choice?.labelEn || newStatus : choice?.labelId || newStatus;
            toast.success(label);
          },
          onError: (err: any) => {
            toast.error(err?.message || "Failed to update status");
          },
        }
      );
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status");
    }
  };

  return (
    <Select
      value={currentStatus}
      onValueChange={handleStatusChange}
      disabled={isPending}
    >
      <SelectTrigger
        className={cn(
          "h-6 text-xs px-1.5 py-0 font-medium rounded border-0 border-none shadow-none bg-transparent hover:bg-muted/60 focus-visible:ring-0 focus:ring-0 focus:outline-none shrink-0 w-auto gap-1 text-foreground cursor-pointer transition-colors",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5 truncate">
          {resolveChoiceIcon(currentStatus)}
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent align="end" className="text-xs">
        {PAYMENT_STATUS_CHOICES.map((choice) => (
          <SelectItem key={choice.value} value={choice.value} className="text-xs py-1.5 cursor-pointer">
            <div className="flex items-center gap-2">
              {resolveChoiceIcon(choice.value)}
              <span>{isEn ? choice.labelEn : choice.labelId}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
