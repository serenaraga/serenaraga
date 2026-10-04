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
import { PhoneInput } from "@/components/phone-input";
import { RowActions } from "@/components/row-actions";
import { useRecordContext, useLocaleState, required } from "ra-core";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ShieldCheck, UserCheck, ShieldAlert, User, Key, Mail, Phone, Lock, Check } from "lucide-react";
import { standardizePhoneNumber } from "@/lib/utils";

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
            <span className="text-xs font-mono text-muted-foreground">
              {standardizePhoneNumber(record.phone) || record.phone || "-"}
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
 * Shared Clean & Modern Staff Form Layout using Shadcn Cards
 */
const UserFormContent = ({ isEdit = false }: { isEdit?: boolean }) => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <div className="space-y-5 max-w-4xl w-full">
      {/* 1. Card: Staff Identity & Login Account */}
      <Card className="border border-border/70 shadow-none bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <User className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                {isEn ? "Staff Identity & Account Credentials" : "Identitas Staf & Akun Login"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {isEn
                  ? "Enter staff full name, login username, password, and system role."
                  : "Masukkan nama lengkap staf, username login, kata sandi, serta hak akses sistem."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start w-full">
            <TextInput
              source="full_name"
              label={isEn ? "Full Name" : "Nama Lengkap Staf"}
              placeholder={isEn ? "e.g. Budi (Cashier Shift A)" : "Contoh: Budi (Kasir Shift Pagi)"}
              validate={required(isEn ? "Full name is required" : "Nama lengkap wajib diisi")}
            />
            <TextInput
              source="username"
              label={isEn ? "Username / Login ID" : "Username / ID Login"}
              placeholder={isEn ? "kasir1 / kasir1@serenaraga.com" : "kasir1 atau kasir1@serenaraga.com"}
              validate={required(isEn ? "Username is required" : "Username login wajib diisi")}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start w-full pt-1">
            <TextInput
              source="password"
              label={
                isEdit
                  ? isEn
                    ? "New Password (Leave empty to keep)"
                    : "Kata Sandi Baru (Kosongkan jika tidak diubah)"
                  : isEn
                  ? "Login Password"
                  : "Kata Sandi Login"
              }
              type="password"
              placeholder="••••••••"
              validate={isEdit ? undefined : required(isEn ? "Password is required" : "Kata sandi wajib diisi")}
            />
            <SelectInput
              source="role"
              label={isEn ? "Role & Access Level" : "Role / Hak Akses"}
              choices={[
                {
                  id: "cashier",
                  name: isEn
                    ? "Kasir (Bookings, Invoices & POS)"
                    : "Kasir / Staf (Booking, Invoice & POS)",
                },
                {
                  id: "admin",
                  name: isEn
                    ? "Administrator (Full Access & Settings)"
                    : "Administrator (Akses Penuh & Pengaturan)",
                },
              ]}
              validate={required(isEn ? "Role is required" : "Role wajib dipilih")}
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. Card: Contact Details & Account Status */}
      <Card className="border border-border/70 shadow-none bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                {isEn ? "Contact Details & Account Status" : "Kontak Staf & Status Akun"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {isEn
                  ? "Active WhatsApp phone number, optional email, and login permission."
                  : "Nomor WhatsApp aktif, email opsional, serta izin aktifasi login staf."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start w-full">
            <PhoneInput
              source="phone"
              label={isEn ? "Phone / WhatsApp" : "No. Telepon / WhatsApp"}
              placeholder="812-3456-7890"
            />
            <TextInput
              source="email"
              label={isEn ? "Email Address (Optional)" : "Email Staf (Opsional)"}
              placeholder="budi@serenaraga.com"
            />
          </div>

          <div className="pt-2 border-t border-border/40">
            <BooleanInput
              source="is_active"
              label={isEn ? "Account Active (Permit login)" : "Akun Aktif (Dapat Login ke Sistem)"}
              defaultValue={true}
            />
          </div>
        </CardContent>
      </Card>
    </div>
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
        <UserFormContent isEdit={false} />
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
        <UserFormContent isEdit={true} />
      </SimpleForm>
    </Edit>
  );
};
