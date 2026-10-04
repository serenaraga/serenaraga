"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Trash2, Plus, X, Car, Receipt, Users, User, HeartHandshake } from "lucide-react";
import { SearchableCombobox } from "@/components/searchable-combobox";
import { TherapistShareSlider } from "@/components/therapist-share-slider";
import { cn, formatIDR, isCoupleService } from "@/lib/utils";

export interface BookingItemRow {
  id: string;
  service_id: number | null;
  therapist_id: number | null;
  price: number;
  transport_fee?: number;
  transport_fee_therapist_share?: number;
  additional_charge?: number;
  additional_charge_description?: string;
  additional_charge_therapist_share?: number;
  // Couple Package Multi-Therapist fields
  is_couple?: boolean;
  therapist_mode?: "single" | "couple_split";
  secondary_therapist_id?: number | null;
  secondary_price?: number;
  secondary_transport_fee?: number;
  secondary_transport_fee_therapist_share?: number;
  secondary_additional_charge?: number;
  secondary_additional_charge_description?: string;
  secondary_additional_charge_therapist_share?: number;
}

interface BookingRepeaterProps {
  items: BookingItemRow[];
  services: any[];
  therapists: any[];
  isEn: boolean;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onItemChange: (index: number, updatedFields: Partial<BookingItemRow>) => void;
}

/**
 * Multi-Item Treatment & Therapist Repeater Component
 * Supports single treatments and Couple Package multi-therapist assignments with dedicated transport & extra charge allowances.
 */
