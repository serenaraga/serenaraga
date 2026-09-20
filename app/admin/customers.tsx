"use client";

import { List } from "@/components/list";
import { DataTable, DataTableCol } from "@/components/data-table";
import { TextField } from "@/components/text-field";
import { EmailField } from "@/components/email-field";
import { Edit } from "@/components/edit";
import { Create } from "@/components/create";
import { Show } from "@/components/show";
import { SimpleForm } from "@/components/simple-form";
import { TextInput } from "@/components/text-input";
import { RowActions } from "@/components/row-actions";

export const CustomerList = () => (
  <List>
    <DataTable>
      <DataTableCol source="id" label="#" headerClassName="w-14" cellClassName="text-xs text-muted-foreground" />
      <DataTableCol source="full_name" cellClassName="font-medium text-foreground" />
      <DataTableCol source="phone" cellClassName="text-xs" />
      <DataTableCol source="email">
        <EmailField source="email" />
      </DataTableCol>
      <DataTableCol source="city_area" />
      <DataTableCol source="address" cellClassName="truncate max-w-xs text-xs text-muted-foreground" />
      <DataTableCol label="ra.action.name" headerClassName="text-right w-16" cellClassName="text-right">
        <RowActions />
      </DataTableCol>
    </DataTable>
  </List>
);

import { PhoneInput } from "@/components/phone-input";
import { useTranslate, useLocaleState } from "ra-core";

export const CustomerEdit = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <Edit title={isEn ? "Edit Customer" : "Ubah Data Pelanggan"}>
      <SimpleForm>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <TextInput source="full_name" required placeholder={isEn ? "e.g. John Doe" : "Contoh: Budi Santoso"} />
          <PhoneInput source="phone" required placeholder="812-3456-7890" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <TextInput source="email" placeholder="customer@example.com" />
          <TextInput source="city_area" placeholder={isEn ? "e.g. Jakarta Selatan" : "Contoh: Jakarta Selatan"} />
        </div>
        <TextInput source="address" multiline rows={2} required placeholder={isEn ? "Full delivery/service address..." : "Alamat lengkap pemesanan..."} />
        <TextInput source="notes" multiline rows={2} placeholder={isEn ? "Customer preferences, notes..." : "Catatan khusus pelanggan..."} />
      </SimpleForm>
    </Edit>
  );
};

export const CustomerCreate = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <Create title={isEn ? "Add Customer" : "Tambah Pelanggan Baru"}>
      <SimpleForm>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <TextInput source="full_name" required placeholder={isEn ? "e.g. John Doe" : "Contoh: Budi Santoso"} />
          <PhoneInput source="phone" required placeholder="812-3456-7890" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <TextInput source="email" placeholder="customer@example.com" />
          <TextInput source="city_area" defaultValue="Jakarta Selatan" placeholder={isEn ? "e.g. Jakarta Selatan" : "Contoh: Jakarta Selatan"} />
        </div>
        <TextInput source="address" multiline rows={2} required placeholder={isEn ? "Full delivery/service address..." : "Alamat lengkap pemesanan..."} />
        <TextInput source="notes" multiline rows={2} placeholder={isEn ? "Customer preferences, notes..." : "Catatan khusus pelanggan..."} />
      </SimpleForm>
    </Create>
  );
};

export const CustomerShow = () => {
  const translate = useTranslate();
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <Show title={isEn ? "Customer Details" : "Detail Pelanggan"}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-card rounded-xl border">
        <div>
          <div className="text-xs text-muted-foreground">{translate("resources.customers.fields.full_name")}</div>
          <div className="text-base font-semibold"><TextField source="full_name" /></div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{translate("resources.customers.fields.phone")}</div>
          <div className="text-sm font-medium"><TextField source="phone" /></div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{translate("resources.customers.fields.email")}</div>
          <div className="text-sm font-medium"><EmailField source="email" /></div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{translate("resources.customers.fields.city_area")}</div>
          <div className="text-sm font-medium"><TextField source="city_area" /></div>
        </div>
        <div className="md:col-span-2">
          <div className="text-xs text-muted-foreground">{translate("resources.customers.fields.address")}</div>
          <div className="text-sm font-medium mt-1"><TextField source="address" /></div>
        </div>
        <div className="md:col-span-2">
          <div className="text-xs text-muted-foreground">{translate("resources.customers.fields.notes")}</div>
          <div className="text-sm text-muted-foreground mt-1"><TextField source="notes" /></div>
        </div>
      </div>
    </Show>
  );
};
