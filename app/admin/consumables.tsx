"use client";

import * as React from "react";
import {
  useRecordContext,
  useTranslate,
  useLocaleState,
  useGetResourceLabel,
  useNavigate,
  required,
  LinkBase,
  Translate,
} from "ra-core";
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
import { SelectInput } from "@/components/select-input";
import { BooleanInput } from "@/components/boolean-input";
import { RowActions } from "@/components/row-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Boxes,
  ArrowLeft,
  Plus,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  PackageCheck,
  Tag,
  Scale,
  DollarSign,
  FileText,
  Droplet,
  Droplets,
  Package,
  Leaf,
  Shirt,
} from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { supabase } from "@/lib/supabase";

import { formatIDR } from "@/lib/utils";

/**
 * Consumable Unit Choices
 */
export const consumableUnits = [
  { id: "ml", name: "Mililiter (ml)" },
  { id: "gram", name: "Gram (gr)" },
  { id: "pcs", name: "Pcs (Buah / Lembar)" },
  { id: "set", name: "Set / Paket" },
  { id: "tetes", name: "Tetes (Drops)" },
];

/**
 * Consumable Category Choices
 */
export const consumableCategories = [
  { id: "Oil & Lotion", name: "Minyak & Losion Pijat" },
  { id: "Scrub & Lulur", name: "Scrub & Lulur Tubuh" },
  { id: "Essential Oil", name: "Minyak Aromaterapi" },
  { id: "Spa Supplies", name: "Perlengkapan Spa" },
  { id: "Linen & Hygiene", name: "Linen & Higienitas" },
];

import { CreateButton } from "@/components/create-button";
import { ExportButton } from "@/components/export-button";

/**
 * Custom Actions for ConsumableList: Back to Services, Create, Export
 */
export const ConsumableListActions = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button variant="outline" asChild className="cursor-pointer">
        <LinkBase to="/services">
          <ArrowLeft />
          <span>{isEn ? "Services" : "Kembali ke Layanan"}</span>
        </LinkBase>
      </Button>
      <CreateButton />
      <ExportButton />
    </div>
  );
};

export const ConsumableList = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <List
      resource="consumables"
      title={isEn ? "Consumables & Supplies" : "Bahan Habis Pakai"}
      actions={<ConsumableListActions />}
    >
        <DataTable>
          <DataTableCol
            source="id"
            label="#"
            headerClassName="w-14"
            cellClassName="text-xs text-muted-foreground font-mono"
          />
          <DataTableCol
            source="name"
            label={isEn ? "Item Name" : "Nama Bahan"}
            cellClassName="font-medium text-foreground text-xs"
          />
          <DataTableCol
            source="category"
            label={isEn ? "Category" : "Kategori"}
            cellClassName="text-xs text-muted-foreground"
          />
          <DataTableCol
            source="unit"
            label={isEn ? "Unit" : "Satuan"}
            headerClassName="text-center w-24"
            cellClassName="text-center text-xs font-mono"
          />
          <DataTableCol
            source="cost_per_unit"
            label={isEn ? "Cost / Unit" : "Biaya / Satuan"}
            headerClassName="text-right w-36"
            cellClassName="text-right text-xs font-semibold text-foreground"
            render={(record) => (
              <span>
                {formatIDR(record.cost_per_unit)} / <span className="font-mono text-muted-foreground">{record.unit || "unit"}</span>
              </span>
            )}
          />
          <DataTableCol
            source="stock_quantity"
            label={isEn ? "Stock" : "Stok"}
            headerClassName="text-right w-32"
            cellClassName="text-right text-xs"
            render={(record) => {
              const isLow = Number(record.stock_quantity || 0) <= Number(record.min_stock_alert || 0);
              return (
                <span className={`font-medium ${isLow ? "text-amber-600 dark:text-amber-400 font-bold" : "text-foreground"}`}>
                  {Number(record.stock_quantity || 0).toLocaleString("id-ID")} {record.unit || ""}
                </span>
              );
            }}
          />
          <DataTableCol
            source="is_active"
            label={isEn ? "Status" : "Status"}
            headerClassName="w-20 text-center"
            cellClassName="text-center"
          >
            <BooleanField source="is_active" className="w-4 h-4 text-foreground" />
          </DataTableCol>
          <DataTableCol
            label="ra.action.name"
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
 * Consumable Create Form
 */
/**
 * Shared Clean & Modern Consumable Form Layout using Shadcn Cards
 */
