"use client";

import * as React from "react";
import {
  useRecordContext,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
 * Thumbnail column with click-to-zoom Dialog modal for WhatsApp Screenshots
 */
const ScreenshotThumbnailCol = () => {
  const record = useRecordContext();
  const [isOpen, setIsOpen] = React.useState(false);

  if (!record || !record.image_url) {
    return (
      <div className="w-12 h-16 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
        <ImageIcon className="w-5 h-5 opacity-40" />
      </div>
    );
  }

  return (
    <>
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className="group relative w-12 h-16 rounded-md overflow-hidden bg-muted border border-border cursor-pointer shadow-xs hover:ring-2 hover:ring-primary/40 transition-all"
        title="Klik untuk melihat screenshot penuh"
      >
        <img
          src={record.image_url}
          alt={record.customer_name || "Screenshot Testimoni WhatsApp"}
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <Eye className="w-4 h-4 text-white drop-shadow" />
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-4 flex flex-col items-center">
          <DialogHeader className="w-full text-left pb-2 border-b border-border">
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <MessageSquareQuote className="w-4 h-4 text-muted-foreground" />
              <span>{record.customer_name || "Testimoni WhatsApp"}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="w-full overflow-y-auto max-h-[75vh] flex items-center justify-center p-2 bg-muted/30 rounded-lg">
            <img
              src={record.image_url}
              alt="Full WhatsApp Screenshot"
              className="max-w-full max-h-[70vh] rounded-md shadow-lg object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

/**
 * Status column badge (Active / Hidden)
 */
const StatusCol = () => {
  const record = useRecordContext();
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  if (!record) return null;
  const isActive = record.is_active !== false;

  return isActive ? (
    <Badge
      variant="outline"
      className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-medium gap-1 py-0.5"
    >
      <CheckCircle2 className="w-3 h-3" />
      <span>{isEn ? "Live on Web" : "Tayang di Web"}</span>
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="bg-muted text-muted-foreground border-border text-[10px] font-medium gap-1 py-0.5"
    >
      <XCircle className="w-3 h-3" />
      <span>{isEn ? "Hidden" : "Disembunyikan"}</span>
    </Badge>
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
          ? "WhatsApp Testimonial Screenshots"
          : "Screenshot Testimoni WhatsApp"
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
          ? "Upload WhatsApp Testimonial Screenshot"
          : "Tambah Screenshot Testimoni WhatsApp"
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
                {isEn ? "WhatsApp Chat Screenshot Image *" : "Gambar Screenshot Chat WhatsApp *"}
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
                  ? "WhatsApp Chat Screenshot Image *"
                  : "Screenshot Chat WhatsApp Asli *"
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
          ? "Edit WhatsApp Testimonial"
          : "Edit Testimoni WhatsApp"
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
export const TestimonialShow = () => {
  const record = useRecordContext();
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <Show
      title={
        isEn
          ? "WhatsApp Testimonial Detail"
          : "Detail Testimoni WhatsApp"
      }
    >
      <div className="max-w-3xl space-y-6 pb-8">
        <Card className="border border-border shadow-xs">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MessageSquareQuote className="w-4 h-4 text-emerald-500" />
                <span>{record?.customer_name || "Testimoni WhatsApp"}</span>
              </CardTitle>
              <StatusCol />
            </div>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col items-center">
            {record?.image_url ? (
              <div className="w-full flex justify-center p-4 bg-stone-950/40 rounded-lg">
                <img
                  src={record.image_url}
                  alt="WhatsApp Screenshot"
                  className="max-h-[600px] w-auto object-contain rounded shadow-lg"
                />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Tidak ada gambar.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </Show>
  );
};
