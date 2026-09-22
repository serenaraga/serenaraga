"use client";

import * as React from "react";
import { useInput, useLocaleState, useTranslate } from "ra-core";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  UploadCloud,
  FileText,
  Eye,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
  ShieldAlert,
  Sparkles,
  ShieldCheck,
  Scissors,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageBlurEditor } from "@/components/image-blur-editor";

interface HDFileUploadProps {
  source: string;
  label?: string;
  helperText?: string;
  bucketName?: "therapist-documents" | "therapist-photos" | "testimonials" | (string & {});
  fileType?: "image" | "document" | "all";
  enableBlurTool?: boolean;
  maxDimension?: number; // default 2048px for Crisp HD
  quality?: number; // default 0.92 for Ultra Clear Text
  required?: boolean;
  className?: string;
}

/**
 * Gentle HD Image Optimizer:
 * Resizes max dimension to 2048px while keeping 92% quality,
 * preserving crisp NIK text, holograms, and faces on KTP / ID cards.
 */
async function optimizeImageHD(
  file: File,
  maxDim = 2048,
  quality = 0.92
): Promise<{ blob: Blob; ext: string }> {
  // If it's a PDF or non-image, return raw file
  if (!file.type.startsWith("image/")) {
    return { blob: file, ext: file.name.split(".").pop() || "pdf" };
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Only scale down if image exceeds maxDim (preserving crisp HD 1080p/2K)
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ blob: file, ext: file.name.split(".").pop() || "jpg" });
          return;
        }

        // High quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP for efficient crisp storage
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, ext: "webp" });
            } else {
              resolve({ blob: file, ext: file.name.split(".").pop() || "jpg" });
            }
          },
          "image/webp",
          quality
        );
      };
      img.onerror = () => resolve({ blob: file, ext: file.name.split(".").pop() || "jpg" });
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve({ blob: file, ext: file.name.split(".").pop() || "jpg" });
    reader.readAsDataURL(file);
  });
}

