"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  TrendingDown,
  Upload,
  Camera,
  X,
  Calendar as CalendarIcon,
  Receipt,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { formatIDR, cn } from "@/lib/utils";
import {
  FinancialAccount,
  FinancialCategory,
  createFinancialTransaction,
  uploadReceiptFile,
} from "@/lib/financial-ledger";
import { toast } from "sonner";

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: FinancialAccount[];
  categories: FinancialCategory[];
  onSuccess?: () => void;
  isEn?: boolean;
}

export const ExpenseDialog: React.FC<ExpenseDialogProps> = ({
  open,
  onOpenChange,
  accounts,
  categories,
  onSuccess,
  isEn = false,
}) => {
  const expenseCategories = React.useMemo(
    () => categories.filter((c) => c.type === "expense" && c.is_active),
    [categories]
  );
  const activeAccounts = React.useMemo(
    () => accounts.filter((a) => a.is_active),
    [accounts]
  );

  const [selectedAccountId, setSelectedAccountId] = React.useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string>("");
  const [rawAmount, setRawAmount] = React.useState<string>("");
  const [description, setDescription] = React.useState<string>("");
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [notes, setNotes] = React.useState<string>("");
  const [receiptFile, setReceiptFile] = React.useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [calendarOpen, setCalendarOpen] = React.useState<boolean>(false);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Reset form when opened
  React.useEffect(() => {
    if (open) {
      if (activeAccounts.length > 0) {
        setSelectedAccountId(activeAccounts[0].id.toString());
      }
      if (expenseCategories.length > 0) {
        setSelectedCategoryId(expenseCategories[0].id.toString());
      }
      setRawAmount("");
      setDescription("");
      setSelectedDate(new Date());
      setNotes("");
      setReceiptFile(null);
      setReceiptPreview(null);
      setIsSubmitting(false);
    }
  }, [open, activeAccounts, expenseCategories]);

  // Handle Amount Formatting
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setRawAmount(val);
  };

  const parsedAmount = parseInt(rawAmount || "0", 10);

  // Handle File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(isEn ? "File size exceeds 5MB limit" : "Ukuran file maksimal 5MB");
      return;
    }

    setReceiptFile(file);
    const url = URL.createObjectURL(file);
    setReceiptPreview(url);
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    if (receiptPreview) {
      URL.revokeObjectURL(receiptPreview);
      setReceiptPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAccountId) {
      toast.error(isEn ? "Please select a source account" : "Pilih sumber kas/rekening");
      return;
    }

    if (!parsedAmount || parsedAmount <= 0) {
      toast.error(isEn ? "Please enter a valid amount" : "Nominal pengeluaran wajib diisi");
      return;
    }

    if (!description.trim()) {
      toast.error(isEn ? "Description is required" : "Deskripsi pengeluaran wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      let uploadedReceiptUrl: string | null = null;
      if (receiptFile) {
        uploadedReceiptUrl = await uploadReceiptFile(receiptFile);
      }

      const catObj = expenseCategories.find((c) => c.id.toString() === selectedCategoryId);

      const formattedDate = format(selectedDate, "yyyy-MM-dd");

      await createFinancialTransaction({
        type: "expense",
        account_id: parseInt(selectedAccountId, 10),
        category_id: catObj ? catObj.id : null,
        category_name_snapshot: catObj ? catObj.name : null,
        amount: parsedAmount,
        transaction_date: formattedDate,
        description: description.trim(),
        receipt_url: uploadedReceiptUrl,
        notes: notes.trim() || null,
      });

      toast.success(
        isEn
          ? `Expense ${formatIDR(parsedAmount)} recorded successfully!`
          : `Pengeluaran ${formatIDR(parsedAmount)} berhasil dicatat!`
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.message || (isEn ? "Failed to record expense" : "Gagal mencatat pengeluaran"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md max-h-[90dvh] flex flex-col p-0 overflow-hidden border-border shadow-lg">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <TrendingDown className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold tracking-tight">
                {isEn ? "Record Expense" : "Catat Pengeluaran"}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* 1. Sumber Rekening / Kas */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              {isEn ? "Source Account" : "Sumber Kas / Rekening"} *
            </Label>
            <Select
              value={selectedAccountId}
              onValueChange={(val) => { if (val) setSelectedAccountId(val); }}
            >
              <SelectTrigger className="text-xs">
                <SelectValue placeholder={isEn ? "Select account" : "Pilih rekening / kas"}>
                  {(val) => {
                    const acc = activeAccounts.find((a) => a.id.toString() === String(val));
                    return acc ? `${acc.name}${acc.account_number ? ` • ${acc.account_number}` : ""}` : (isEn ? "Select account" : "Pilih rekening / kas");
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {activeAccounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id.toString()} className="text-xs">
                    {acc.name}
                    {acc.account_number ? ` • ${acc.account_number}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 2. Kategori Pengeluaran */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              {isEn ? "Expense Category" : "Kategori Pengeluaran"} *
            </Label>
            <Select
              value={selectedCategoryId}
              onValueChange={(val) => { if (val) setSelectedCategoryId(val); }}
            >
              <SelectTrigger className="text-xs">
                <SelectValue placeholder={isEn ? "Select category" : "Pilih kategori"}>
                  {(val) => {
                    const cat = expenseCategories.find((c) => c.id.toString() === String(val));
                    return cat ? cat.name : (isEn ? "Select category" : "Pilih kategori");
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()} className="text-xs">
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 3. Nominal Pengeluaran */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              {isEn ? "Amount (IDR)" : "Nominal Pengeluaran (Rp)"} *
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                Rp
              </span>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={rawAmount ? Number(rawAmount).toLocaleString("id-ID") : ""}
                onChange={handleAmountChange}
                className="pl-9 text-sm font-semibold tracking-tight"
                required
              />
            </div>
          </div>

          {/* 4. Deskripsi Pengeluaran */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              {isEn ? "Description" : "Keterangan / Item Belanja"} *
            </Label>
            <Input
              type="text"
              placeholder={isEn ? "e.g., Lavender oil 2L & body scrub" : "Contoh: Beli minyak lavender 2 botol & scrub"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs"
              required
            />
          </div>

          {/* 5. Tanggal Transaksi */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              {isEn ? "Date" : "Tanggal Transaksi"}
            </Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left text-xs font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  />
                }
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {selectedDate
                  ? format(selectedDate, "dd MMMM yyyy", {
                      locale: isEn ? undefined : idLocale,
                    })
                  : isEn
                  ? "Pick a date"
                  : "Pilih tanggal"}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) setSelectedDate(date);
                    setCalendarOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* 6. Upload Foto Struk / Nota (Opsional tapi direkomendasikan) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground flex items-center justify-between">
              <span>{isEn ? "Receipt / Invoice Photo (Optional)" : "Foto Struk / Nota Pembelian (Opsional)"}</span>
              <span className="text-[11px] text-muted-foreground font-normal">Max 5MB</span>
            </Label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {receiptPreview ? (
              <div className="relative rounded-lg border border-border p-2 bg-muted/20 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-11 w-11 rounded-md border border-border overflow-hidden bg-background shrink-0 flex items-center justify-center">
                    {receiptFile?.type.includes("pdf") ? (
                      <Receipt className="h-5 w-5 text-primary" />
                    ) : (
                      <img
                        src={receiptPreview}
                        alt="Receipt preview"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {receiptFile?.name || "struk-nota.jpg"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] text-muted-foreground">
                        {receiptFile ? `${(receiptFile.size / 1024).toFixed(0)} KB` : "File terlampir"}
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[10px] text-primary hover:underline cursor-pointer"
                      >
                        {isEn ? "Change photo" : "Ganti foto"}
                      </button>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveReceipt}
                  className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                className="w-full border border-dashed border-border rounded-lg p-3.5 text-center hover:bg-muted/30 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer"
              >
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <Camera className="h-4 w-4" />
                </div>
                <p className="text-xs font-medium text-foreground mt-0.5">
                  {isEn ? "Upload receipt photo or scan" : "Ambil foto atau upload nota / struk"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  JPG, PNG, WebP atau PDF (memudahkan audit pembukuan)
                </p>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <DialogFooter className="p-4 sm:p-5 border-t border-border bg-muted/10 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer"
          >
            {isEn ? "Cancel" : "Batal"}
          </Button>

          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmitForm}
            className="cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                <span>{isEn ? "Saving..." : "Menyimpan..."}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                <span>{isEn ? "Save Expense" : "Simpan Pengeluaran"}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
