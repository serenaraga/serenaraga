"use client";

import * as React from "react";
import { List } from "@/components/list";
import { DataTable, DataTableCol } from "@/components/data-table";
import { TextField } from "@/components/text-field";
import { NumberField } from "@/components/number-field";
import { BadgeField } from "@/components/badge-field";
import { ReferenceField } from "@/components/reference-field";
import { RowActions } from "@/components/row-actions";

/**
 * Main Booking List Table View
 */
export const BookingList = () => (
  <List>
    <DataTable>
      <DataTableCol
        source="id"
        label="#"
        headerClassName="w-14"
        cellClassName="text-xs font-bold text-primary"
      />
      <DataTableCol source="booking_date" />
      <DataTableCol
        source="booking_time"
        cellClassName="text-xs"
      />
      <DataTableCol source="customer_id">
        <ReferenceField source="customer_id" reference="customers">
          <TextField source="full_name" />
        </ReferenceField>
      </DataTableCol>
      <DataTableCol source="service_id">
        <ReferenceField source="service_id" reference="services">
          <TextField source="name" />
        </ReferenceField>
      </DataTableCol>
      <DataTableCol source="therapist_id">
        <ReferenceField source="therapist_id" reference="therapists">
          <TextField source="name" />
        </ReferenceField>
      </DataTableCol>
      <DataTableCol source="total_price" cellClassName="text-xs font-semibold">
        <NumberField
          source="total_price"
          options={{ style: "currency", currency: "IDR", maximumFractionDigits: 0 }}
        />
      </DataTableCol>
      <DataTableCol source="status">
        <BadgeField source="status" />
      </DataTableCol>
      <DataTableCol source="payment_status">
        <BadgeField source="payment_status" />
      </DataTableCol>
      <DataTableCol label="ra.action.name" headerClassName="text-right w-16" cellClassName="text-right">
        <RowActions showCreateInvoice={true} />
      </DataTableCol>
    </DataTable>
  </List>
);
