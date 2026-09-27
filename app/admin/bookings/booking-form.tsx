"use client";

import * as React from "react";
import { useWatch, useFormContext } from "react-hook-form";
import {
  useLocaleState,
  useNotify,
  useRedirect,
  useGetList,
  useRecordContext,
  required,
} from "ra-core";
import { Edit } from "@/components/edit";
import { Create } from "@/components/create";
import { SimpleForm } from "@/components/simple-form";
import { TextInput } from "@/components/text-input";
import { SelectInput } from "@/components/select-input";
import { DatePickerInput } from "@/components/date-picker-input";
import { TimePickerInput } from "@/components/time-picker-input";
import { ReferenceInput } from "@/components/reference-input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin } from "lucide-react";
import { BOOKING_STATUS_CHOICES, PAYMENT_STATUS_CHOICES } from "@/components/status-badge";
import { PAYMENT_METHODS } from "@/components/payment-method";
import { formatIDR } from "@/lib/utils";
import { CustomerAutoSuggestField } from "./customer-suggest";
import { BookingRepeater, type BookingItemRow } from "./booking-repeater";

export const useTherapistOptionText = () => {
  const [locale] = useLocaleState();
  return (choice: any) => {
    if (!choice) return "";
    const status = choice.status;
    const label =
      status === "available"
        ? locale === "en"
          ? "Available"
          : "Tersedia"
        : status === "on_duty"
          ? locale === "en"
            ? "On Duty"
            : "Sedang Bertugas"
          : locale === "en"
            ? "Off Duty"
            : "Libur";
    return `${choice.name} (${label})`;
  };
};

export const useServiceOptionText = () => {
  const [locale] = useLocaleState();
  return (choice: any) => {
    if (!choice) return "";
    const formattedPrice = formatIDR(choice.price);
    const durationUnit = locale === "en" ? "mins" : "mnt";
    return `${choice.name} (${choice.duration_minutes} ${durationUnit} • ${formattedPrice})`;
  };
};

/**
 * Shared Clean & Modern Booking Form Layout using Shadcn Cards & Dynamic Multi-Item Repeater
 */
