"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  QrCode,
  UploadCloud,
  Trash2,
  ExternalLink,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface QrisImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  isEn?: boolean;
}

export function QrisImageUploader({
  value,
  onChange,
  isEn = false,
}: QrisImageUploaderProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);
  const [manualMode, setManualMode] = React.useState(false);
  const [previewError, setPreviewError] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Upload file directly to Supabase Storage ('brand-assets' bucket)
  const uploadFile = async (file: File) => {
    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      toast.error(
        isEn
          ? "Invalid file type. Please upload a PNG, JPG, WEBP, or SVG image."
          : "Format file tidak valid. Harap unggah gambar format PNG, JPG, WEBP, atau SVG."
      );
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(
        isEn
          ? "File size exceeds 5MB limit. Please compress the image."
          : "Ukuran file melebihi batas 5MB. Silakan kompres gambar terlebih dahulu."
      );
      return;
    }

    setIsUploading(true);
    setPreviewError(false);
    const toastId = toast.loading(
      isEn ? "Uploading QRIS image to Supabase Storage..." : "Mengunggah gambar QRIS ke Supabase Storage..."
    );

    try {
      const fileExt = file.name.split(".").pop() || "png";
      const fileName = `qris_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `qris/${fileName}`;

      const { data, error } = await supabase.storage
        .from("brand-assets")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        // If bucket doesn't exist or RLS restricts, provide helpful guidance
        console.error("Supabase Storage Upload Error:", error);
        throw new Error(error.message);
      }

      // Retrieve public URL from Supabase
      const {
        data: { publicUrl },
      } = supabase.storage.from("brand-assets").getPublicUrl(filePath);

      onChange(publicUrl);
      toast.success(
        isEn ? "QRIS image uploaded and saved successfully!" : "Gambar QRIS berhasil diunggah dan disimpan!",
        { id: toastId }
      );
    } catch (err: any) {
      console.error("QRIS upload failed:", err);
      toast.error(
        isEn
          ? `Upload failed: ${err.message || "Please ensure 'brand-assets' storage bucket is created."}`
          : `Gagal mengunggah: ${err.message || "Pastikan bucket storage 'brand-assets' sudah dibuat di Supabase."}`,
        { id: toastId }
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleRemove = () => {
    onChange("");
    setPreviewError(false);
    toast.info(isEn ? "QRIS image removed." : "Gambar QRIS telah dihapus.");
  };

  const hasValidImage = Boolean(value && value.trim() && !previewError);

  return (
    <div className="space-y-3">
      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Container */}
      {hasValidImage ? (
        /* Preview State when QRIS Image Exists */
        <Card className="border border-border bg-card shadow-none overflow-hidden rounded-xl">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              {/* QRIS Thumbnail Preview with Aspect Ratio Container */}
              <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-lg border border-border bg-muted/30 p-2 flex items-center justify-center shrink-0 overflow-hidden shadow-xs group">
                <img
                  src={value}
                  alt="QRIS Merchant Serena Raga"
                  className="w-full h-full object-contain rounded"
                  onError={() => setPreviewError(true)}
                />
              </div>

              {/* QRIS Details and Management Actions */}
              <div className="flex-1 min-w-0 space-y-2.5 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 gap-1 text-xs font-semibold px-2 py-0.5"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{isEn ? "QRIS Code Active" : "QRIS Aktif"}</span>
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {isEn ? "Ready for customer checkout" : "Siap digunakan untuk pembayaran nota"}
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground break-all leading-relaxed">
                  <span className="font-semibold text-foreground mr-1">URL:</span>
                  <span>{value}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 text-xs gap-1.5 shadow-none border-border hover:bg-muted/80 cursor-pointer"
                  >
                    {isUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                    <span>{isEn ? "Replace Image" : "Ganti Gambar"}</span>
                  </Button>

                  <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1.5 shadow-none border-border hover:bg-muted/80 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{isEn ? "View Full" : "Lihat Penuh"}</span>
                    </Button>
                  </a>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemove}
                    className="h-8 text-xs gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isEn ? "Remove" : "Hapus"}</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Empty / Dropzone Upload State */
        <div className="space-y-2.5">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => {
              if (!isUploading) fileInputRef.current?.click();
            }}
            className={cn(
              "relative rounded-xl border-2 border-dashed p-6 sm:p-8 text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3 bg-card",
              dragOver
                ? "border-primary bg-primary/5 scale-[0.99]"
                : "border-border/80 hover:border-primary/60 hover:bg-muted/30",
              isUploading && "pointer-events-none opacity-60"
            )}
          >
            {isUploading ? (
              <div className="space-y-2 py-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                <p className="text-xs font-semibold text-foreground">
                  {isEn ? "Uploading QRIS to Supabase Storage..." : "Mengunggah gambar QRIS ke Supabase Storage..."}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isEn ? "Please wait a moment" : "Mohon tunggu sebentar"}
                </p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <QrCode className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-foreground flex items-center justify-center gap-1">
                    <UploadCloud className="w-4 h-4 text-primary" />
                    <span>
                      {isEn
                        ? "Click to upload QRIS image or drag & drop"
                        : "Klik untuk unggah gambar QRIS atau tarik & lepas file ke sini"}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isEn
                      ? "Supports PNG, JPG, WEBP, or SVG (Max. 5MB). Automatically saved to Supabase Storage."
                      : "Mendukung PNG, JPG, WEBP, atau SVG (Maks. 5MB). Otomatis tersimpan di Supabase Storage."}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5 shadow-none border-border bg-background mt-1"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{isEn ? "Choose File" : "Pilih File Gambar"}</span>
                </Button>
              </>
            )}
          </div>

          {/* Optional manual URL toggle for power users */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setManualMode(!manualMode)}
              className="h-6 text-xs text-muted-foreground hover:text-foreground gap-1 px-1.5 cursor-pointer"
            >
              <Link2 className="w-3 h-3" />
              <span>
                {manualMode
                  ? isEn
                    ? "Hide Manual URL Input"
                    : "Sembunyikan Input URL Manual"
                  : isEn
                  ? "Or enter image URL manually"
                  : "Atau masukkan URL gambar secara manual"}
              </span>
            </Button>
          </div>

          {manualMode && (
            <div className="space-y-1.5 p-3 rounded-lg bg-muted/40 border border-border text-xs">
              <label className="font-semibold text-foreground flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{isEn ? "Custom Image URL" : "URL Gambar Kustom"}</span>
              </label>
              <Input
                placeholder="https://.../qris.png"
                value={value || ""}
                onChange={(e) => {
                  setPreviewError(false);
                  onChange(e.target.value);
                }}
                className="text-xs h-8 shadow-none bg-background"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