const ConsumableFormContent = ({ mode = "create" }: { mode?: "create" | "edit" }) => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <div className="space-y-5 max-w-4xl">
      {/* 1. Card: Basic Information */}
      <Card className="border border-border/70 shadow-none bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                {isEn ? "General Material Information" : "Informasi Dasar Bahan"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {isEn
                  ? "Specify the name and primary category of the consumable product."
                  : "Tentukan nama bahan habis pakai dan kategori perawatan terkait."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <TextInput
              source="name"
              label={isEn ? "Consumable Name" : "Nama Bahan Habis Pakai"}
              placeholder={isEn ? "e.g. Pure Olive Massage Oil" : "Contoh: Minyak Pijat Zaitun Murni"}
              validate={required(isEn ? "Consumable name is required" : "Nama bahan wajib diisi")}
              required
            />
            <SelectInput
              source="category"
              label={isEn ? "Treatment Category" : "Kategori Perawatan"}
              defaultValue="Oil & Lotion"
              choices={consumableCategories}
              required
            />
          </div>

          {/* Active Status Setting Box */}
          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-foreground block">
                {isEn ? "Active for Service Recipes" : "Status Penggunaan Bahan"}
              </span>
              <p className="text-[11px] text-muted-foreground">
                {isEn
                  ? "When active, this consumable can be selected in massage service composition recipes."
                  : "Bahan aktif dapat dipilih saat meracik komposisi HPP di menu layanan pijat."}
              </p>
            </div>
            <BooleanInput
              source="is_active"
              label={isEn ? "Active" : "Bahan Aktif"}
              defaultValue={true}
              className="m-0 self-start sm:self-center"
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. Card: Cost & Inventory Management */}
      <Card className="border border-border/70 shadow-none bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                {isEn ? "Unit Cost & Inventory Tracking" : "Biaya Pokok (HPP) & Manajemen Stok"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {isEn
                  ? "Define measurement metrics, cost per unit, and stock alert thresholds."
                  : "Atur satuan takaran, biaya pokok per unit, dan batas minimum peringatan stok."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
            <SelectInput
              source="unit"
              label={isEn ? "Measurement Unit" : "Satuan Takaran"}
              defaultValue="ml"
              choices={consumableUnits}
              required
            />
            <NumberInput
              source="cost_per_unit"
              label={isEn ? "Cost per Unit (IDR)" : "Biaya Pokok per Unit (IDR)"}
              helperText={isEn ? "Cost for 1 unit (e.g. Rp 150 / ml)" : "Harga modal untuk 1 satuan"}
              defaultValue={mode === "create" ? 150 : undefined}
              min={0}
              required
            />
            <NumberInput
              source="stock_quantity"
              label={isEn ? "Available Stock" : "Estimasi Stok Tersedia"}
              helperText={isEn ? "Current inventory in storage" : "Jumlah persediaan fisik saat ini"}
              defaultValue={mode === "create" ? 1000 : undefined}
              min={0}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start pt-2 border-t border-border/40">
            <NumberInput
              source="min_stock_alert"
              label={isEn ? "Low Stock Threshold" : "Batas Minimum Peringatan Stok"}
              helperText={isEn ? "Alerts when stock falls below this level" : "Sistem akan menandai warna kuning saat stok menipis"}
              defaultValue={mode === "create" ? 200 : undefined}
              min={0}
            />
            <div className="p-3 rounded-lg bg-muted/20 border border-border/50 text-[11px] text-muted-foreground space-y-1">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>{isEn ? "Cost Formula Hint" : "Tips Kalkulasi HPP"}</span>
              </span>
              <p>
                {isEn
                  ? "Standard massage session usually consumes 30-50 ml of oil or 25-40 gram of body scrub."
                  : "Standar 1 sesi pijat tubuh 60-90 menit rata-rata menghabiskan 30-50 ml minyak atau 25-40 gr lulur."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Card: Supplier & Additional Notes */}
      <Card className="border border-border/70 shadow-none bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                {isEn ? "Supplier & Material Notes" : "Informasi Supplier & Catatan Tambahan"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {isEn
                  ? "Store procurement details, vendor contacts, or preparation instructions."
                  : "Catat nama supplier, informasi batch pengadaan, atau petunjuk takaran khusus."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <TextInput
            source="notes"
            label={isEn ? "Internal Notes / Supplier Info" : "Catatan Internal & Kontak Supplier"}
            placeholder={isEn ? "e.g. CV Aromatherapy Bali, contact 0812..., dilution ratio 1:5" : "Contoh: Supplier CV Aroma Sejahtera, kontak 0812..., rasio pencampuran 1:5"}
            multiline
            rows={3}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export const ConsumableCreate = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <Create title={isEn ? "Add New Consumable" : "Tambah Bahan Habis Pakai Baru"}>
      <SimpleForm>
        <ConsumableFormContent mode="create" />
      </SimpleForm>
    </Create>
  );
};

