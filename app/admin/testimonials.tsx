"use client";

import * as React from "react";
import {
  useRecordContext,
  useResourceContext,
  useCreatePath,
  LinkBase,
  useLocaleState,
  useTranslate,
  required,
} from "ra-core";
import { List } from "@/components/list";
import { DataTable, DataTableCol } from "@/components/data-table";
import { TextField } from "@/components/text-field";
import { NumberField } from "@/components/number-field";
import { DateField } from "@/components/date-field";
import { Edit } from "@/components/edit";
import { Create } from "@/components/create";
import { Show } from "@/components/show";
import { SimpleForm } from "@/components/simple-form";
import { TextInput } from "@/components/text-input";
import { NumberInput } from "@/components/number-input";
import { BooleanInput } from "@/components/boolean-input";
import { RowActions } from "@/components/row-actions";
import { HDFileUpload } from "@/components/hd-file-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Eye,
  MessageSquareQuote,
  CheckCircle2,
  XCircle,
  ImageIcon,
  Sparkles,
  Sliders,
  Layers,
} from "lucide-react";

/**
 * Thumbnail column with direct navigation to Testimonial Show page (Breadcrumb hierarchy)
 */
const ScreenshotThumbnailCol = () => {
  const record = useRecordContext();
  const createPath = useCreatePath();
  const resource = useResourceContext();

  if (!record || !record.image_url) {
    return (
      <div className="w-12 h-16 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
        <ImageIcon className="w-5 h-5 opacity-40" />
      </div>
    );
  }

  const showUrl = createPath({
    resource: resource || "testimonials",
    type: "show",
    id: record.id,
  });

  return (
    <LinkBase
      to={showUrl}
      className="group relative block w-12 h-16 rounded-md overflow-hidden bg-muted border border-border cursor-pointer shadow-xs hover:ring-2 hover:ring-primary/40 transition-all"
      title="Lihat detail testimoni"
    >
      <img
        src={record.image_url}
        alt={record.customer_name || "Screenshot Testimoni WhatsApp"}
        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
      />
      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
        <Eye className="w-4 h-4 text-white drop-shadow" />
      </div>
    </LinkBase>
  );
};

/**
 * Status column plain text (Live on Web / Hidden)
 */
const StatusCol = () => {
  const record = useRecordContext();
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  if (!record) return null;
  const isActive = record.is_active !== false;

  return (
    <span className="text-xs font-normal text-foreground">
      {isActive
        ? isEn
          ? "Live on Web"
          : "Tayang di Web"
        : isEn
        ? "Hidden"
        : "Disembunyikan"}
    </span>
  );
};

// ==========================================
// 1. TESTIMONIAL LIST VIEW
// ==========================================
export const TestimonialList = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <List
      title={
        isEn
          ? "Testimonials"
          : "Testimoni"
      }
    >
      <DataTable>
        <DataTableCol
          source="image_url"
          label={isEn ? "Screenshot" : "Tangkapan Layar"}
        >
          <ScreenshotThumbnailCol />
        </DataTableCol>

        <DataTableCol
          source="customer_name"
          label={isEn ? "Label / Note" : "Label / Keterangan"}
        >
          <TextField source="customer_name" defaultValue="Testimoni WhatsApp" />
        </DataTableCol>

        <DataTableCol
          source="is_active"
          label={isEn ? "Status" : "Status Tayang"}
        >
          <StatusCol />
        </DataTableCol>

        <DataTableCol
          source="sort_order"
          label={isEn ? "Order" : "Urutan"}
        >
          <NumberField source="sort_order" />
        </DataTableCol>

        <DataTableCol
          source="created_at"
          label={isEn ? "Date Uploaded" : "Tgl Unggah"}
        >
          <DateField source="created_at" showTime={false} />
        </DataTableCol>

        <DataTableCol
          source="actions"
          label={isEn ? "Actions" : "Aksi"}
        >
          <RowActions showView showEdit showDelete />
        </DataTableCol>
      </DataTable>
    </List>
  );
};

import { supabase } from "@/lib/supabase";