export const HDFileUpload: React.FC<HDFileUploadProps> = ({
  source,
  label,
  helperText,
  bucketName = "therapist-documents",
  fileType = "image",
  enableBlurTool,
  maxDimension = 2048,
  quality = 0.92,
  required = false,
  className,
}) => {
  const {
    field: { value, onChange },
    fieldState: { error, isTouched },
  } = useInput({ source, defaultValue: "" });

  const translate = useTranslate();
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  const isBlurSupported = enableBlurTool ?? (bucketName === "testimonials" || fileType === "image");

  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<string>("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [blurEditorOpen, setBlurEditorOpen] = React.useState(false);
  const [pendingFileForBlur, setPendingFileForBlur] = React.useState<File | null>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isImage = React.useMemo(() => {
    if (!value || typeof value !== "string") return false;
    const lower = value.toLowerCase();
    return (
      lower.endsWith(".jpg") ||
      lower.endsWith(".jpeg") ||
      lower.endsWith(".png") ||
      lower.endsWith(".webp") ||
      lower.endsWith(".svg") ||
      lower.includes("image")
    );
  }, [value]);

  const uploadProcessedBlob = async (blob: Blob, originalName = "screenshot.webp") => {
    try {
      setIsUploading(true);
      setErrorMessage(null);
      setUploadProgress(isEn ? "Uploading to Cloud..." : "Mengunggah ke Supabase...");

      const ext = "webp";
      const cleanFileName = originalName
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .substring(0, 30);
      const filePath = `${source}/${Date.now()}_${cleanFileName}.${ext}`;

      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, blob, {
          cacheControl: "3600",
          upsert: true,
          contentType: "image/webp",
        });

      if (!uploadError && data?.path) {
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(data.path);

        if (urlData?.publicUrl) {
          onChange(urlData.publicUrl);
          return;
        }
      }

      // Fallback
      console.warn("Storage upload notice:", uploadError?.message);
      const base64Url = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      onChange(base64Url);
    } catch (err: any) {
      console.error("HD Upload error:", err);
      setErrorMessage(
        err.message ||
          (isEn ? "Upload failed. Please try again." : "Gagal mengunggah file. Silakan coba lagi.")
      );
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  };

  const handleFileProcess = async (file: File) => {
    if (isBlurSupported && file.type.startsWith("image/")) {
      setPendingFileForBlur(file);
      setBlurEditorOpen(true);
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage(null);
      setUploadProgress(isEn ? "Optimizing in HD..." : "Memproses kualitas HD...");

      const { blob, ext } = await optimizeImageHD(file, maxDimension, quality);
      await uploadProcessedBlob(blob, file.name);
    } catch (err: any) {
      console.error("HD Upload error:", err);
      setErrorMessage(
        err.message ||
          (isEn ? "Upload failed. Please try again." : "Gagal mengunggah file. Silakan coba lagi.")
      );
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label className="text-xs font-medium text-foreground block">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </label>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={
          fileType === "image"
            ? "image/*"
            : fileType === "document"
            ? "application/pdf,image/*"
            : "*/*"
        }
        onChange={handleFileChange}
        className="hidden"
      />

      {/* When File is Uploaded: Clean Professional Card */}
      {value ? (
        <div className="rounded-lg border border-border bg-card p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {isImage ? (
              <div
                onClick={() => setPreviewOpen(true)}
                className="relative h-12 w-16 rounded-md overflow-hidden border border-border bg-muted shrink-0 cursor-pointer group"
              >
                <img
                  src={value}
                  alt={label || "Preview"}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Eye className="w-3.5 h-3.5" />
                </div>
              </div>
            ) : (
              <div className="h-10 w-10 rounded-md bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
            )}

            <div className="grid text-xs min-w-0">
              <span className="font-medium text-foreground truncate flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                {isEn ? "File uploaded" : "File berhasil diunggah"}
              </span>
              <span className="text-[11px] text-muted-foreground truncate max-w-[200px] sm:max-w-[320px]">
                {value.split("/").pop()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isImage && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPreviewOpen(true)}
                className="h-8 text-xs gap-1.5"
              >
                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{isEn ? "View" : "Lihat"}</span>
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange("")}
              className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              title={isEn ? "Remove File" : "Hapus File"}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        /* Dropzone Upload Box */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={cn(
            "relative rounded-lg border border-dashed p-4 text-center cursor-pointer transition-colors",
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/10 hover:bg-muted/30 hover:border-primary/40",
            isUploading && "pointer-events-none opacity-80"
          )}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center py-2 space-y-1.5">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <p className="text-xs font-medium text-foreground">{uploadProgress}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-1.5 py-1">
              <div className="h-9 w-9 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                {fileType === "image" ? (
                  <ImageIcon className="w-4 h-4" />
                ) : (
                  <UploadCloud className="w-4 h-4" />
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">
                  {isEn ? "Click to upload or drag & drop" : "Klik untuk upload atau seret file ke sini"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {fileType === "image"
                    ? isEn
                      ? "PNG, JPG, WEBP (Max 10MB)"
                      : "PNG, JPG, WEBP (Maks. 10MB)"
                    : isEn
                    ? "PDF, JPG, PNG (Max 10MB)"
                    : "PDF, JPG, PNG (Maks. 10MB)"}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {helperText && (
        <p className="text-[11px] text-muted-foreground">{helperText}</p>
      )}

      {errorMessage && (
        <p className="text-[11px] text-destructive flex items-center gap-1 mt-1">
          <ShieldAlert className="w-3 h-3" />
          <span>{errorMessage}</span>
        </p>
      )}

      {/* Lightbox Preview Modal */}
      {value && isImage && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-3xl p-4 bg-card border-border">
            <DialogHeader className="pb-2 border-b border-border/60">
              <DialogTitle className="text-sm font-semibold">
                {label || (isEn ? "Document Preview" : "Pratinjau Dokumen")}
              </DialogTitle>
            </DialogHeader>
            <div className="relative max-h-[75vh] overflow-auto rounded-lg bg-black/5 dark:bg-black/40 flex items-center justify-center p-2">
              <img
                src={value}
                alt={label || "Preview"}
                className="max-h-[70vh] w-auto object-contain rounded-md shadow-sm"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Interactive Blur / Redaction Editor Modal */}
      {pendingFileForBlur && (
        <ImageBlurEditor
          isOpen={blurEditorOpen}
          onClose={() => {
            setBlurEditorOpen(false);
            setPendingFileForBlur(null);
          }}
          file={pendingFileForBlur}
          onSave={(processedBlob) => {
            uploadProcessedBlob(processedBlob, pendingFileForBlur.name);
            setPendingFileForBlur(null);
          }}
        />
      )}
    </div>
  );
};