export const BookingRepeater: React.FC<BookingRepeaterProps> = ({
  items,
  services,
  therapists,
  isEn,
  onAddItem,
  onRemoveItem,
  onItemChange,
}) => {
  const [openTransportIndices, setOpenTransportIndices] = React.useState<Record<string, boolean>>({});
  const [openChargeIndices, setOpenChargeIndices] = React.useState<Record<string, boolean>>({});
  const [openSecTransportIndices, setOpenSecTransportIndices] = React.useState<Record<string, boolean>>({});
  const [openSecChargeIndices, setOpenSecChargeIndices] = React.useState<Record<string, boolean>>({});

  const servicesSubtotal = items.reduce((acc, it) => {
    const isCoupleSplit = it.is_couple && it.therapist_mode === "couple_split";
    const p1 = Number(it.price) || 0;
    const p2 = isCoupleSplit ? Number(it.secondary_price) || 0 : 0;
    return acc + p1 + p2;
  }, 0);

  const totalTransport = items.reduce((acc, it) => {
    const isCoupleSplit = it.is_couple && it.therapist_mode === "couple_split";
    const t1 = Number(it.transport_fee) || 0;
    const t2 = isCoupleSplit ? Number(it.secondary_transport_fee) || 0 : 0;
    return acc + t1 + t2;
  }, 0);

  const totalAdditionalCharge = items.reduce((acc, it) => {
    const isCoupleSplit = it.is_couple && it.therapist_mode === "couple_split";
    const c1 = Number(it.additional_charge) || 0;
    const c2 = isCoupleSplit ? Number(it.secondary_additional_charge) || 0 : 0;
    return acc + c1 + c2;
  }, 0);

  const grandTotal = servicesSubtotal + totalTransport + totalAdditionalCharge;

  return (
    <Card className="border border-border/70 shadow-none bg-card">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                {isEn ? "Services, Therapists & Extra Charges" : "Layanan, Terapis & Biaya Tambahan"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {isEn
                  ? "Select treatments and therapists. For couple packages, assign 1 or 2 therapists with separate transport & charges."
                  : "Pilih menu layanan dan terapis. Untuk layanan couple, pilih opsi 1 atau 2 terapis dengan ongkir & charge mandiri."}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-3.5">
        <div className="space-y-3">
          {items.map((item, index) => {
            const selectedService = services.find((s: any) => Number(s.id) === Number(item.service_id));
            const isCouple = isCoupleService(selectedService);
            const isCoupleSplit = isCouple && (item.therapist_mode === "couple_split" || item.therapist_mode === undefined);

            const isTransportOpen = Boolean(
              openTransportIndices[item.id] || (Number(item.transport_fee) > 0)
            );
            const isChargeOpen = Boolean(
              openChargeIndices[item.id] ||
              (Number(item.additional_charge) > 0) ||
              Boolean(item.additional_charge_description)
            );

            const isSecTransportOpen = Boolean(
              openSecTransportIndices[item.id] || (Number(item.secondary_transport_fee) > 0)
            );
            const isSecChargeOpen = Boolean(
              openSecChargeIndices[item.id] ||
              (Number(item.secondary_additional_charge) > 0) ||
              Boolean(item.secondary_additional_charge_description)
            );

            const serviceItems = services
              .filter(
                (s: any) =>
                  s.is_active !== false ||
                  (item.service_id && Number(s.id) === Number(item.service_id))
              )
              .map((s: any) => ({
                value: String(s.id),
                label: `${s.name} (${s.duration_minutes} mnt • ${formatIDR(s.price)})${isCoupleService(s) ? " [Couple]" : ""}${s.is_active === false ? (isEn ? " (Inactive)" : " (Nonaktif)") : ""}`,
              }));

            const therapistItems = therapists.map((t: any) => {
              const statusLabel =
                t.status === "available"
                  ? isEn ? "Available" : "Tersedia"
                  : t.status === "on_duty"
                    ? isEn ? "On Duty" : "Bertugas"
                    : isEn ? "Off Duty" : "Libur";
              return {
                value: String(t.id),
                label: `${t.name} (${statusLabel})`,
              };
            });

            const handleServiceSelect = (serviceIdVal: number | null) => {
              const s = services.find((x: any) => Number(x.id) === Number(serviceIdVal));
              const coupleDetected = isCoupleService(s);
              const fullPrice = Number(s?.price || 0);

              if (coupleDetected) {
                const halfPrice = Math.round(fullPrice / 2);
                onItemChange(index, {
                  service_id: serviceIdVal,
                  is_couple: true,
                  therapist_mode: "couple_split",
                  price: halfPrice,
                  secondary_price: fullPrice - halfPrice,
                });
              } else {
                onItemChange(index, {
                  service_id: serviceIdVal,
                  is_couple: false,
                  therapist_mode: "single",
                  price: fullPrice,
                  secondary_therapist_id: null,
                  secondary_price: 0,
                  secondary_transport_fee: 0,
                  secondary_additional_charge: 0,
                  secondary_additional_charge_description: "",
                });
              }
            };

            const toggleTherapistMode = (mode: "single" | "couple_split") => {
              const fullPrice = Number(selectedService?.price || (item.price + (item.secondary_price || 0)) || 0);
              if (mode === "couple_split") {
                const half = Math.round(fullPrice / 2);
                onItemChange(index, {
                  therapist_mode: "couple_split",
                  price: half,
                  secondary_price: fullPrice - half,
                });
              } else {
                onItemChange(index, {
                  therapist_mode: "single",
                  price: fullPrice,
                  secondary_therapist_id: null,
                  secondary_price: 0,
                });
              }
            };

            return (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-3.5 transition-all"
              >
                {/* Header item */}
                <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase border-b border-border/40 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-primary" />
                    {isEn ? `Item #${index + 1}` : `Layanan #${index + 1}`}
                    {isCouple && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-700 dark:text-pink-300 font-semibold lowercase">
                        <HeartHandshake className="w-3 h-3" /> couple package
                      </span>
                    )}
                  </span>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveItem(index)}
                      className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                      title={isEn ? "Remove item" : "Hapus baris"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>

                {/* Service Selection Row */}
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                    <div className="sm:col-span-8 space-y-1">
                      <label className="text-xs font-medium text-foreground">
                        {isEn ? "Treatment Service" : "Menu Layanan"}
                      </label>
                      <SearchableCombobox
                        options={serviceItems}
                        value={item.service_id ? String(item.service_id) : ""}
                        placeholder={isEn ? "Select service" : "Pilih layanan"}
                        searchPlaceholder={isEn ? "Search service..." : "Cari layanan..."}
                        onValueChange={(val) => handleServiceSelect(val ? Number(val) : null)}
                      />
                    </div>

                    {/* Mode Selector for Couple Service */}
                    {isCouple && (
                      <div className="sm:col-span-4 space-y-1">
                        <label className="text-xs font-medium text-foreground">
                          {isEn ? "Work Mode (Couple)" : "Mode Pengerjaan Couple"}
                        </label>
                        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-background border border-border h-9">
                          <button
                            type="button"
                            onClick={() => toggleTherapistMode("couple_split")}
                            className={cn(
                              "flex-1 h-7 rounded-md text-[11px] font-medium transition-all flex items-center justify-center gap-1 cursor-pointer",
                              isCoupleSplit
                                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <Users className="w-3 h-3" />
                            <span>{isEn ? "2 Therapists" : "2 Terapis"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleTherapistMode("single")}
                            className={cn(
                              "flex-1 h-7 rounded-md text-[11px] font-medium transition-all flex items-center justify-center gap-1 cursor-pointer",
                              !isCoupleSplit
                                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <User className="w-3 h-3" />
                            <span>{isEn ? "1 Therapist" : "1 Terapis"}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* THERAPIST ASSIGNMENT AREA */}
                {isCoupleSplit ? (
                  /* 2-THERAPIST COUPLE SPLIT BOXES */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {/* THERAPIST 1 CARD */}
                    <div className="p-3 rounded-xl bg-background border border-border/80 space-y-2.5 shadow-xs">
                      <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-primary" />
                          {isEn ? "Therapist #1 (First Person)" : "Terapis #1 (Orang Pertama)"}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          Porsi: {formatIDR(item.price)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <div className="sm:col-span-7 space-y-1">
                          <label className="text-[11px] font-medium text-muted-foreground">
                            {isEn ? "Assigned Therapist" : "Terapis Bertugas"}
                          </label>
                          <SearchableCombobox
                            options={therapistItems}
                            value={item.therapist_id ? String(item.therapist_id) : ""}
                            placeholder={isEn ? "Select therapist #1" : "Pilih terapis #1"}
                            searchPlaceholder={isEn ? "Search therapist..." : "Cari terapis..."}
                            onValueChange={(val) => onItemChange(index, { therapist_id: val ? Number(val) : null })}
                          />
                        </div>
                        <div className="sm:col-span-5 space-y-1">
                          <label className="text-[11px] font-medium text-muted-foreground">
                            {isEn ? "Price Share (Rp)" : "Porsi Harga (Rp)"}
                          </label>
                          <Input
                            type="number"
                            value={item.price}
                            onChange={(e) => onItemChange(index, { price: Number(e.target.value) || 0 })}
                            className="h-9 text-xs bg-muted/20"
                            min={0}
                          />
                        </div>
                      </div>

                      {/* Terapis 1 Transport & Charge Expandables */}
                      <div className="space-y-2 pt-1">
                        {isTransportOpen && (
                          <div className="space-y-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
                            <div className="flex items-center gap-2">
                              <Car className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                              <Input
                                type="number"
                                step={5000}
                                value={item.transport_fee || 0}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  onItemChange(index, {
                                    transport_fee: val,
                                    transport_fee_therapist_share: val,
                                  });
                                }}
                                className="h-7 text-xs font-semibold bg-background max-w-[120px]"
                                min={0}
                                placeholder={isEn ? "Transport" : "Ongkir"}
                              />
                              <span className="text-[10px] text-muted-foreground flex-1">{isEn ? "Transport" : "Ongkir"}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  onItemChange(index, { transport_fee: 0, transport_fee_therapist_share: 0 });
                                  setOpenTransportIndices((prev) => ({ ...prev, [item.id]: false }));
                                }}
                                className="h-6 w-6 text-muted-foreground hover:text-destructive cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>

                            {Number(item.transport_fee || 0) > 0 && (
                              <TherapistShareSlider
                                label={isEn ? "Therapist Transport Share" : "Jatah Ongkir Terapis"}
                                totalAmount={Number(item.transport_fee || 0)}
                                therapistShare={
                                  item.transport_fee_therapist_share !== undefined
                                    ? Number(item.transport_fee_therapist_share)
                                    : Number(item.transport_fee || 0)
                                }
                                onChange={(share) => onItemChange(index, { transport_fee_therapist_share: share })}
                                isEn={isEn}
                              />
                            )}
                          </div>
                        )}

                        {isChargeOpen && (
                          <div className="space-y-2 p-2 rounded-lg bg-blue-500/5 border border-blue-500/20">
                            <div className="flex items-center gap-2">
                              <Receipt className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                              <Input
                                type="number"
                                step={5000}
                                value={item.additional_charge || 0}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  const t1 = therapists.find((x: any) => Number(x.id) === Number(item.therapist_id));
                                  const r1 = Number(t1?.commission_rate || 60);
                                  onItemChange(index, {
                                    additional_charge: val,
                                    additional_charge_therapist_share: Math.round((val * r1) / 100),
                                  });
                                }}
                                className="h-7 text-xs font-semibold bg-background max-w-[120px]"
                                min={0}
                                placeholder={isEn ? "Extra Charge" : "Biaya Charge"}
                              />
                              <Input
                                type="text"
                                placeholder={isEn ? "Charge note (e.g. villa fee)" : "Ket charge (misal: charge vila)"}
                                value={item.additional_charge_description || ""}
                                onChange={(e) => onItemChange(index, { additional_charge_description: e.target.value })}
                                className="h-7 text-xs bg-background flex-1"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  onItemChange(index, {
                                    additional_charge: 0,
                                    additional_charge_description: "",
                                    additional_charge_therapist_share: 0,
                                  });
                                  setOpenChargeIndices((prev) => ({ ...prev, [item.id]: false }));
                                }}
                                className="h-6 w-6 text-muted-foreground hover:text-destructive cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>

                            {Number(item.additional_charge || 0) > 0 && (
                              <TherapistShareSlider
                                label={isEn ? "Therapist Charge Share" : "Jatah Charge Terapis"}
                                totalAmount={Number(item.additional_charge || 0)}
                                therapistShare={
                                  item.additional_charge_therapist_share !== undefined
                                    ? Number(item.additional_charge_therapist_share)
                                    : Math.round(
                                        (Number(item.additional_charge || 0) *
                                          Number(
                                            therapists.find((x: any) => Number(x.id) === Number(item.therapist_id))
                                              ?.commission_rate || 60
                                          )) /
                                          100
                                      )
                                }
                                onChange={(share) =>
                                  onItemChange(index, { additional_charge_therapist_share: share })
                                }
                                isEn={isEn}
                              />
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 pt-0.5">
                          {!isTransportOpen && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setOpenTransportIndices((prev) => ({ ...prev, [item.id]: true }))}
                              className="h-6 px-2 text-[10px] border-dashed text-muted-foreground hover:text-foreground cursor-pointer gap-1"
                            >
                              <Plus className="w-2.5 h-2.5" /> {isEn ? "Transport" : "Ongkir"}
                            </Button>
                          )}
                          {!isChargeOpen && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setOpenChargeIndices((prev) => ({ ...prev, [item.id]: true }))}
                              className="h-6 px-2 text-[10px] border-dashed text-muted-foreground hover:text-foreground cursor-pointer gap-1"
                            >
                              <Plus className="w-2.5 h-2.5" /> {isEn ? "Charge" : "Charge"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* THERAPIST 2 CARD */}
                    <div className="p-3 rounded-xl bg-background border border-border/80 space-y-2.5 shadow-xs">
                      <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-primary" />
                          {isEn ? "Therapist #2 (Second Person)" : "Terapis #2 (Orang Kedua)"}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          Porsi: {formatIDR(item.secondary_price || 0)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <div className="sm:col-span-7 space-y-1">
                          <label className="text-[11px] font-medium text-muted-foreground">
                            {isEn ? "Assigned Therapist" : "Terapis Bertugas"}
                          </label>
                          <SearchableCombobox
                            options={therapistItems}
                            value={item.secondary_therapist_id ? String(item.secondary_therapist_id) : ""}
                            placeholder={isEn ? "Select therapist #2" : "Pilih terapis #2"}
                            searchPlaceholder={isEn ? "Search therapist..." : "Cari terapis..."}
                            onValueChange={(val) => onItemChange(index, { secondary_therapist_id: val ? Number(val) : null })}
                          />
                        </div>
                        <div className="sm:col-span-5 space-y-1">
                          <label className="text-[11px] font-medium text-muted-foreground">
                            {isEn ? "Price Share (Rp)" : "Porsi Harga (Rp)"}
                          </label>
                          <Input
                            type="number"
                            value={item.secondary_price || 0}
                            onChange={(e) => onItemChange(index, { secondary_price: Number(e.target.value) || 0 })}
                            className="h-9 text-xs bg-muted/20"
                            min={0}
                          />
                        </div>
                      </div>

                      {/* Terapis 2 Transport & Charge Expandables */}
                      <div className="space-y-2 pt-1">
                        {isSecTransportOpen && (
                          <div className="space-y-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
                            <div className="flex items-center gap-2">
                              <Car className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                              <Input
                                type="number"
                                step={5000}
                                value={item.secondary_transport_fee || 0}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  onItemChange(index, {
                                    secondary_transport_fee: val,
                                    secondary_transport_fee_therapist_share: val,
                                  });
                                }}
                                className="h-7 text-xs font-semibold bg-background max-w-[120px]"
                                min={0}
                                placeholder={isEn ? "Transport" : "Ongkir"}
                              />
                              <span className="text-[10px] text-muted-foreground flex-1">{isEn ? "Transport" : "Ongkir"}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  onItemChange(index, {
                                    secondary_transport_fee: 0,
                                    secondary_transport_fee_therapist_share: 0,
                                  });
                                  setOpenSecTransportIndices((prev) => ({ ...prev, [item.id]: false }));
                                }}
                                className="h-6 w-6 text-muted-foreground hover:text-destructive cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>

                            {Number(item.secondary_transport_fee || 0) > 0 && (
                              <TherapistShareSlider
                                label={isEn ? "Therapist Transport Share" : "Jatah Ongkir Terapis"}
                                totalAmount={Number(item.secondary_transport_fee || 0)}
                                therapistShare={
                                  item.secondary_transport_fee_therapist_share !== undefined
                                    ? Number(item.secondary_transport_fee_therapist_share)
                                    : Number(item.secondary_transport_fee || 0)
                                }
                                onChange={(share) =>
                                  onItemChange(index, { secondary_transport_fee_therapist_share: share })
                                }
                                isEn={isEn}
                              />
                            )}
                          </div>
                        )}

                        {isSecChargeOpen && (
                          <div className="space-y-2 p-2 rounded-lg bg-blue-500/5 border border-blue-500/20">
                            <div className="flex items-center gap-2">
                              <Receipt className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                              <Input
                                type="number"
                                step={5000}
                                value={item.secondary_additional_charge || 0}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  const t2 = therapists.find((x: any) => Number(x.id) === Number(item.secondary_therapist_id));
                                  const r2 = Number(t2?.commission_rate || 60);
                                  onItemChange(index, {
                                    secondary_additional_charge: val,
                                    secondary_additional_charge_therapist_share: Math.round((val * r2) / 100),
                                  });
                                }}
                                className="h-7 text-xs font-semibold bg-background max-w-[120px]"
                                min={0}
                                placeholder={isEn ? "Extra Charge" : "Biaya Charge"}
                              />
                              <Input
                                type="text"
                                placeholder={isEn ? "Charge note (e.g. villa fee)" : "Ket charge (misal: charge vila)"}
                                value={item.secondary_additional_charge_description || ""}
                                onChange={(e) => onItemChange(index, { secondary_additional_charge_description: e.target.value })}
                                className="h-7 text-xs bg-background flex-1"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  onItemChange(index, {
                                    secondary_additional_charge: 0,
                                    secondary_additional_charge_description: "",
                                    secondary_additional_charge_therapist_share: 0,
                                  });
                                  setOpenSecChargeIndices((prev) => ({ ...prev, [item.id]: false }));
                                }}
                                className="h-6 w-6 text-muted-foreground hover:text-destructive cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>

                            {Number(item.secondary_additional_charge || 0) > 0 && (
                              <TherapistShareSlider
                                label={isEn ? "Therapist Charge Share" : "Jatah Charge Terapis"}
                                totalAmount={Number(item.secondary_additional_charge || 0)}
                                therapistShare={
                                  item.secondary_additional_charge_therapist_share !== undefined
                                    ? Number(item.secondary_additional_charge_therapist_share)
                                    : Math.round(
                                        (Number(item.secondary_additional_charge || 0) *
                                          Number(
                                            therapists.find(
                                              (x: any) => Number(x.id) === Number(item.secondary_therapist_id)
                                            )?.commission_rate || 60
                                          )) /
                                          100
                                      )
                                }
                                onChange={(share) =>
                                  onItemChange(index, { secondary_additional_charge_therapist_share: share })
                                }
                                isEn={isEn}
                              />
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 pt-0.5">
                          {!isSecTransportOpen && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setOpenSecTransportIndices((prev) => ({ ...prev, [item.id]: true }))}
                              className="h-6 px-2 text-[10px] border-dashed text-muted-foreground hover:text-foreground cursor-pointer gap-1"
                            >
                              <Plus className="w-2.5 h-2.5" /> {isEn ? "Transport" : "Ongkir"}
                            </Button>
                          )}
                          {!isSecChargeOpen && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setOpenSecChargeIndices((prev) => ({ ...prev, [item.id]: true }))}
                              className="h-6 px-2 text-[10px] border-dashed text-muted-foreground hover:text-foreground cursor-pointer gap-1"
                            >
                              <Plus className="w-2.5 h-2.5" /> {isEn ? "Charge" : "Charge"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* SINGLE THERAPIST STANDARD ROW */
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                      <div className="sm:col-span-7 space-y-1">
                        <label className="text-xs font-medium text-foreground">
                          {isEn ? "Assigned Therapist" : "Terapis yang Bertugas"}
                        </label>
                        <SearchableCombobox
                          options={therapistItems}
                          value={item.therapist_id ? String(item.therapist_id) : ""}
                          placeholder={isEn ? "Assign therapist" : "Assign terapis"}
                          searchPlaceholder={isEn ? "Search therapist..." : "Cari terapis..."}
                          onValueChange={(val) => onItemChange(index, { therapist_id: val ? Number(val) : null })}
                        />
                      </div>

                      <div className="sm:col-span-5 space-y-1">
                        <label className="text-xs font-medium text-foreground">
                          {isEn ? "Price (Rp)" : "Harga Layanan (Rp)"}
                        </label>
                        <Input
                          type="number"
                          value={item.price}
                          onChange={(e) => onItemChange(index, { price: Number(e.target.value) || 0 })}
                          className="h-9 text-xs bg-background"
                          min={0}
                        />
                      </div>
                    </div>

                    {/* Single Therapist Expandables */}
                    {(isTransportOpen || isChargeOpen) && (
                      <div className="pt-2 border-t border-border/40 space-y-2.5">
                        {isTransportOpen && (
                          <div className="space-y-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <div className="flex items-center gap-1.5 text-xs font-medium text-amber-900 dark:text-amber-300 shrink-0 w-36">
                                <Car className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                <span>{isEn ? "Transport Fee" : "Ongkir / Transport"}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-1">
                                <Input
                                  type="number"
                                  step={5000}
                                  value={item.transport_fee || 0}
                                  onChange={(e) => {
                                    const val = Number(e.target.value) || 0;
                                    onItemChange(index, {
                                      transport_fee: val,
                                      transport_fee_therapist_share: val,
                                    });
                                  }}
                                  className="h-8 text-xs font-semibold bg-background max-w-[150px]"
                                  min={0}
                                  placeholder="0"
                                  autoFocus={!item.transport_fee}
                                />
                                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                                  {isEn ? "Total customer fee" : "Total dari pelanggan"}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    onItemChange(index, { transport_fee: 0, transport_fee_therapist_share: 0 });
                                    setOpenTransportIndices((prev) => ({ ...prev, [item.id]: false }));
                                  }}
                                  className="h-7 w-7 ml-auto text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                                  title={isEn ? "Remove transport" : "Hapus transport"}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>

                            {Number(item.transport_fee || 0) > 0 && (
                              <TherapistShareSlider
                                label={isEn ? "Therapist Transport Share" : "Jatah Ongkir Terapis"}
                                totalAmount={Number(item.transport_fee || 0)}
                                therapistShare={
                                  item.transport_fee_therapist_share !== undefined
                                    ? Number(item.transport_fee_therapist_share)
                                    : Number(item.transport_fee || 0)
                                }
                                onChange={(share) => onItemChange(index, { transport_fee_therapist_share: share })}
                                isEn={isEn}
                              />
                            )}
                          </div>
                        )}

                        {isChargeOpen && (
                          <div className="space-y-2 p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/20">
                            <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                              <div className="flex items-center gap-1.5 text-xs font-medium text-blue-900 dark:text-blue-300 shrink-0 w-36 pt-1.5">
                                <Receipt className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span>{isEn ? "Extra Charge" : "Biaya Tambahan"}</span>
                              </div>
                              <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2">
                                <div className="sm:col-span-4">
                                  <Input
                                    type="number"
                                    step={5000}
                                    value={item.additional_charge || 0}
                                    onChange={(e) => {
                                      const val = Number(e.target.value) || 0;
                                      const th = therapists.find((x: any) => Number(x.id) === Number(item.therapist_id));
                                      const r = Number(th?.commission_rate || 60);
                                      onItemChange(index, {
                                        additional_charge: val,
                                        additional_charge_therapist_share: Math.round((val * r) / 100),
                                      });
                                    }}
                                    className="h-8 text-xs font-semibold bg-background"
                                    min={0}
                                    placeholder="0"
                                    autoFocus={!item.additional_charge}
                                  />
                                </div>
                                <div className="sm:col-span-8 flex items-center gap-2">
                                  <Input
                                    type="text"
                                    placeholder={isEn ? "Reason (e.g. Villa entry fee, parking...)" : "Keterangan (misal: Charge villa, hotel, parkir...)"}
                                    value={item.additional_charge_description || ""}
                                    onChange={(e) => onItemChange(index, { additional_charge_description: e.target.value })}
                                    className="h-8 text-xs bg-background flex-1"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      onItemChange(index, {
                                        additional_charge: 0,
                                        additional_charge_description: "",
                                        additional_charge_therapist_share: 0,
                                      });
                                      setOpenChargeIndices((prev) => ({ ...prev, [item.id]: false }));
                                    }}
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer shrink-0"
                                    title={isEn ? "Remove charge" : "Hapus charge"}
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {Number(item.additional_charge || 0) > 0 && (
                              <TherapistShareSlider
                                label={isEn ? "Therapist Charge Share" : "Jatah Charge Terapis"}
                                totalAmount={Number(item.additional_charge || 0)}
                                therapistShare={
                                  item.additional_charge_therapist_share !== undefined
                                    ? Number(item.additional_charge_therapist_share)
                                    : Math.round(
                                        (Number(item.additional_charge || 0) *
                                          Number(
                                            therapists.find((x: any) => Number(x.id) === Number(item.therapist_id))
                                              ?.commission_rate || 60
                                          )) /
                                          100
                                      )
                                }
                                onChange={(share) =>
                                  onItemChange(index, { additional_charge_therapist_share: share })
                                }
                                isEn={isEn}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Single Therapist Action Buttons */}
                    {(!isTransportOpen || !isChargeOpen) && (
                      <div className="flex items-center gap-2 pt-0.5">
                        {!isTransportOpen && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setOpenTransportIndices((prev) => ({ ...prev, [item.id]: true }))}
                            className="h-7 px-2.5 text-[11px] font-medium border-dashed text-muted-foreground hover:text-foreground bg-background hover:bg-muted/40 cursor-pointer gap-1.5"
                          >
                            <Plus className="w-3 h-3" />
                            <span>{isEn ? "Add Transport Fee" : "Tambah Ongkir / Transport"}</span>
                          </Button>
                        )}

                        {!isChargeOpen && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setOpenChargeIndices((prev) => ({ ...prev, [item.id]: true }))}
                            className="h-7 px-2.5 text-[11px] font-medium border-dashed text-muted-foreground hover:text-foreground bg-background hover:bg-muted/40 cursor-pointer gap-1.5"
                          >
                            <Plus className="w-3 h-3" />
                            <span>{isEn ? "Add Extra Charge" : "Tambah Biaya Charge"}</span>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/40">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddItem}
            className="h-8 text-xs font-medium gap-1.5 cursor-pointer self-start"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isEn ? "Add Service / Therapist" : "Tambah Layanan / Terapis"}</span>
          </Button>

          <div className="flex flex-wrap items-center gap-3 self-end sm:self-center text-xs">
            {totalTransport > 0 && (
              <span className="text-muted-foreground">
                {isEn ? "Transport:" : "Transport:"}{" "}
                <span className="font-semibold text-amber-700 dark:text-amber-400">+{formatIDR(totalTransport)}</span>
              </span>
            )}
            {totalAdditionalCharge > 0 && (
              <span className="text-muted-foreground">
                {isEn ? "Extra Charge:" : "Charge Tambahan:"}{" "}
                <span className="font-semibold text-blue-700 dark:text-blue-400">+{formatIDR(totalAdditionalCharge)}</span>
              </span>
            )}
            <span className="font-medium text-muted-foreground">
              {isEn ? "Total Price:" : "Total Tagihan:"}{" "}
              <span className="text-sm font-bold text-foreground">
                {formatIDR(grandTotal)}
              </span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