export const ConsumableEdit = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <Edit title={isEn ? "Edit Consumable" : "Ubah Data Bahan Habis Pakai"}>
      <SimpleForm>
        <ConsumableFormContent mode="edit" />
      </SimpleForm>
    </Edit>
  );
};

/**
 * Consumable Show Detail View
 */
const ConsumableShowView = () => {
  const record = useRecordContext();
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const [associatedServices, setAssociatedServices] = React.useState<any[]>([]);
  const [loadingServices, setLoadingServices] = React.useState(false);

  React.useEffect(() => {
    const recordId = record?.id;
    if (!recordId) return;
    async function loadServices() {
      try {
        setLoadingServices(true);
        const { data } = await supabase
          .from("service_consumables")
          .select("*, services(id, name, price, duration_minutes)")
          .eq("consumable_id", recordId);
        setAssociatedServices(data || []);
      } finally {
        setLoadingServices(false);
      }
    }
    loadServices();
  }, [record?.id]);

  if (!record) return null;

  const isLowStock = Number(record.stock_quantity || 0) <= Number(record.min_stock_alert || 0);

  return (
    <div className="space-y-6">
      {/* Header Profile Card */}
      <div className="rounded-xl border border-border/70 bg-card p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">{record.name}</h2>
              <span className="text-xs text-muted-foreground font-mono">
                ({record.category || "General"})
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {isEn ? "Cost per Unit:" : "Biaya per Satuan:"}{" "}
              <span className="font-semibold text-foreground">
                {formatIDR(record.cost_per_unit)} / {record.unit || "unit"}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-foreground">
              {record.is_active !== false ? (isEn ? "Active" : "Aktif") : (isEn ? "Inactive" : "Nonaktif")}
            </span>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <Card className="border border-border/70 bg-card shadow-none">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" />
              <span>{isEn ? "Unit & Stock Information" : "Informasi Satuan & Stok"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground block text-[11px]">{isEn ? "Unit" : "Satuan"}</span>
                <span className="font-semibold text-foreground">{record.unit || "ml"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">{isEn ? "Unit Cost" : "Biaya Pokok / Unit"}</span>
                <span className="font-bold text-foreground">{formatIDR(record.cost_per_unit)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
              <div>
                <span className="text-muted-foreground block text-[11px]">{isEn ? "Current Stock" : "Stok Tersedia"}</span>
                <span className={`font-bold text-sm ${isLowStock ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
                  {Number(record.stock_quantity || 0).toLocaleString("id-ID")} {record.unit || ""}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">{isEn ? "Min Stock Alert" : "Batas Minimum"}</span>
                <span className="font-medium text-muted-foreground">
                  {Number(record.min_stock_alert || 0).toLocaleString("id-ID")} {record.unit || ""}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-border/50">
              <span className="text-muted-foreground block text-[11px]">{isEn ? "Notes" : "Catatan / Supplier"}</span>
              <p className="font-medium text-foreground mt-0.5">{record.notes || "-"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Services Using this Consumable */}
        <Card className="border border-border/70 bg-card shadow-none">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <span>{isEn ? "Services Utilizing this Material" : "Layanan yang Menggunakan Bahan Ini"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            {loadingServices ? (
              <p className="text-xs text-muted-foreground">{isEn ? "Loading services..." : "Memuat daftar layanan..."}</p>
            ) : associatedServices.length === 0 ? (
              <Empty className="min-h-[140px] py-6 border-dashed border-border/60 bg-muted/10">
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="h-9 w-9 [&_svg]:h-4 [&_svg]:w-4 mb-1">
                    <Layers className="text-muted-foreground" />
                  </EmptyMedia>
                  <EmptyTitle className="text-xs">
                    {isEn ? "No linked services" : "Belum ada layanan terkait"}
                  </EmptyTitle>
                  <EmptyDescription className="text-[11px]">
                    {isEn
                      ? "This material is not yet assigned to any massage or spa service."
                      : "Bahan ini belum ditautkan ke menu layanan pijat atau perawatan manapun."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="divide-y divide-border/50">
                {associatedServices.map((item) => (
                  <div key={item.id} className="py-2 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground text-xs">{item.services?.name || `Layanan #${item.service_id}`}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {isEn ? "Usage:" : "Takaran:"} <span className="font-mono text-foreground font-medium">{item.quantity} {record.unit}</span> ({formatIDR(item.total_cost || (item.quantity * record.cost_per_unit))})
                      </p>
                    </div>
                    <LinkBase
                      to={`/services/${item.service_id}/show`}
                      className="text-xs text-primary hover:underline"
                    >
                      {isEn ? "View Service" : "Buka Layanan"}
                    </LinkBase>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const ConsumableShow = () => {
  return (
    <Show>
      <ConsumableShowView />
    </Show>
  );
};
