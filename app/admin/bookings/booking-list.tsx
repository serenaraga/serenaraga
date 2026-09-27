"use client";

import * as React from "react";
import { useRecordContext, useGetList } from "ra-core";
import { List } from "@/components/list";
import { DataTable, DataTableCol } from "@/components/data-table";
import { TextField } from "@/components/text-field";
import { NumberField } from "@/components/number-field";
import { BadgeField } from "@/components/badge-field";
import { ReferenceField } from "@/components/reference-field";
import { RowActions } from "@/components/row-actions";

/**
 * Component to display Assigned Therapist(s) for a booking.
 * Accurately resolves and displays multiple therapists (e.g. 2 therapists for Couple Package or multi-treatments).
 */
export const BookingAssignedTherapistsCol = () => {
  const record = useRecordContext();
  const { data: therapists = [] } = useGetList("therapists", {
    pagination: { page: 1, perPage: 100 },
  });

  const therapistNames = React.useMemo(() => {
    if (!record) return [];

    const names: string[] = [];
    const therapistMap = new Map<number, string>();
    therapists.forEach((t: any) => {
      if (t.id != null && t.name) {
        therapistMap.set(Number(t.id), t.name);
      }
    });

    // 1. Try parsing special_requests JSON if multi-items or couple split exists
    if (record.special_requests) {
      try {
        const trimmed = String(record.special_requests).trim();
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed.items) && parsed.items.length > 0) {
            parsed.items.forEach((it: any) => {
              if (it.therapist && typeof it.therapist === "string" && it.therapist.trim()) {
                names.push(it.therapist.trim());
              } else if (it.therapist_id && therapistMap.has(Number(it.therapist_id))) {
                names.push(therapistMap.get(Number(it.therapist_id))!);
              } else if (it.secondary_therapist_id && therapistMap.has(Number(it.secondary_therapist_id))) {
                names.push(therapistMap.get(Number(it.secondary_therapist_id))!);
              }
            });
          }
        }
      } catch (e) {}
    }

    // 2. Try relational_items if available
    if (names.length === 0 && Array.isArray(record.relational_items) && record.relational_items.length > 0) {
      record.relational_items.forEach((it: any) => {
        if (it.therapist_name_snapshot) {
          names.push(it.therapist_name_snapshot);
        } else if (it.therapist_id && therapistMap.has(Number(it.therapist_id))) {
          names.push(therapistMap.get(Number(it.therapist_id))!);
        }
      });
    }

    // 3. Fallback to primary therapist_id or therapists object if no multiple entries found
    if (names.length === 0) {
      if (record.therapist_id && therapistMap.has(Number(record.therapist_id))) {
        names.push(therapistMap.get(Number(record.therapist_id))!);
      } else if (record.therapists?.name) {
        names.push(record.therapists.name);
      }
    }

    // Deduplicate while preserving order
    return Array.from(new Set(names));
  }, [record, therapists]);

  if (therapistNames.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  if (therapistNames.length === 1) {
    return <span>{therapistNames[0]}</span>;
  }

  // Multi-therapist display (e.g. 2 therapists for Couple service)
  return (
    <div className="flex flex-col gap-0.5 py-0.5 leading-snug">
      {therapistNames.map((name, idx) => (
        <span key={idx} className="truncate">
          {name}
        </span>
      ))}
    </div>
  );
};

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
      <DataTableCol
        source="therapist_id"
        render={() => <BookingAssignedTherapistsCol />}
      />
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
