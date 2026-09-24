"use client";

import * as React from "react";
import {
  useRecordContext,
  useTranslate,
  useLocaleState,
  useGetResourceLabel,
  useNavigate,
  useNotify,
  useRedirect,
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
import { BooleanInput } from "@/components/boolean-input";
import { SelectInput } from "@/components/select-input";
import { SearchableCombobox } from "@/components/searchable-combobox";
import { RowActions } from "@/components/row-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useGetList } from "ra-core";
import {
  Boxes,
  Sparkles,
  Plus,
  Trash2,
  Layers,
  Scale,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle2,
  Info,
  Activity,
  HeartPulse,
  Footprints,
  Flame,
  Award,
  Folders,
  Edit3,
  Check,
  X,
} from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { supabase } from "@/lib/supabase";
import { formatIDR } from "@/lib/utils";

export const defaultServiceCategories = [
  { id: "Massage Packages", name: "Massage Packages" },
  { id: "Massage Services", name: "Massage Services" },
  { id: "Refleksi Service", name: "Refleksi Service" },
  { id: "Kids & Mom Services", name: "Kids & Mom Services" },
  { id: "Couple Package", name: "Couple Package" },
  { id: "Add-On Service", name: "Add-On Service" },
];

export const serviceCategories = defaultServiceCategories;

/**
 * Interactive Service Category Management Dialog
 */
export const ServiceCategoryManagerDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoriesUpdated?: () => void;
}> = ({ open, onOpenChange, onCategoriesUpdated }) => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const { data: services = [], refetch } = useGetList("services", {
    pagination: { page: 1, perPage: 200 },
  });

  const [newCatName, setNewCatName] = React.useState("");
  const [editingCat, setEditingCat] = React.useState<string | null>(null);
  const [editCatName, setEditCatName] = React.useState("");
  const [customCategories, setCustomCategories] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Compute category stats
  const categoryStats = React.useMemo(() => {
    const map = new Map<string, number>();
    
    // Seed defaults
    defaultServiceCategories.forEach((dc) => map.set(dc.name, 0));
    customCategories.forEach((cc) => {
      if (!map.has(cc)) map.set(cc, 0);
    });

    // Count from services
    services.forEach((s) => {
      const cat = s.category || "Uncategorized";
      map.set(cat, (map.get(cat) || 0) + 1);
    });

    return Array.from(map.entries()).map(([name, count]) => ({
      name,
      count,
    }));
  }, [services, customCategories]);

  const handleAddCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) {
      toast.error(isEn ? "Category name cannot be empty" : "Nama kategori tidak boleh kosong");
      return;
    }
    if (categoryStats.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(isEn ? "Category already exists" : "Kategori sudah ada");
      return;
    }

    setCustomCategories((prev) => [...prev, trimmed]);
    setNewCatName("");
    toast.success(isEn ? "Category added successfully" : "Kategori berhasil ditambahkan");
    onCategoriesUpdated?.();
  };

  const handleStartEdit = (catName: string) => {
    setEditingCat(catName);
    setEditCatName(catName);
  };

  const handleSaveEdit = async (oldName: string) => {
    const trimmed = editCatName.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingCat(null);
      return;
    }

    try {
      setLoading(true);
      // Update all services using this category in Supabase
      const { error } = await supabase
        .from("services")
        .update({ category: trimmed })
        .eq("category", oldName);

      if (error) throw error;

      setCustomCategories((prev) =>
        prev.map((c) => (c === oldName ? trimmed : c))
      );
      setEditingCat(null);
      await refetch();
      onCategoriesUpdated?.();
      toast.success(
        isEn
          ? `Category renamed to "${trimmed}" across all services`
          : `Kategori berhasil diubah menjadi "${trimmed}" pada seluruh layanan`
      );
    } catch (e: any) {
      toast.error(e.message || "Failed to update category");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (catName: string, serviceCount: number) => {
    if (serviceCount > 0) {
      toast.error(
        isEn
          ? `Cannot delete: ${serviceCount} services belong to this category. Please reassign them first.`
          : `Tidak dapat menghapus: terdapat ${serviceCount} layanan di kategori ini. Silakan pindahkan kategorinya terlebih dahulu.`
      );
      return;
    }

    setCustomCategories((prev) => prev.filter((c) => c !== catName));
    toast.success(isEn ? "Category deleted" : "Kategori berhasil dihapus");
    onCategoriesUpdated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Folders className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold">
                {isEn ? "Service Categories Management" : "Manajemen Kategori Layanan"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {isEn
                  ? "Create, edit, or remove service catalog categories."
                  : "Tambah, ubah nama, atau hapus kategori katalog layanan SerenaRaga."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Add Category Form */}
          <div className="flex gap-2">
            <Input
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder={isEn ? "New category name..." : "Nama kategori baru..."}
              className="h-8 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCategory();
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              onClick={handleAddCategory}
              className="h-8 gap-1 text-xs shrink-0 cursor-pointer shadow-none"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isEn ? "Add" : "Tambah"}</span>
            </Button>
          </div>

          {/* Categories List */}
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            <span className="text-[11px] font-semibold text-muted-foreground block mb-2 uppercase tracking-wider">
              {isEn ? "Active Categories" : "Daftar Kategori Aktif"} ({categoryStats.length})
            </span>

            {categoryStats.map((cat) => {
              const isEditing = editingCat === cat.name;

              return (
                <div
                  key={cat.name}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg border border-border/60 bg-muted/20 text-xs"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 flex-1 mr-1">
                      <Input
                        value={editCatName}
                        onChange={(e) => setEditCatName(e.target.value)}
                        className="h-7 text-xs px-2"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(cat.name);
                          if (e.key === "Escape") setEditingCat(null);
                        }}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleSaveEdit(cat.name)}
                        disabled={loading}
                        className="h-7 w-7 text-primary hover:bg-primary/10"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingCat(null)}
                        className="h-7 w-7 text-muted-foreground"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-foreground truncate">
                          {cat.name}
                        </span>
                        <Badge variant="secondary" className="text-[10px] font-normal px-1.5 py-0 h-4 shrink-0">
                          {cat.count} {isEn ? "services" : "layanan"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStartEdit(cat.name)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title={isEn ? "Rename Category" : "Ubah Nama Kategori"}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCategory(cat.name, cat.count)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title={isEn ? "Delete Category" : "Hapus Kategori"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs cursor-pointer shadow-none"
          >
            {isEn ? "Close" : "Tutup"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

import { CreateButton } from "@/components/create-button";
import { ExportButton } from "@/components/export-button";

/**
 * Custom Actions for ServiceList: Categories, Consumables, Create, Export
 */
export const ServiceListActions = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const [catDialogOpen, setCatDialogOpen] = React.useState(false);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant="outline"
        onClick={() => setCatDialogOpen(true)}
        className="cursor-pointer gap-1.5 h-8 text-xs shadow-none"
      >
        <Folders className="w-3.5 h-3.5 text-primary" />
        <span>{isEn ? "Categories" : "Kelola Kategori"}</span>
      </Button>
      <Button variant="outline" asChild className="cursor-pointer gap-1.5 h-8 text-xs shadow-none">
        <LinkBase to="/consumables">
          <Boxes className="w-3.5 h-3.5" />
          <span>{isEn ? "Consumables" : "Bahan Habis Pakai"}</span>
        </LinkBase>
      </Button>
      <CreateButton />
      <ExportButton />

      <ServiceCategoryManagerDialog
        open={catDialogOpen}
        onOpenChange={setCatDialogOpen}
      />
    </div>
  );
};

/**
 * Service List View with Consumables Shortcut in Action Toolbar
 */
export const ServiceList = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  return (
    <List actions={<ServiceListActions />}>
      <DataTable>
        <DataTableCol source="id" label="#" headerClassName="w-14" cellClassName="text-xs font-bold text-primary" />
        <DataTableCol source="name" cellClassName="font-medium text-foreground text-xs" />
        <DataTableCol
          source="category"
          cellClassName="text-xs"
          render={(record) => (
            <Badge variant="outline" className="text-[11px] font-normal border-border bg-muted/30">
              {record.category || "Massage Services"}
            </Badge>
          )}
        />
        <DataTableCol
          source="duration_minutes"
          label={isEn ? "Duration" : "Durasi"}
          headerClassName="text-center w-24"
          cellClassName="text-center text-xs"
          render={(record) => <span>{record.duration_minutes || 60} {isEn ? "Mins" : "Mnt"}</span>}
        />
        <DataTableCol
          source="price"
          label={isEn ? "Selling Price" : "Harga Jual"}
          headerClassName="text-right w-32"
          cellClassName="text-xs font-semibold text-foreground text-right"
        >
          <NumberField
            source="price"
            options={{ style: "currency", currency: "IDR", maximumFractionDigits: 0 }}
          />
        </DataTableCol>
        <DataTableCol
          source="consumables_cost"
          label={isEn ? "Consumables (COGS)" : "Biaya Bahan (HPP)"}
          headerClassName="text-right w-36"
          cellClassName="text-xs text-muted-foreground text-right font-medium"
          render={(record) => <span>{formatIDR(record.consumables_cost || 0)}</span>}
        />
        <DataTableCol
          source="is_active"
          label={isEn ? "Status" : "Status"}
          headerClassName="w-20 text-center"
          cellClassName="text-center"
        >
          <BooleanField source="is_active" className="w-4 h-4 text-foreground" />
        </DataTableCol>
        <DataTableCol label="ra.action.name" headerClassName="text-right w-16" cellClassName="text-right">
          <RowActions />
        </DataTableCol>
      </DataTable>
    </List>
  );
};

interface ConsumableItemOption {
  id: number;
  name: string;
  unit: string;
  cost_per_unit: number;
  stock_quantity: number;
}

interface ServiceConsumableEntry {
  id?: number;
  consumable_id: number;
  quantity: number;
  unit_cost_snapshot: number;
  total_cost: number;
}

/**
 * Interactive Consumables Composer for Service Create & Edit
 */
const ServiceConsumablesEditor: React.FC<{
  serviceId?: number | string;
  onCostChange?: (totalCost: number) => void;
}> = ({ serviceId, onCostChange }) => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const [availableConsumables, setAvailableConsumables] = React.useState<ConsumableItemOption[]>([]);
  const [selectedItems, setSelectedItems] = React.useState<ServiceConsumableEntry[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Fetch available master consumables from Supabase
  React.useEffect(() => {
    async function loadMasterConsumables() {
      try {
        setLoading(true);
        const { data: masterData } = await supabase
          .from("consumables")
          .select("id, name, unit, cost_per_unit, stock_quantity")
          .eq("is_active", true)
          .order("name", { ascending: true });

        setAvailableConsumables(masterData || []);

        // If editing existing service, fetch its configured service_consumables
        if (serviceId) {
          const { data: existingData } = await supabase
            .from("service_consumables")
            .select("*")
            .eq("service_id", serviceId);

          if (existingData && existingData.length > 0) {
            setSelectedItems(
              existingData.map((d) => ({
                id: d.id,
                consumable_id: d.consumable_id,
                quantity: Number(d.quantity) || 1,
                unit_cost_snapshot: Number(d.unit_cost_snapshot) || 0,
                total_cost: Number(d.total_cost) || 0,
              }))
            );
          }
        }
      } finally {
        setLoading(false);
      }
    }
    loadMasterConsumables();
  }, [serviceId]);

  // Recalculate totals and notify parent
  const totalConsumablesCost = React.useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + (Number(item.total_cost) || 0), 0);
  }, [selectedItems]);

  React.useEffect(() => {
    if (onCostChange) {
      onCostChange(totalConsumablesCost);
    }
  }, [totalConsumablesCost, onCostChange]);

  const handleAddItem = () => {
    if (availableConsumables.length === 0) return;
    const firstUnused =
      availableConsumables.find(
        (c) => !selectedItems.some((si) => si.consumable_id === c.id)
      ) || availableConsumables[0];

    const newItem: ServiceConsumableEntry = {
      consumable_id: firstUnused.id,
      quantity: firstUnused.unit === "ml" ? 40 : firstUnused.unit === "gram" ? 25 : 1,
      unit_cost_snapshot: Number(firstUnused.cost_per_unit) || 0,
      total_cost:
        (firstUnused.unit === "ml" ? 40 : firstUnused.unit === "gram" ? 25 : 1) *
        (Number(firstUnused.cost_per_unit) || 0),
    };
    setSelectedItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, consumableId: number) => {
    const master = availableConsumables.find((c) => c.id === consumableId);
    if (!master) return;

    setSelectedItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const unitCost = Number(master.cost_per_unit) || 0;
        return {
          ...item,
          consumable_id: consumableId,
          unit_cost_snapshot: unitCost,
          total_cost: item.quantity * unitCost,
        };
      })
    );
  };

  const handleQuantityChange = (index: number, qty: number) => {
    setSelectedItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const safeQty = Math.max(0, qty);
        return {
          ...item,
          quantity: safeQty,
          total_cost: safeQty * item.unit_cost_snapshot,
        };
      })
    );
  };

  // Exposed method to save consumables on form submit
  React.useEffect(() => {
    (window as any).__SERENA_SERVICE_CONSUMABLES__ = selectedItems;
    (window as any).__SERENA_TOTAL_CONSUMABLES_COST__ = totalConsumablesCost;
  }, [selectedItems, totalConsumablesCost]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <span className="text-xs font-semibold text-foreground">
          {isEn ? "Materials Used per Session" : "Daftar Bahan Digunakan per Treatment"}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddItem}
          disabled={availableConsumables.length === 0}
          className="h-8 gap-1.5 text-xs shadow-none cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-primary" />
          <span>{isEn ? "Add Material" : "Tambah Bahan"}</span>
        </Button>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground py-4">{isEn ? "Loading material catalog..." : "Memuat data bahan..."}</p>
      ) : selectedItems.length === 0 ? (
        <Empty className="min-h-[160px] py-6 border-dashed border-border/70 bg-muted/10">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="h-9 w-9 [&_svg]:h-4.5 [&_svg]:w-4.5 mb-1">
              <Boxes className="text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle className="text-xs">
              {isEn ? "No consumables assigned" : "Belum ada bahan habis pakai"}
            </EmptyTitle>
            <EmptyDescription className="text-[11px]">
              {isEn
                ? "Add massage oils, body scrubs, or linen to automatically compute COGS and net margins."
                : "Tentukan minyak pijat, lulur, atau linen untuk menghitung otomatis HPP dan laba bersih per sesi."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              disabled={availableConsumables.length === 0}
              className="gap-1.5 text-xs cursor-pointer shadow-none h-7"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isEn ? "Add First Material" : "Tambah Bahan Sekarang"}</span>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-2.5">
          {selectedItems.map((item, idx) => {
            const master = availableConsumables.find((c) => c.id === item.consumable_id);
            const unit = master?.unit || "unit";

            return (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3 rounded-lg bg-muted/20 border border-border/60 text-xs"
              >
                {/* 1. Consumable Select */}
                <div className="sm:col-span-5">
                  <label className="text-[10px] text-muted-foreground block mb-1 font-medium">
                    {isEn ? "Select Material" : "Pilih Bahan"}
                  </label>
                  <SearchableCombobox
                    size="sm"
                    options={availableConsumables.map((c) => ({
                      value: String(c.id),
                      label: `${c.name} (${formatIDR(c.cost_per_unit)}/${c.unit})`,
                    }))}
                    value={String(item.consumable_id)}
                    placeholder={isEn ? "Select material..." : "Pilih bahan..."}
                    searchPlaceholder={isEn ? "Search material..." : "Cari nama bahan..."}
                    onValueChange={(val) => handleItemChange(idx, Number(val))}
                  />
                </div>

                {/* 2. Quantity Input */}
                <div className="sm:col-span-3">
                  <label className="text-[10px] text-muted-foreground block mb-1 font-medium">
                    {isEn ? `Quantity (${unit})` : `Takaran (${unit})`}
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(idx, parseFloat(e.target.value) || 0)}
                    className="h-8 px-2.5 text-xs font-mono"
                  />
                </div>

                {/* 3. Subtotal Cost */}
                <div className="sm:col-span-3">
                  <label className="text-[10px] text-muted-foreground block mb-1 font-medium">
                    {isEn ? "Subtotal Cost" : "Subtotal Biaya"}
                  </label>
                  <div className="h-8 flex items-center font-bold text-foreground font-mono">
                    {formatIDR(item.total_cost)}
                  </div>
                </div>

                {/* 4. Delete Action */}
                <div className="sm:col-span-1 flex items-end justify-end sm:justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(idx)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title={isEn ? "Remove Material" : "Hapus Bahan"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Total Consumables Summary */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/70 text-xs font-semibold">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-primary" />
              <span>{isEn ? "Total Consumables Cost (COGS):" : "Total Biaya Bahan (HPP):"}</span>
            </span>
            <span className="text-sm font-bold text-foreground font-mono">
              {formatIDR(totalConsumablesCost)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Shared Clean & Modern Service Form Layout using Shadcn Cards
 */
const ServiceFormContent = ({ mode = "create" }: { mode?: "create" | "edit" }) => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const record = useRecordContext();
  const { data: allServices = [] } = useGetList("services", {
    pagination: { page: 1, perPage: 200 },
  });

  const dynamicCategoryChoices = React.useMemo(() => {
    const set = new Set<string>();
    defaultServiceCategories.forEach((dc) => set.add(dc.name));
    allServices.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return Array.from(set).map((name) => ({ id: name, name }));
  }, [allServices]);

  return (
    <div className="space-y-5 max-w-4xl">
      {/* 1. Card: Service Details & Pricing */}
      <Card className="border border-border shadow-none bg-card">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                {isEn ? "Service Details & Pricing" : "Informasi Layanan & Harga"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {isEn
                  ? "Configure service name, category, duration, and customer selling price."
                  : "Atur nama paket pijat, kategori, durasi waktu, dan tarif harga jual ke pelanggan."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <TextInput
              source="name"
              label={isEn ? "Service Name" : "Nama Layanan"}
              required
              placeholder={isEn ? "e.g. Traditional Balinese Massage" : "Contoh: Traditional Balinese Massage"}
              validate={required(isEn ? "Service name is required" : "Nama layanan wajib diisi")}
            />
            <SelectInput
              source="category"
              label={isEn ? "Category" : "Kategori"}
              defaultValue="Massage Services"
              choices={dynamicCategoryChoices}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <NumberInput
              source="duration_minutes"
              label={isEn ? "Duration (Minutes)" : "Durasi Waktu (Menit)"}
              defaultValue={60}
              min={15}
              step={15}
              required
            />
            <NumberInput
              source="price"
              label={isEn ? "Selling Price (IDR)" : "Harga Jual Layanan (IDR)"}
              defaultValue={150000}
              min={0}
              step={1}
              required
            />
          </div>

          <TextInput
            source="description"
            label={isEn ? "Service Description" : "Deskripsi Manfaat & Metode Layanan"}
            multiline
            rows={3}
            placeholder={isEn ? "Detailed treatment description..." : "Deskripsi manfaat relaksasi dan metode layanan pijat..."}
          />

          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-foreground block">
                {isEn ? "Service Active Status" : "Status Aktif Layanan"}
              </span>
              <p className="text-[11px] text-muted-foreground">
                {isEn
                  ? "Active services appear in booking forms and customer selection menus."
                  : "Layanan aktif akan muncul di form reservasi dan katalog pemesanan pelanggan."}
              </p>
            </div>
            <BooleanInput
              source="is_active"
              label={isEn ? "Active" : "Layanan Aktif"}
              defaultValue={true}
              className="m-0 self-start sm:self-center"
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. Card: Consumables & Material Composition (COGS) */}
      <Card className="border border-border shadow-none bg-card">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                {isEn ? "Consumables & Material Composition (COGS)" : "Komposisi Bahan Habis Pakai (HPP Layanan)"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {isEn
                  ? "Define ingredients (oils, scrubs, linen) used for this treatment to compute net margins."
                  : "Tentukan takaran bahan pijat (minyak, lulur, linen) untuk mengalkulasi laba bersih secara otomatis."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <ServiceConsumablesEditor serviceId={record?.id} />
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Service Edit Form with Consumables Composition
 */
export const ServiceEdit = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const notify = useNotify();
  const redirect = useRedirect();

  const handleSaveConsumables = async (data: any) => {
    try {
      const items: ServiceConsumableEntry[] = (window as any).__SERENA_SERVICE_CONSUMABLES__ || [];
      const totalCost: number = (window as any).__SERENA_TOTAL_CONSUMABLES_COST__ || 0;

      // Update consumables_cost in services table
      if (data?.id) {
        await supabase
          .from("services")
          .update({ consumables_cost: totalCost })
          .eq("id", data.id);

        // Replace service_consumables
        await supabase.from("service_consumables").delete().eq("service_id", data.id);

        if (items.length > 0) {
          await supabase.from("service_consumables").insert(
            items.map((it) => ({
              service_id: data.id,
              consumable_id: it.consumable_id,
              quantity: it.quantity,
              unit_cost_snapshot: it.unit_cost_snapshot,
              total_cost: it.total_cost,
            }))
          );
        }
      }
      notify(isEn ? "Service and materials saved successfully" : "Layanan dan komposisi bahan berhasil disimpan", { type: "success" });
      redirect("list", "services");
    } catch (err: any) {
      console.error("Error saving service consumables:", err);
      notify(isEn ? "Failed to save materials: " + err.message : "Gagal menyimpan bahan: " + (err.message || err), { type: "error" });
    }
  };

  return (
    <Edit
      title={isEn ? "Edit Service & Materials" : "Ubah Data Layanan & Bahan Pijat"}
      mutationMode="pessimistic"
      mutationOptions={{
        onSuccess: handleSaveConsumables,
        onError: (err: any) => {
          notify(isEn ? "Failed to update service: " + err.message : "Gagal menyimpan layanan: " + (err.message || err), { type: "error" });
        },
      }}
    >
      <SimpleForm>
        <ServiceFormContent mode="edit" />
      </SimpleForm>
    </Edit>
  );
};

/**
 * Service Create Form with Consumables Composition
 */
export const ServiceCreate = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const notify = useNotify();
  const redirect = useRedirect();

  const handleSaveConsumablesOnCreate = async (data: any) => {
    try {
      const items: ServiceConsumableEntry[] = (window as any).__SERENA_SERVICE_CONSUMABLES__ || [];
      const totalCost: number = (window as any).__SERENA_TOTAL_CONSUMABLES_COST__ || 0;

      if (data?.id) {
        await supabase
          .from("services")
          .update({ consumables_cost: totalCost })
          .eq("id", data.id);

        if (items.length > 0) {
          await supabase.from("service_consumables").insert(
            items.map((it) => ({
              service_id: data.id,
              consumable_id: it.consumable_id,
              quantity: it.quantity,
              unit_cost_snapshot: it.unit_cost_snapshot,
              total_cost: it.total_cost,
            }))
          );
        }
      }
      notify(isEn ? "Service created successfully" : "Layanan baru berhasil ditambahkan", { type: "success" });
      redirect("list", "services");
    } catch (err: any) {
      console.error("Error creating service consumables:", err);
      notify(isEn ? "Failed to save materials: " + err.message : "Gagal menyimpan bahan: " + (err.message || err), { type: "error" });
    }
  };

  return (
    <Create
      title={isEn ? "Add New Service" : "Tambah Layanan Baru"}
      mutationMode="pessimistic"
      mutationOptions={{
        onSuccess: handleSaveConsumablesOnCreate,
        onError: (err: any) => {
          notify(isEn ? "Failed to create service: " + err.message : "Gagal menambahkan layanan: " + (err.message || err), { type: "error" });
        },
      }}
    >
      <SimpleForm>
        <ServiceFormContent mode="create" />
      </SimpleForm>
    </Create>
  );
};

/**
 * Service Show Detail View with Consumables Breakdown
 */
const ServiceShowView = () => {
  const record = useRecordContext();
  const translate = useTranslate();
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const [consumablesList, setConsumablesList] = React.useState<any[]>([]);
  const [loadingConsumables, setLoadingConsumables] = React.useState(false);

  React.useEffect(() => {
    const recordId = record?.id;
    if (!recordId) return;
    async function loadServiceConsumables() {
      try {
        setLoadingConsumables(true);
        const { data } = await supabase
          .from("service_consumables")
          .select("*, consumables(id, name, unit, cost_per_unit, category)")
          .eq("service_id", recordId);
        setConsumablesList(data || []);
      } finally {
        setLoadingConsumables(false);
      }
    }
    loadServiceConsumables();
  }, [record?.id]);

  if (!record) return null;

  const price = Number(record.price) || 0;
  const cogs = Number(record.consumables_cost) || 0;
  const estimatedTherapist = Math.round(price * 0.6); // 60% default therapist fee
  const netProfit = Math.max(0, price - cogs - estimatedTherapist);

  return (
    <div className="space-y-6">
      {/* 1. Header Profile Card */}
      <div className="rounded-xl border border-border/70 bg-card p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">{record.name}</h2>
              <span className="text-xs text-muted-foreground font-mono">
                • {record.category || "Body Massage"}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                • {record.duration_minutes || 60} {isEn ? "Mins" : "Menit"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {isEn ? "Service Rate:" : "Harga Layanan:"}{" "}
              <span className="font-bold text-foreground text-sm">
                {formatIDR(record.price)}
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

      {/* 2. Profit Simulator Card */}
      <Card className="border border-border/70 bg-card shadow-none">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            <span>{isEn ? "Financial Margin Breakdown" : "Simulasi Laba Bersih Layanan"}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-muted/20 border border-border/50 space-y-1">
              <span className="text-muted-foreground text-[11px] block">{isEn ? "Gross Price" : "Harga Jual (Omzet)"}</span>
              <span className="font-bold text-foreground text-sm">{formatIDR(price)}</span>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 border border-border/50 space-y-1">
              <span className="text-muted-foreground text-[11px] block">{isEn ? "Consumables (COGS)" : "Biaya Bahan (HPP)"}</span>
              <span className="font-bold text-amber-700 dark:text-amber-400 text-sm">
                -{formatIDR(cogs)}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 border border-border/50 space-y-1">
              <span className="text-muted-foreground text-[11px] block">{isEn ? "Therapist Share (60%)" : "Hak Terapis (60%)"}</span>
              <span className="font-bold text-muted-foreground text-sm">
                -{formatIDR(estimatedTherapist)}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-1">
              <span className="text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold block">{isEn ? "Net Company Margin" : "Estimasi Laba Bersih"}</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                {formatIDR(netProfit)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Consumables Composition Table */}
      <Card className="border border-border/70 bg-card shadow-none">
        <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Boxes className="w-4 h-4 text-primary" />
            <span>{isEn ? "Consumables Used per Treatment" : "Daftar Bahan Habis Pakai yang Digunakan"}</span>
          </CardTitle>
          <LinkBase to="/consumables" className="text-xs text-primary hover:underline font-medium">
            {isEn ? "Manage Catalog ->" : "Katalog Bahan ->"}
          </LinkBase>
        </CardHeader>
        <CardContent className="pt-3">
          {loadingConsumables ? (
            <p className="text-xs text-muted-foreground">{isEn ? "Loading materials..." : "Memuat data bahan..."}</p>
          ) : consumablesList.length === 0 ? (
            <Empty className="min-h-[140px] py-6 border-dashed border-border/60 bg-muted/10">
              <EmptyHeader>
                <EmptyMedia variant="icon" className="h-9 w-9 [&_svg]:h-4 [&_svg]:w-4 mb-1">
                  <Boxes className="text-muted-foreground" />
                </EmptyMedia>
                <EmptyTitle className="text-xs">
                  {isEn ? "No specific materials configured" : "Belum ada bahan khusus"}
                </EmptyTitle>
                <EmptyDescription className="text-[11px]">
                  {isEn
                    ? "No consumable materials configured for this service yet."
                    : "Belum ada takaran bahan khusus yang dikonfigurasi untuk menu layanan ini."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="divide-y divide-border/50 text-xs">
              {consumablesList.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{item.consumables?.name || `Bahan #${item.consumable_id}`}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.consumables?.category || "Material"} • {formatIDR(item.consumables?.cost_per_unit || item.unit_cost_snapshot)} / {item.consumables?.unit || "unit"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-medium text-foreground">
                      {item.quantity} {item.consumables?.unit || ""}
                    </p>
                    <p className="font-bold text-foreground">
                      {formatIDR(item.total_cost || (item.quantity * (item.consumables?.cost_per_unit || 0)))}
                    </p>
                  </div>
                </div>
              ))}
              <div className="pt-3 flex items-center justify-between font-bold text-xs">
                <span>{isEn ? "Total Material Cost:" : "Total HPP Bahan per Sesi:"}</span>
                <span className="font-mono text-sm">{formatIDR(cogs)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Description Note */}
      <Card className="border border-border/70 bg-card shadow-none">
        <CardHeader className="pb-2 border-b border-border/50">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {translate("resources.services.fields.description")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3 text-xs text-foreground leading-relaxed">
          {record.description || (isEn ? "No detailed description provided." : "Belum ada deskripsi layanan.")}
        </CardContent>
      </Card>
    </div>
  );
};

export const ServiceShow = () => {
  return (
    <Show>
      <ServiceShowView />
    </Show>
  );
};
