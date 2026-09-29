"use client";

import * as React from "react";
import { List } from "@/components/list";
import { DataTable, DataTableCol } from "@/components/data-table";
import { NumberField } from "@/components/number-field";
import { PaymentMethodField } from "@/components/payment-method";
import { BadgeField } from "@/components/badge-field";
import { RowActions } from "@/components/row-actions";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { PAYMENT_STATUS_CHOICES } from "@/components/status-badge";
import { resolveChoiceIcon } from "@/components/select-input";
import { useUpdate, useRefresh, useLocaleState, useRecordContext } from "ra-core";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check } from "lucide-react";

/**
 * Custom payment status actions embedded directly inside the 3-dots row actions dropdown
 */
export const InvoiceRowStatusActions = () => {
  const record = useRecordContext();
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const [update, { isPending }] = useUpdate();
  const refresh = useRefresh();
  const queryClient = useQueryClient();

  if (!record) return null;

  const currentStatus = record.payment_status || "unpaid";

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus || isPending) return;

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
    <>
      <DropdownMenuSeparator />
      {PAYMENT_STATUS_CHOICES.map((choice) => {
        const isCurrent = choice.value === currentStatus;
        return (
          <DropdownMenuItem
            key={choice.value}
            onClick={() => handleStatusChange(choice.value)}
            disabled={isPending}
            className="cursor-pointer justify-between gap-2 text-xs"
          >
            <div className="flex items-center gap-2">
              {resolveChoiceIcon(choice.value)}
              <span className={isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"}>
                {isEn ? choice.labelEn : choice.labelId}
              </span>
            </div>
            {isCurrent && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        );
      })}
    </>
  );
};

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
        <DataTableCol source="payment_method">
          <PaymentMethodField source="payment_method" />
        </DataTableCol>
        <DataTableCol source="payment_status">
          <BadgeField source="payment_status" />
        </DataTableCol>
        <DataTableCol label="ra.action.name" headerClassName="text-right w-16" cellClassName="text-right">
          <RowActions showEdit={false} customActions={<InvoiceRowStatusActions />} />
        </DataTableCol>
      </DataTable>
    </List>
  );
};
