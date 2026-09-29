"use client";

import * as React from "react";
import {
  FeaturedServiceCard,
  DEFAULT_FEATURED_SERVICES,
} from "@/lib/brand-settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Link2,
  RotateCcw,
  Image as ImageIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface ServicesSectionSettingsProps {
  value?: FeaturedServiceCard[];
  onChange: (cards: FeaturedServiceCard[]) => void;
  isEn?: boolean;
}

/**
 * Standard modular editor for the 'Our Services' 4-cards section on the Landing Page.
 */
export function ServicesSectionSettings({
  value,
  onChange,
  isEn = false,
}: ServicesSectionSettingsProps) {
  // Ensure array has exactly 4 items with fallbacks
  const cards: FeaturedServiceCard[] = React.useMemo(() => {
    if (Array.isArray(value) && value.length === 4) {
      return value;
    }
    return DEFAULT_FEATURED_SERVICES;
  }, [value]);

  const [activeCardIndex, setActiveCardIndex] = React.useState<number>(0);
  const [uploadingIndex, setUploadingIndex] = React.useState<number | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleCardChange = (
    index: number,
    field: keyof FeaturedServiceCard,
    val: string
  ) => {
    const updated = [...cards];
    updated[index] = {
      ...updated[index],
      [field]: val,
    };
    onChange(updated);
  };

  const handleResetCard = (index: number) => {
    const updated = [...cards];
    updated[index] = { ...DEFAULT_FEATURED_SERVICES[index] };
    onChange(updated);
    toast.info(
      isEn
        ? `Card #${index + 1} reset to default.`
        : `Kartu #${index + 1} dikembalikan ke nilai awal.`
    );
  };

  const handleResetAll = () => {
    onChange([...DEFAULT_FEATURED_SERVICES]);
    toast.info(
      isEn
        ? "All 4 service cards reset to default values."
        : "Semua 4 kartu layanan dikembalikan ke nilai awal."
    );
  };

  const handleFileUpload = async (index: number, file: File) => {
    if (!file) return;
    setUploadingIndex(index);
    const toastId = toast.loading(
      isEn ? "Uploading image to cloud storage..." : "Mengunggah gambar ke storage..."
    );

    try {
      const fileExt = file.name.split(".").pop() || "jpg";
      const fileName = `featured_service_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `featured-services/${fileName}`;

      const { error } = await supabase.storage
        .from("brand-assets")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        throw new Error(error.message);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("brand-assets").getPublicUrl(filePath);

      handleCardChange(index, "image", publicUrl);
      toast.success(
        isEn ? "Image uploaded successfully!" : "Foto berhasil diunggah!",
        { id: toastId }
      );
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(
        isEn
          ? `Upload failed: ${err.message || "Please check storage permissions."}`
          : `Gagal mengunggah foto: ${err.message || "Periksa pengaturan storage."}`,
        { id: toastId }
      );
    } finally {
      setUploadingIndex(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Header Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-border/70">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {isEn ? "Our Services (4 Cards Grid)" : "Bagian Our Services (4 Kartu Layanan)"}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isEn
              ? "Customize the title, subtitle, and image for each of the 4 featured cards on the landing page."
              : "Sesuaikan judul, sub judul, dan foto untuk masing-masing dari 4 kartu layanan di landing page."}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleResetAll}
          className="h-7 text-xs gap-1.5 shadow-none border-border"
        >
          <RotateCcw className="w-3 h-3 text-muted-foreground" />
          <span>{isEn ? "Reset Section" : "Reset Bagian Ini"}</span>
        </Button>
      </div>

      {/* Hidden file input for upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadingIndex !== null) {
            handleFileUpload(uploadingIndex, file);
          }
        }}
      />

      {/* 4 Cards Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card, index) => {
          const isSelected = activeCardIndex === index;
          return (
            <Card
              key={card.id || index}
              className={cn(
                "border border-border shadow-none bg-card overflow-hidden transition-all duration-200",
                isSelected ? "ring-1 ring-primary/40 border-primary/60" : ""
              )}
              onClick={() => setActiveCardIndex(index)}
            >
              <CardHeader className="pb-3 border-b border-border/80 flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-xs font-bold text-foreground flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                    {index + 1}
                  </span>
                  <span>
                    {isEn ? `Card #${index + 1}` : `Kartu #${index + 1}`}:{" "}
                    {card.title || `Service ${index + 1}`}
                  </span>
                </CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetCard(index);
                  }}
                  className="h-6 text-[11px] text-muted-foreground hover:text-foreground gap-1 px-1.5"
                  title="Reset kartu ini ke default"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{isEn ? "Reset" : "Reset"}</span>
                </Button>
              </CardHeader>

              <CardContent className="pt-4 space-y-3.5 text-xs">
                {/* Visual Preview + Image Trigger */}
                <div className="flex flex-col sm:flex-row gap-3.5 items-start">
                  {/* Aspect 3/4 Card Live Preview */}
                  <div className="relative w-28 sm:w-32 aspect-[3/4] rounded-lg overflow-hidden bg-muted/60 border border-border shrink-0 group">
                    <img
                      src={card.image || "/images/service-balinese.jpg"}
                      alt={card.title || "Service card"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          DEFAULT_FEATURED_SERVICES[index]?.image ||
                          "/images/service-balinese.jpg";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-end p-2 text-center text-white">
                      <p className="text-[11px] font-semibold font-serif leading-tight truncate text-stone-100">
                        {isEn ? card.title : card.title_id || card.title}
                      </p>
                      <p className="text-[9px] text-stone-300 font-light truncate mt-0.5">
                        {isEn ? card.tagline : card.tagline_id || card.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Image Controls */}
                  <div className="flex-1 min-w-0 space-y-2 w-full">
                    <Label className="text-xs font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-primary" />
                        <span>{isEn ? "Card Image" : "Foto Kartu Layanan"}</span>
                      </span>
                    </Label>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingIndex === index}
                        onClick={() => {
                          setUploadingIndex(index);
                          fileInputRef.current?.click();
                        }}
                        className="h-8 text-xs gap-1.5 shadow-none border-border shrink-0 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-primary" />
                        <span>
                          {uploadingIndex === index
                            ? isEn
                              ? "Uploading..."
                              : "Mengunggah..."
                            : isEn
                            ? "Upload File"
                            : "Unggah Foto"}
                        </span>
                      </Button>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`card_img_${index}`} className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Link2 className="w-3 h-3" />
                        <span>{isEn ? "Image URL" : "URL Gambar"}</span>
                      </Label>
                      <Input
                        id={`card_img_${index}`}
                        placeholder="/images/service-balinese.jpg"
                        value={card.image || ""}
                        onChange={(e) => handleCardChange(index, "image", e.target.value)}
                        className="text-xs h-8 shadow-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Title Inputs (EN & ID) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60">
                  <div className="space-y-1">
                    <Label htmlFor={`card_title_${index}`} className="text-xs font-semibold">
                      {isEn ? "Title (English)" : "Judul (Bahasa Inggris)"}
                    </Label>
                    <Input
                      id={`card_title_${index}`}
                      placeholder="Traditional"
                      value={card.title || ""}
                      onChange={(e) => handleCardChange(index, "title", e.target.value)}
                      className="text-xs h-8 shadow-none font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`card_title_id_${index}`} className="text-xs font-semibold">
                      {isEn ? "Title (Indonesian)" : "Judul (Bahasa Indonesia)"}
                    </Label>
                    <Input
                      id={`card_title_id_${index}`}
                      placeholder="Pijat Tradisional"
                      value={card.title_id || ""}
                      onChange={(e) => handleCardChange(index, "title_id", e.target.value)}
                      className="text-xs h-8 shadow-none"
                    />
                  </div>
                </div>

                {/* Tagline / Subtitle Inputs (EN & ID) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor={`card_tagline_${index}`} className="text-xs font-semibold">
                      {isEn ? "Subtitle (English)" : "Sub Judul (Bahasa Inggris)"}
                    </Label>
                    <Input
                      id={`card_tagline_${index}`}
                      placeholder="Authentic Relaxation"
                      value={card.tagline || ""}
                      onChange={(e) => handleCardChange(index, "tagline", e.target.value)}
                      className="text-xs h-8 shadow-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`card_tagline_id_${index}`} className="text-xs font-semibold">
                      {isEn ? "Subtitle (Indonesian)" : "Sub Judul (Bahasa Indonesia)"}
                    </Label>
                    <Input
                      id={`card_tagline_id_${index}`}
                      placeholder="Relaksasi Otentik"
                      value={card.tagline_id || ""}
                      onChange={(e) => handleCardChange(index, "tagline_id", e.target.value)}
                      className="text-xs h-8 shadow-none"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
