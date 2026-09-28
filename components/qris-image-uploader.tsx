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
  Sparkles,
  Code2,
  Store,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { decodeQRFromImage, parseQRIS, type QRISInfo } from "@/lib/qris";

export interface QrisImageUploaderProps {
  value?: string;
  payload?: string;
  onChange: (url: string) => void;
  onChangePayload?: (payload: string) => void;
  isEn?: boolean;
}

export function QrisImageUploader({
  value,
  payload,
  onChange,
  onChangePayload,
  isEn = false,
}: QrisImageUploaderProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);
  const [manualMode, setManualMode] = React.useState(false);
  const [previewError, setPreviewError] = React.useState(false);
  const [parsedInfo, setParsedInfo] = React.useState<QRISInfo | null>(() => {
    return payload ? parseQRIS(payload) : null;
  });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Sync parsed info when payload changes
  React.useEffect(() => {
    if (payload && payload.trim()) {
      setParsedInfo(parseQRIS(payload));
    } else {
      setParsedInfo(null);
    }
  }, [payload]);

  // Attempt automatic decoding from image URL if payload is empty but image URL exists
  React.useEffect(() => {
    let active = true;
    if (value && value.trim() && (!payload || !payload.trim())) {
      decodeQRFromImage(value)
        .then((res) => {
          if (active && res.payload) {
            onChangePayload?.(res.payload);
            setParsedInfo(parseQRIS(res.payload));
          }
        })
        .catch(() => {
          // Non-blocking
        });
    }
    return () => {
      active = false;
    };
  }, [value, payload, onChangePayload]);

  // Upload file directly to Supabase Storage ('brand-assets' bucket) and decode QR payload
  const processAndUploadFile = async (file: File) => {
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
      isEn ? "Analyzing QRIS barcode & uploading..." : "Membaca barcode QRIS & mengunggah..."
    );

    try {
      // 1. First, decode the QR code string using browser canvas
      let decodedPayload = "";
      try {
        const decoded = await decodeQRFromImage(file);
        if (decoded.payload) {
          decodedPayload = decoded.payload;
          onChangePayload?.(decoded.payload);
          setParsedInfo(parseQRIS(decoded.payload));
        }
      } catch (decodeErr: any) {
        console.warn("QR code automatic detection note:", decodeErr.message);
      }

      // 2. Upload file to Supabase Storage
      const fileExt = file.name.split(".").pop() || "png";
      const fileName = `qris_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `qris/${fileName}`;

      const { error } = await supabase.storage
        .from("brand-assets")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        console.error("Supabase Storage Upload Error:", error);
        throw new Error(error.message);
      }

      // 3. Retrieve public URL from Supabase
      const {
        data: { publicUrl },
      } = supabase.storage.from("brand-assets").getPublicUrl(filePath);

      onChange(publicUrl);

      if (decodedPayload) {
        toast.success(
          isEn
            ? "QRIS barcode decoded and uploaded successfully! Dynamic generation is active."
            : "Barcode QRIS berhasil dipindai & disimpan! Fitur QRIS Dinamis otomatis aktif.",
          { id: toastId }
        );
      } else {
        toast.success(
          isEn
            ? "QRIS image uploaded. (Barcode string could not be automatically extracted; you can paste it below)."
            : "Gambar QRIS berhasil diunggah. (String barcode tidak terbaca otomatis; Anda bisa memasukkannya manual di bawah).",
          { id: toastId }
        );
      }
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
      processAndUploadFile(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processAndUploadFile(files[0]);
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
    onChangePayload?.("");
    setParsedInfo(null);
    setPreviewError(false);
    toast.info(isEn ? "QRIS image & payload removed." : "Gambar & string QRIS telah dihapus.");
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
              <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-lg border border-border bg-muted/30 p-2 flex items-center justify-center shrink-0 overflow-hidden shadow-xs group">
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
                    <span>{isEn ? "QRIS Image Ready" : "Template QRIS Siap"}</span>
                  </Badge>

                  {parsedInfo?.isValid ? (
                    <Badge
                      variant="outline"
                      className="border-[#8b5e3c]/40 bg-[#8b5e3c]/10 text-[#8b5e3c] dark:text-[#d49b6a] gap-1 text-xs font-semibold px-2 py-0.5"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{isEn ? "Dynamic QRIS Active" : "QRIS Dinamis Otomatis"}</span>
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 gap-1 text-xs font-semibold px-2 py-0.5"
                    >
                      <AlertCircle className="w-3 h-3" />
                      <span>{isEn ? "Barcode String Missing" : "String Barcode Belum Ada"}</span>
                    </Badge>
                  )}
                </div>

                {/* Parsed Merchant Info Card if available */}
                {parsedInfo && parsedInfo.isValid && (
                  <div className="p-2.5 rounded-lg bg-muted/30 border border-border/80 space-y-1 text-xs text-left">
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      <Store className="w-3.5 h-3.5 text-[#8b5e3c] dark:text-[#d49b6a] shrink-0" />
                      <span className="truncate">{parsedInfo.merchantName || "Serena Raga"}</span>
                    </div>
                    {(parsedInfo.merchantCity || parsedInfo.nmid) && (
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        {parsedInfo.merchantCity && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {parsedInfo.merchantCity}
                          </span>
                        )}
                        {parsedInfo.nmid && (
                          <span>NMID: <strong className="text-foreground">{parsedInfo.nmid}</strong></span>
                        )}
                      </div>
                    )}
                  </div>
                )}

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
                <Loader2 className="w-8 h-8 animate-spin text-[#8b5e3c] dark:text-[#d49b6a] mx-auto" />
                <p className="text-xs font-semibold text-foreground">
                  {isEn ? "Decoding barcode & saving to Supabase Storage..." : "Membaca kode barcode & mengunggah gambar..."}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isEn ? "Please wait a moment" : "Mohon tunggu sebentar"}
                </p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-[#8b5e3c]/10 text-[#8b5e3c] dark:text-[#d49b6a] flex items-center justify-center">
                  <QrCode className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-foreground flex items-center justify-center gap-1">
                    <UploadCloud className="w-4 h-4 text-[#8b5e3c] dark:text-[#d49b6a]" />
                    <span>
                      {isEn
                        ? "Click to upload QRIS image or drag & drop"
                        : "Klik untuk unggah gambar QRIS atau tarik & lepas file ke sini"}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    {isEn
                      ? "Supports official QRIS poster/standee image. The system will automatically scan the barcode and activate Dynamic QRIS with exact invoice totals!"
                      : "Mendukung poster/standee QRIS merchant. Sistem akan otomatis memindai barcode dan mengaktifkan QRIS Dinamis sesuai nominal invoice!"}
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
        </div>
      )}

      {/* Advanced / Manual QRIS String & URL Inspector Toggle */}
      <div className="flex items-center justify-between text-xs pt-0.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setManualMode(!manualMode)}
          className="h-6 text-xs text-muted-foreground hover:text-foreground gap-1 px-1.5 cursor-pointer"
        >
          <Code2 className="w-3 h-3" />
          <span>
            {manualMode
              ? isEn
                ? "Hide Advanced QRIS Data"
                : "Sembunyikan Pengaturan Lanjutan"
              : isEn
              ? "View / Edit Raw QRIS Payload String"
              : "Lihat / Edit String Barcode QRIS Mentah"}
          </span>
        </Button>
      </div>

      {manualMode && (
        <div className="space-y-3 p-3.5 rounded-xl bg-muted/40 border border-border text-xs">
          {/* Raw Payload Input */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center justify-between gap-1.5">
              <span className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{isEn ? "Raw QRIS String (EMVCo)" : "String Barcode QRIS Mentah (EMVCo)"}</span>
              </span>
              {parsedInfo?.isValid && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-normal">
                  ✓ Valid EMVCo QRIS
                </span>
              )}
            </label>
            <Input
              placeholder="00020101021126570011ID.DANA.WWW..."
              value={payload || ""}
              onChange={(e) => {
                const val = e.target.value.trim();
                onChangePayload?.(val);
                setParsedInfo(val ? parseQRIS(val) : null);
              }}
              className="text-xs h-8 shadow-none bg-background font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              {isEn
                ? "This raw string is used to dynamically inject invoice amounts and compute CRC16 checksums on the fly."
                : "String mentah ini digunakan untuk menyisipkan nominal invoice secara dinamis dan menghitung ulang checksum CRC16."}
            </p>
          </div>

          {/* Custom Image URL Input */}
          <div className="space-y-1.5 pt-2 border-t border-border/60">
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
              className="text-xs h-8 shadow-none bg-background font-mono"
            />
          </div>
        </div>
      )}
    </div>
  );
}
