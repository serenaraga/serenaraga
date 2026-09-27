"use client";

import * as React from "react";
import { List } from "@/components/list";
import { DataTable, DataTableCol } from "@/components/data-table";
import { NumberField } from "@/components/number-field";
import { BadgeField } from "@/components/badge-field";
import { RowActions } from "@/components/row-actions";
import { PaymentMethodField } from "@/components/payment-method";

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
          <RowActions showEdit={false} />
        </DataTableCol>
      </DataTable>
    </List>
  );
};
