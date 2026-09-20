"use client";

import { List } from "@/components/list";
import { DataTable, DataTableCol } from "@/components/data-table";
import { TextField } from "@/components/text-field";
import { NumberField } from "@/components/number-field";
import { BooleanField } from "@/components/boolean-field";
import { Edit } from "@/components/edit";
import { Create } from "@/components/create";
import { Show } from "@/components/show";
import { SimpleForm } from "@/components/simple-form";
import { TextInput } from "@/components/text-input";
import { NumberInput } from "@/components/number-input";
import { BooleanInput } from "@/components/boolean-input";
import { SelectInput } from "@/components/select-input";
import { RowActions } from "@/components/row-actions";

export const ServiceList = () => (
  <List>
    <DataTable>
      <DataTableCol source="id" label="#" headerClassName="w-14" cellClassName="text-xs text-muted-foreground" />
      <DataTableCol source="name" cellClassName="font-medium text-foreground" />
      <DataTableCol source="category" />
      <DataTableCol source="duration_minutes" cellClassName="text-xs" />
      <DataTableCol source="price" cellClassName="text-xs font-semibold">
        <NumberField
          source="price"
          options={{ style: "currency", currency: "IDR", maximumFractionDigits: 0 }}
        />
      </DataTableCol>
      <DataTableCol source="is_active">
        <BooleanField source="is_active" />
      </DataTableCol>
      <DataTableCol label="ra.action.name" headerClassName="text-right w-16" cellClassName="text-right">
        <RowActions />
      </DataTableCol>
    </DataTable>
  </List>
);

import { useTranslate, useLocaleState } from "ra-core";

export const ServiceEdit = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <Edit title={isEn ? "Edit Service" : "Ubah Data Layanan"}>
      <SimpleForm>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <TextInput source="name" required placeholder={isEn ? "e.g. Traditional Balinese Massage" : "Contoh: Traditional Balinese Massage"} />
          <SelectInput
            source="category"
            choices={[
              { id: "Body Massage", name: "Body Massage" },
              { id: "Therapeutic", name: "Therapeutic" },
              { id: "Reflexology", name: "Reflexology" },
              { id: "Spa & Relax", name: "Spa & Relax" },
              { id: "Specialized", name: "Specialized" },
              { id: "Body Treatment", name: "Body Treatment" },
            ]}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <NumberInput source="duration_minutes" label={isEn ? "Duration (Minutes)" : "Durasi (Menit)"} required />
          <NumberInput source="price" label={isEn ? "Price (IDR)" : "Harga (IDR)"} required />
        </div>
        <TextInput source="description" multiline rows={3} placeholder={isEn ? "Detailed treatment description..." : "Deskripsi manfaat dan metode layanan pijat..."} />
        <BooleanInput source="is_active" label={isEn ? "Active Service" : "Layanan Aktif"} />
      </SimpleForm>
    </Edit>
  );
};

export const ServiceCreate = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <Create title={isEn ? "Add Service" : "Tambah Layanan Baru"}>
      <SimpleForm>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <TextInput source="name" required placeholder={isEn ? "e.g. Traditional Balinese Massage" : "Contoh: Traditional Balinese Massage"} />
          <SelectInput
            source="category"
            defaultValue="Body Massage"
            choices={[
              { id: "Body Massage", name: "Body Massage" },
              { id: "Therapeutic", name: "Therapeutic" },
              { id: "Reflexology", name: "Reflexology" },
              { id: "Spa & Relax", name: "Spa & Relax" },
              { id: "Specialized", name: "Specialized" },
              { id: "Body Treatment", name: "Body Treatment" },
            ]}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <NumberInput source="duration_minutes" label={isEn ? "Duration (Minutes)" : "Durasi (Menit)"} defaultValue={60} required />
          <NumberInput source="price" label={isEn ? "Price (IDR)" : "Harga (IDR)"} defaultValue={150000} required />
        </div>
        <TextInput source="description" multiline rows={3} placeholder={isEn ? "Detailed treatment description..." : "Deskripsi manfaat dan metode layanan pijat..."} />
        <BooleanInput source="is_active" label={isEn ? "Active Service" : "Layanan Aktif"} defaultValue={true} />
      </SimpleForm>
    </Create>
  );
};

export const ServiceShow = () => {
  const translate = useTranslate();
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <Show title={isEn ? "Service Details" : "Detail Layanan"}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-card rounded-xl border">
        <div>
          <div className="text-xs text-muted-foreground">{translate("resources.services.fields.name")}</div>
          <div className="text-base font-semibold"><TextField source="name" /></div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{translate("resources.services.fields.category")}</div>
          <div className="text-sm font-medium"><TextField source="category" /></div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{translate("resources.services.fields.duration_minutes")}</div>
          <div className="text-sm font-medium"><NumberField source="duration_minutes" /> {isEn ? "Minutes" : "Menit"}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{translate("resources.services.fields.price")}</div>
          <div className="text-sm font-semibold text-primary">
            <NumberField
              source="price"
              options={{ style: "currency", currency: "IDR", maximumFractionDigits: 0 }}
            />
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="text-xs text-muted-foreground">{translate("resources.services.fields.description")}</div>
          <div className="text-sm text-foreground mt-1"><TextField source="description" /></div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{translate("resources.services.fields.is_active")}</div>
          <div className="text-sm mt-1"><BooleanField source="is_active" /></div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{translate("resources.services.fields.created_at")}</div>
          <div className="text-xs text-muted-foreground mt-1"><TextField source="created_at" /></div>
        </div>
      </div>
    </Show>
  );
};
