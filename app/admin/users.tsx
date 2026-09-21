"use client";

import * as React from "react";
import { List } from "@/components/list";
import { DataTable, DataTableCol } from "@/components/data-table";
import { TextField } from "@/components/text-field";
import { BooleanField } from "@/components/boolean-field";
import { Edit } from "@/components/edit";
import { Create } from "@/components/create";
import { SimpleForm } from "@/components/simple-form";
import { TextInput } from "@/components/text-input";
import { SelectInput } from "@/components/select-input";
import { BooleanInput } from "@/components/boolean-input";
import { RowActions } from "@/components/row-actions";
import { useRecordContext, useLocaleState, required } from "ra-core";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShieldCheck, UserCheck, ShieldAlert, User, Key, Mail, Phone, Check } from "lucide-react";

/**
 * Custom field for rendering User with avatar and role
 */
const UserCardField = () => {
  const record = useRecordContext();
  if (!record) return null;

  const initial = record.full_name?.charAt(0).toUpperCase() || "U";
  const isAdmin = record.role === "admin";

  return (
    <div className="flex items-center gap-2.5 py-1">
      <Avatar className="h-8 w-8 rounded-lg ring-1 ring-border/50">
        <AvatarImage src={record.avatar_url} alt={record.full_name} />
        <AvatarFallback className="rounded-lg text-xs font-semibold bg-primary/10 text-primary">
          {initial}
        </AvatarFallback>
      </Avatar>
      <div className="grid text-left text-xs leading-tight">
        <span className="font-semibold text-foreground truncate max-w-[160px]">
          {record.full_name}
        </span>
        <span className="text-[11px] text-muted-foreground truncate max-w-[160px]">
          {record.username || record.email}
        </span>
      </div>
    </div>
  );
};

/**
 * Custom Role Badge Field (Clean & Seamless)
 */
const RoleBadgeField = () => {
  const record = useRecordContext();
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  if (!record) return null;

  const isAdmin = record.role === "admin";

  return (
    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
      {isAdmin ? (
        <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
      ) : (
        <UserCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
      )}
      <span>{isAdmin ? (isEn ? "Administrator" : "Admin / Owner") : (isEn ? "Cashier / Staff" : "Kasir / Staf")}</span>
    </div>
  );
};

/**
 * Active Status Badge Field (Clean & Seamless)
 */
const StatusBadgeField = () => {
  const record = useRecordContext();
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  if (!record) return null;

  const isActive = record.is_active !== false;

  return (
    <span className="text-xs font-medium text-foreground">
      {isActive ? (isEn ? "Active" : "Aktif") : (isEn ? "Inactive" : "Nonaktif")}
    </span>
  );
};

/**
 * User List View (Only accessible by Admin)
 */
export const UserList = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <List title={isEn ? "Staff Accounts" : "Kelola Akun Staf"}>
      <DataTable>
        <DataTableCol
          source="full_name"
          label={isEn ? "Staff" : "Nama Staf"}
        >
          <UserCardField />
        </DataTableCol>
        <DataTableCol
          source="role"
          label="Role / Peran"
        >
          <RoleBadgeField />
        </DataTableCol>
        <DataTableCol
          source="phone"
          label={isEn ? "Phone" : "No. Telepon"}
          render={(record) => (
            <span className="text-xs text-muted-foreground">
              {record.phone || "-"}
            </span>
          )}
        />
        <DataTableCol
          source="is_active"
          label="Status"
        >
          <StatusBadgeField />
        </DataTableCol>
        <DataTableCol
          source="created_at"
          label={isEn ? "Created" : "Terdaftar"}
          render={(record) => (
            <span className="text-[11px] text-muted-foreground">
              {record.created_at
                ? new Date(record.created_at).toLocaleDateString(
                    isEn ? "en-US" : "id-ID",
                    { day: "numeric", month: "short", year: "numeric" }
                  )
                : "-"}
            </span>
          )}
        />
        <DataTableCol
          label={isEn ? "Actions" : "Aksi"}
          headerClassName="text-right w-16"
          cellClassName="text-right"
        >
          <RowActions />
        </DataTableCol>
      </DataTable>
    </List>
  );
};

/**
 * User Create View
 */
export const UserCreate = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <Create title={isEn ? "Add New Staff Account" : "Tambah Akun Staf Baru"}>
      <SimpleForm defaultValues={{ role: "cashier", is_active: true }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <TextInput
            source="full_name"
            label={isEn ? "Full Name *" : "Nama Lengkap Staf *"}
            placeholder={isEn ? "e.g. Budi (Cashier Shift A)" : "Contoh: Budi (Kasir Shift Pagi)"}
            validate={required()}
          />
          <TextInput
            source="username"
            label={isEn ? "Username / Login Email *" : "Username / Email Login *"}
            placeholder={isEn ? "kasir1@serenaraga.com" : "kasir1@serenaraga.com atau kasir1"}
            validate={required()}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <TextInput
            source="password"
            label={isEn ? "Login Password *" : "Kata Sandi Login *"}
            type="password"
            placeholder="••••••••"
            validate={required()}
          />
          <SelectInput
            source="role"
            label="Role / Peran *"
            choices={[
              { id: "cashier", name: isEn ? "Kasir / Cashier (Bookings & Invoices only)" : "Kasir (Hanya Booking & Invoice)" },
              { id: "admin", name: isEn ? "Administrator (Full Access)" : "Administrator (Akses Penuh)" },
            ]}
            validate={required()}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <TextInput
            source="phone"
            label={isEn ? "Phone Number" : "No. Telepon / WhatsApp"}
            placeholder="0812..."
          />
          <BooleanInput
            source="is_active"
            label={isEn ? "Active Account" : "Akun Aktif (Bisa Login)"}
          />
        </div>
      </SimpleForm>
    </Create>
  );
};

/**
 * User Edit View
 */
export const UserEdit = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <Edit title={isEn ? "Edit Staff Account" : "Ubah Data Akun Staf"}>
      <SimpleForm>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <TextInput
            source="full_name"
            label={isEn ? "Full Name *" : "Nama Lengkap Staf *"}
            validate={required()}
          />
          <TextInput
            source="username"
            label={isEn ? "Username / Login Email *" : "Username / Email Login *"}
            validate={required()}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <TextInput
            source="password"
            label={isEn ? "New Password (leave empty to keep current)" : "Kata Sandi Baru (Kosongkan jika tidak ingin diubah)"}
            type="password"
            placeholder="••••••••"
          />
          <SelectInput
            source="role"
            label="Role / Peran *"
            choices={[
              { id: "cashier", name: isEn ? "Kasir / Cashier (Bookings & Invoices only)" : "Kasir (Hanya Booking & Invoice)" },
              { id: "admin", name: isEn ? "Administrator (Full Access)" : "Administrator (Akses Penuh)" },
            ]}
            validate={required()}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <TextInput
            source="phone"
            label={isEn ? "Phone Number" : "No. Telepon / WhatsApp"}
          />
          <BooleanInput
            source="is_active"
            label={isEn ? "Active Account" : "Akun Aktif (Bisa Login)"}
          />
        </div>
      </SimpleForm>
    </Edit>
  );
};