// ==========================================
// 2. TESTIMONIAL CREATE VIEW
// ==========================================
export const TestimonialCreate = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const [nextSortOrder, setNextSortOrder] = React.useState<number>(0);
  const [isFetched, setIsFetched] = React.useState(false);

  React.useEffect(() => {
    async function fetchNextSortOrder() {
      try {
        const { data, error } = await supabase
          .from("testimonials")
          .select("sort_order")
          .order("sort_order", { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0 && typeof data[0].sort_order === "number") {
          setNextSortOrder(data[0].sort_order + 1);
        } else {
          setNextSortOrder(0);
        }
      } catch (err) {
        console.warn("Could not fetch next sort order:", err);
      } finally {
        setIsFetched(true);
      }
    }
    fetchNextSortOrder();
  }, []);

  return (
    <Create
      title={
        isEn
          ? "Add Testimonial"
          : "Tambah Testimoni"
      }
    >
      <SimpleForm
        key={isFetched ? `form-${nextSortOrder}` : "loading-form"}
        defaultValues={{
          customer_name: "Testimoni WhatsApp",
          is_active: true,
          sort_order: nextSortOrder,
        }}
      >
        <Card className="border border-border/70 shadow-none bg-card mb-4">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-500" />
              <span>
                {isEn ? "WhatsApp Chat Screenshot Image" : "Gambar Screenshot Chat WhatsApp"}
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              {isEn
                ? "Upload the original client chat screenshot. You can blur out phone numbers or names before uploading."
                : "Unggah screenshot chat WhatsApp asli dari pelanggan. Fitur sensor/blur akan otomatis terbuka agar Anda dapat menutup nomor HP atau nama pribadi."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <HDFileUpload
              source="image_url"
              label={
                isEn
                  ? "WhatsApp Chat Screenshot Image"
                  : "Screenshot Chat WhatsApp Asli"
              }
              bucketName="testimonials"
              fileType="image"
              enableBlurTool={true}
              maxDimension={2048}
              quality={0.94}
              required
              helperText={
                isEn
                  ? "Select a PNG, JPG, or WebP screenshot. Safe and crisp HD quality."
                  : "Pilih file gambar screenshot. File tersimpan aman di Supabase Storage bucket testimonials."
              }
            />
          </CardContent>
        </Card>

        <Card className="border border-border/70 shadow-none bg-card">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sliders className="w-4 h-4 text-muted-foreground" />
              <span>
                {isEn
                  ? "Display Settings"
                  : "Pengaturan Tayang di Landing Page"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <TextInput
              source="customer_name"
              label={isEn ? "Label / Note (Optional)" : "Label / Keterangan (Opsional)"}
              placeholder={
                isEn
                  ? "e.g. Testimonial 01 or Client Jogja"
                  : "Contoh: Testimoni 01 atau Bu Maya (Sleman)"
              }
              defaultValue="Testimoni WhatsApp"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <BooleanInput
                source="is_active"
                label={isEn ? "Live on Landing Page" : "Aktif (Tayang di Landing Page)"}
                defaultValue={true}
              />

              <NumberInput
                source="sort_order"
                label={
                  isEn
                    ? `Sort Order (Auto: ${nextSortOrder})`
                    : `Urutan Tampil (Otomatis: ${nextSortOrder})`
                }
                helperText={
                  isEn
                    ? "Auto-incremented from latest (+1). You can also edit manually."
                    : "Otomatis bertambah +1 dari urutan terakhir. Anda juga dapat mengubahnya secara manual."
                }
                defaultValue={nextSortOrder}
                min={0}
              />
            </div>
          </CardContent>
        </Card>
      </SimpleForm>
    </Create>
  );
};

// ==========================================
// 3. TESTIMONIAL EDIT VIEW
// ==========================================
export const TestimonialEdit = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <Edit
      title={
        isEn
          ? "Edit Testimonial"
          : "Edit Testimoni"
      }
    >
      <SimpleForm>
        <Card className="border border-border/70 shadow-none bg-card mb-4">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-500" />
              <span>
                {isEn ? "Screenshot Image" : "Gambar Tangkapan Layar"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <HDFileUpload
              source="image_url"
              label={
                isEn
                  ? "WhatsApp Chat Screenshot *"
                  : "Screenshot Chat WhatsApp Asli *"
              }
              bucketName="testimonials"
              fileType="image"
              enableBlurTool={true}
              maxDimension={2048}
              quality={0.94}
              required
            />
          </CardContent>
        </Card>

        <Card className="border border-border/70 shadow-none bg-card">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sliders className="w-4 h-4 text-muted-foreground" />
              <span>
                {isEn
                  ? "Display Settings"
                  : "Pengaturan Tayang"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <TextInput
              source="customer_name"
              label={isEn ? "Label / Note (Optional)" : "Label / Keterangan (Opsional)"}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <BooleanInput
                source="is_active"
                label={isEn ? "Live on Landing Page" : "Aktif (Tayang di Landing Page)"}
              />

              <NumberInput
                source="sort_order"
                label={isEn ? "Sort Order (0 = Top)" : "Urutan Tampil (0 = Paling Atas)"}
                min={0}
              />
            </div>
          </CardContent>
        </Card>
      </SimpleForm>
    </Edit>
  );
};

// ==========================================
// 4. TESTIMONIAL SHOW VIEW
// ==========================================
const TestimonialShowContent = () => {
  const record = useRecordContext();
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  if (!record) return null;

  return (
    <div className="max-w-4xl space-y-6 pb-8">
      <Card className="border border-border shadow-xs bg-card">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MessageSquareQuote className="w-4 h-4 text-emerald-500" />
              <span>{record.customer_name || "Testimoni WhatsApp"}</span>
            </CardTitle>
            <StatusCol />
          </div>
        </CardHeader>
        <CardContent className="pt-6 flex flex-col items-center">
          {record.image_url ? (
            <div className="w-full flex justify-center p-4 sm:p-6 bg-muted/30 dark:bg-muted/10 rounded-lg border border-border/50">
              <img
                src={record.image_url}
                alt={record.customer_name || "WhatsApp Screenshot"}
                className="max-h-[720px] w-auto max-w-full object-contain rounded-md shadow-lg"
              />
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center text-muted-foreground space-y-2">
              <ImageIcon className="w-10 h-10 opacity-30" />
              <p className="text-xs">
                {isEn ? "No screenshot image uploaded." : "Tidak ada file gambar screenshot."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export const TestimonialShow = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <Show
      title={
        isEn
          ? "Testimonial Detail"
          : "Detail Testimoni"
      }
    >
      <TestimonialShowContent />
    </Show>
  );
};