export const BookingFormContent = ({ mode = "create" }: { mode?: "create" | "edit" }) => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const record = useRecordContext();
  const { setValue, register } = useFormContext();

  const { data: services = [] } = useGetList("services", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "name", order: "ASC" },
  });
  const { data: therapists = [] } = useGetList("therapists", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "name", order: "ASC" },
  });

  // Parse initial items from record if in edit mode (checking 3NF relational_items and JSON metadata)
  const [items, setItems] = React.useState<BookingItemRow[]>(() => {
    if (mode === "edit" && record) {
      if (Array.isArray(record.relational_items) && record.relational_items.length > 0) {
        return record.relational_items.map((it: any, idx: number) => ({
          id: `item-${idx}-${Date.now()}`,
          service_id: it.service_id || null,
          therapist_id: it.therapist_id || null,
          price: Number(it.price || 0),
          transport_fee: Number(it.transport_fee || 0),
          additional_charge: Number(it.additional_charge || 0),
          additional_charge_description: it.additional_charge_description || "",
        }));
      }
      if (record.special_requests) {
        try {
          const trimmed = String(record.special_requests).trim();
          if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed.items) && parsed.items.length > 0) {
              return parsed.items.map((it: any, idx: number) => ({
                id: `item-${idx}-${Date.now()}`,
                service_id: it.service_id || null,
                therapist_id: it.therapist_id || null,
                price: Number(it.price || 0),
                transport_fee: Number(it.transport_fee || 0),
                additional_charge: Number(it.additional_charge || 0),
                additional_charge_description: it.additional_charge_description || "",
              }));
            }
          }
        } catch (e) {}
      }
      return [
        {
          id: `item-1-${Date.now()}`,
          service_id: record.service_id || null,
          therapist_id: record.therapist_id || null,
          price: Number(record.total_price || 0),
          transport_fee: 0,
          additional_charge: 0,
          additional_charge_description: "",
        },
      ];
    }
    return [
      {
        id: `item-1-${Date.now()}`,
        service_id: null,
        therapist_id: null,
        price: 0,
        transport_fee: 0,
        additional_charge: 0,
        additional_charge_description: "",
      },
    ];
  });

  // Extract clean customer notes string
  const [customerNotes, setCustomerNotes] = React.useState<string>(() => {
    if (mode === "edit" && record?.special_requests) {
      try {
        const trimmed = String(record.special_requests).trim();
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
          const parsed = JSON.parse(trimmed);
          return parsed.raw_notes || parsed.notes || "";
        }
      } catch (e) {}
      return record.special_requests;
    }
    return "";
  });

  // Synchronize items with react-hook-form values
  const syncFormValues = React.useCallback(
    (currentItems: BookingItemRow[], notes: string) => {
      const itemsTotal = currentItems.reduce((acc, it) => {
        const isCoupleSplit = it.is_couple && it.therapist_mode === "couple_split";
        const p1 = Number(it.price) || 0;
        const p2 = isCoupleSplit ? Number(it.secondary_price) || 0 : 0;
        return acc + p1 + p2;
      }, 0);

      const totalTransport = currentItems.reduce((acc, it) => {
        const isCoupleSplit = it.is_couple && it.therapist_mode === "couple_split";
        const t1 = Number(it.transport_fee) || 0;
        const t2 = isCoupleSplit ? Number(it.secondary_transport_fee) || 0 : 0;
        return acc + t1 + t2;
      }, 0);

      const totalAdditionalCharge = currentItems.reduce((acc, it) => {
        const isCoupleSplit = it.is_couple && it.therapist_mode === "couple_split";
        const c1 = Number(it.additional_charge) || 0;
        const c2 = isCoupleSplit ? Number(it.secondary_additional_charge) || 0 : 0;
        return acc + c1 + c2;
      }, 0);

      const totalPrice = itemsTotal + totalTransport + totalAdditionalCharge;
      setValue("total_price", totalPrice, { shouldValidate: true, shouldDirty: true });

      const firstItem = currentItems[0];
      if (firstItem) {
        setValue("service_id", firstItem.service_id, { shouldValidate: true, shouldDirty: true });
        setValue("therapist_id", firstItem.therapist_id, { shouldValidate: true, shouldDirty: true });
      }

      // Serialize metadata into special_requests (Splits couple items into transparent per-therapist sub-entries for payroll & financial reporting)
      const serializedItems: any[] = [];

      currentItems.forEach((it) => {
        const s = services.find((x: any) => Number(x.id) === Number(it.service_id));
        const isCoupleSplit = it.is_couple && it.therapist_mode === "couple_split";

        if (isCoupleSplit) {
          const t1 = therapists.find((x: any) => Number(x.id) === Number(it.therapist_id));
          const t2 = therapists.find((x: any) => Number(x.id) === Number(it.secondary_therapist_id));
          const rate1 = Number(t1?.commission_rate || 60);
          const rate2 = Number(t2?.commission_rate || 60);

          const price1 = Number(it.price || 0);
          const price2 = Number(it.secondary_price || 0);
          const trans1 = Number(it.transport_fee || 0);
          const trans2 = Number(it.secondary_transport_fee || 0);
          const transShare1 = it.transport_fee_therapist_share !== undefined ? Number(it.transport_fee_therapist_share) : trans1;
          const transShare2 = it.secondary_transport_fee_therapist_share !== undefined ? Number(it.secondary_transport_fee_therapist_share) : trans2;
          const addChg1 = Number(it.additional_charge || 0);
          const addChg2 = Number(it.secondary_additional_charge || 0);
          const addChgShare1 = it.additional_charge_therapist_share !== undefined ? Number(it.additional_charge_therapist_share) : Math.round((addChg1 * rate1) / 100);
          const addChgShare2 = it.secondary_additional_charge_therapist_share !== undefined ? Number(it.secondary_additional_charge_therapist_share) : Math.round((addChg2 * rate2) / 100);
          const addDesc1 = it.additional_charge_description || "";
          const addDesc2 = it.secondary_additional_charge_description || "";

          const comm1 = Math.round((price1 * rate1) / 100) + transShare1 + addChgShare1;
          const comm2 = Math.round((price2 * rate2) / 100) + transShare2 + addChgShare2;

          const totalBhp = Number(s?.consumables_cost || 0);
          const halfBhp = Math.round(totalBhp / 2);

          // Sub-item 1
          serializedItems.push({
            service_id: it.service_id,
            name: `${s?.name || "Couple Package"} (Terapis #1: ${t1?.name || "Terapis 1"})`,
            parent_package_name: s?.name || "Couple Package",
            is_couple_package: true,
            package_total_price: price1 + price2,
            therapist_id: it.therapist_id,
            therapist: t1?.name || "Terapis 1",
            rate: rate1,
            price: price1,
            transport_fee: trans1,
            transport_fee_therapist_share: transShare1,
            additional_charge: addChg1,
            additional_charge_description: addDesc1,
            additional_charge_therapist_share: addChgShare1,
            commission: comm1,
            bhp: halfBhp,
          });

          // Sub-item 2
          serializedItems.push({
            service_id: it.service_id,
            name: `${s?.name || "Couple Package"} (Terapis #2: ${t2?.name || "Terapis 2"})`,
            parent_package_name: s?.name || "Couple Package",
            is_couple_package: true,
            package_total_price: price1 + price2,
            therapist_id: it.secondary_therapist_id,
            therapist: t2?.name || "Terapis 2",
            rate: rate2,
            price: price2,
            transport_fee: trans2,
            transport_fee_therapist_share: transShare2,
            additional_charge: addChg2,
            additional_charge_description: addDesc2,
            additional_charge_therapist_share: addChgShare2,
            commission: comm2,
            bhp: totalBhp - halfBhp,
          });
        } else {
          const t = therapists.find((x: any) => Number(x.id) === Number(it.therapist_id));
          const rate = Number(t?.commission_rate || 60);
          const price = Number(it.price || 0);
          const transport = Number(it.transport_fee || 0);
          const transShare = it.transport_fee_therapist_share !== undefined ? Number(it.transport_fee_therapist_share) : transport;
          const addCharge = Number(it.additional_charge || 0);
          const addChargeDesc = it.additional_charge_description || "";
          const addChargeShare = it.additional_charge_therapist_share !== undefined ? Number(it.additional_charge_therapist_share) : Math.round((addCharge * rate) / 100);
          const comm = Math.round((price * rate) / 100) + transShare + addChargeShare;

          serializedItems.push({
            service_id: it.service_id,
            name: s?.name || "Layanan",
            therapist_id: it.therapist_id,
            therapist: t?.name || "Terapis",
            rate,
            price,
            transport_fee: transport,
            transport_fee_therapist_share: transShare,
            additional_charge: addCharge,
            additional_charge_description: addChargeDesc,
            additional_charge_therapist_share: addChargeShare,
            commission: comm,
            bhp: Number(s?.consumables_cost || 0),
          });
        }
      });

      const payload = {
        items: serializedItems,
        transport_fee: totalTransport,
        additional_charge: totalAdditionalCharge,
        raw_notes: notes,
      };

      setValue("special_requests", JSON.stringify(payload), { shouldDirty: true });
    },
    [services, therapists, setValue]
  );

  const handleAddItem = () => {
    const newItems = [
      ...items,
      {
        id: `item-${Date.now()}-${Math.random()}`,
        service_id: null,
        therapist_id: null,
        price: 0,
        transport_fee: 0,
        additional_charge: 0,
        additional_charge_description: "",
      },
    ];
    setItems(newItems);
    syncFormValues(newItems, customerNotes);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    const newItems = items.filter((_, idx) => idx !== index);
    setItems(newItems);
    syncFormValues(newItems, customerNotes);
  };

  const handleItemChange = (index: number, updatedFields: Partial<BookingItemRow>) => {
    const newItems = items.map((it, idx) => {
      if (idx === index) {
        return {
          ...it,
          ...updatedFields,
        };
      }
      return it;
    });
    setItems(newItems);
    syncFormValues(newItems, customerNotes);
  };

  const handleNotesChange = (text: string) => {
    setCustomerNotes(text);
    syncFormValues(items, text);
  };

  return (
    <div className="space-y-5 max-w-4xl overflow-visible">
      {/* Hidden inputs required by react-admin & database schema */}
      <input type="hidden" {...register("service_id")} />
      <input type="hidden" {...register("therapist_id")} />
      <input type="hidden" {...register("total_price")} />
      <input type="hidden" {...register("special_requests")} />

      {/* 1. Card: Customer Information & Schedule */}
      <Card className="border border-border/70 shadow-none bg-card overflow-visible">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                {isEn ? "Customer Details & Schedule" : "Informasi Pelanggan & Jadwal Layanan"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {isEn
                  ? "Specify customer contact details and preferred date/time slot."
                  : "Tentukan identitas pemesan serta tanggal dan jam pelayanan pijat."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4 overflow-visible">
          {mode === "create" ? (
            <CustomerAutoSuggestField />
          ) : (
            <ReferenceInput source="customer_id" reference="customers">
              <SelectInput
                optionText="full_name"
                label={isEn ? "Customer" : "Pelanggan Terdaftar"}
                validate={required(isEn ? "Customer is required" : "Pelanggan wajib dipilih")}
                required
              />
            </ReferenceInput>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-2 border-t border-border/40">
            <DatePickerInput
              source="booking_date"
              label={isEn ? "Booking Date" : "Tanggal Reservasi"}
              defaultValue={mode === "create" ? new Date().toISOString().split("T")[0] : undefined}
              validate={required(isEn ? "Date is required" : "Tanggal wajib dipilih")}
              required
            />
            <TimePickerInput
              source="booking_time"
              label={isEn ? "Booking Time" : "Jam Pelayanan"}
              defaultValue={mode === "create" ? "10:00" : undefined}
              validate={required(isEn ? "Time is required" : "Jam wajib ditentukan")}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. Card: Seamless Multi-Service & Therapist Repeater with Couple Package Support */}
      <BookingRepeater
        items={items}
        services={services}
        therapists={therapists}
        isEn={isEn}
        onAddItem={handleAddItem}
        onRemoveItem={handleRemoveItem}
        onItemChange={handleItemChange}
      />

      {/* 3. Card: Service Address, Status & Payment */}
      <Card className="border border-border/70 shadow-none bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                {isEn ? "Service Address, Payment & Status" : "Lokasi Pelayanan, Pembayaran & Status"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {isEn
                  ? "Enter destination address, notes, order workflow status, and payment channel."
                  : "Alamat lengkap kunjungan ke rumah/hotel/apartemen serta status pembayaran pesanan."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <TextInput
            source="service_address"
            label={isEn ? "Service Destination Address" : "Alamat Lengkap Lokasi Layanan"}
            placeholder={
              isEn
                ? "e.g. Jl. Senopati No. 12, Kebayoran Baru, Jakarta Selatan (Tower A, Unit 12B)"
                : "Contoh: Jl. Senopati No. 12, Kebayoran Baru, Jakarta Selatan (Apartemen Sudirman Tower A Unit 12B)"
            }
            multiline
            rows={2}
            validate={required(isEn ? "Address is required" : "Alamat layanan wajib diisi")}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start pt-2 border-t border-border/40">
            <SelectInput
              source="status"
              label={isEn ? "Order Status" : "Status Pesanan"}
              defaultValue="pending"
              choices={BOOKING_STATUS_CHOICES}
            />
            <SelectInput
              source="payment_method"
              label={isEn ? "Payment Method" : "Metode Pembayaran"}
              defaultValue="qris"
              choices={PAYMENT_METHODS}
            />
            <SelectInput
              source="payment_status"
              label={isEn ? "Payment Status" : "Status Pembayaran"}
              defaultValue="unpaid"
              choices={PAYMENT_STATUS_CHOICES}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              {isEn ? "Special Requests / Health Notes" : "Catatan Khusus / Keluhan Pelanggan"}
            </label>
            <Input
              value={customerNotes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder={
                isEn
                  ? "e.g. Focus on stiff shoulder, medium pressure, avoid neck"
                  : "Contoh: Fokus pundak kaku, tekanan sedang, hindari area leher karena sensitif"
              }
              className="h-9 text-xs bg-background"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const BookingEdit = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const notify = useNotify();
  const redirect = useRedirect();

  return (
    <Edit
      title={isEn ? "Edit Booking" : "Ubah Data Reservasi"}
      mutationMode="pessimistic"
      mutationOptions={{
        onSuccess: () => {
          notify(isEn ? "Booking updated successfully" : "Data reservasi berhasil diperbarui", {
            type: "success",
          });
          redirect("list", "bookings");
        },
        onError: (err: any) => {
          notify(
            isEn
              ? "Failed to update booking: " + err.message
              : "Gagal memperbarui reservasi: " + (err.message || err),
            { type: "error" }
          );
        },
      }}
    >
      <SimpleForm>
        <BookingFormContent mode="edit" />
      </SimpleForm>
    </Edit>
  );
};

export const BookingCreate = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const notify = useNotify();
  const redirect = useRedirect();

  return (
    <Create
      title={isEn ? "Create New Booking" : "Buat Reservasi Baru"}
      mutationMode="pessimistic"
      mutationOptions={{
        onSuccess: () => {
          notify(isEn ? "Booking created successfully" : "Reservasi baru berhasil dibuat", {
            type: "success",
          });
          redirect("list", "bookings");
        },
        onError: (err: any) => {
          notify(
            isEn
              ? "Failed to create booking: " + err.message
              : "Gagal membuat reservasi: " + (err.message || err),
            { type: "error" }
          );
        },
      }}
    >
      <SimpleForm>
        <BookingFormContent mode="create" />
      </SimpleForm>
    </Create>
  );
};
