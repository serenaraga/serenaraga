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
  TrendingUp,
  Calendar as CalendarIcon,
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
} from "@/lib/financial-ledger";
import { toast } from "sonner";

interface IncomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: FinancialAccount[];
  categories: FinancialCategory[];
  onSuccess?: () => void;
  isEn?: boolean;
}

export const IncomeDialog: React.FC<IncomeDialogProps> = ({
  open,
  onOpenChange,
  accounts,
  categories,
  onSuccess,
  isEn = false,
}) => {
  const incomeCategories = React.useMemo(
    () => categories.filter((c) => c.type === "income" && c.is_active),
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
  const [referenceNumber, setReferenceNumber] = React.useState<string>("");
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [calendarOpen, setCalendarOpen] = React.useState<boolean>(false);

  // Reset form when opened
  React.useEffect(() => {
    if (open) {
      if (activeAccounts.length > 0) {
        setSelectedAccountId(activeAccounts[0].id.toString());
      }
      if (incomeCategories.length > 0) {
        setSelectedCategoryId(incomeCategories[0].id.toString());
      }
      setRawAmount("");
      setDescription("");
      setReferenceNumber("");
      setSelectedDate(new Date());
      setIsSubmitting(false);
    }
  }, [open, activeAccounts, incomeCategories]);

  // Handle Amount Formatting
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setRawAmount(val);
  };

  const parsedAmount = parseInt(rawAmount || "0", 10);

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAccountId) {
      toast.error(isEn ? "Please select a destination account" : "Pilih rekening/kas tujuan");
      return;
    }

    if (!parsedAmount || parsedAmount <= 0) {
      toast.error(isEn ? "Please enter a valid amount" : "Nominal pemasukan wajib diisi");
      return;
    }

    if (!description.trim()) {
      toast.error(isEn ? "Description is required" : "Deskripsi pemasukan wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      const catObj = incomeCategories.find((c) => c.id.toString() === selectedCategoryId);
      const formattedDate = format(selectedDate, "yyyy-MM-dd");

      await createFinancialTransaction({
        type: "income",
        account_id: parseInt(selectedAccountId, 10),
        category_id: catObj ? catObj.id : null,
        category_name_snapshot: catObj ? catObj.name : null,
        amount: parsedAmount,
        transaction_date: formattedDate,
        description: description.trim(),
        reference_number: referenceNumber.trim() || null,
      });

      toast.success(
        isEn
          ? `Income ${formatIDR(parsedAmount)} recorded successfully!`
          : `Pemasukan ${formatIDR(parsedAmount)} berhasil dicatat!`
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.message || (isEn ? "Failed to record income" : "Gagal mencatat pemasukan"));
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
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold tracking-tight">
                {isEn ? "Record Income" : "Catat Pemasukan"}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* 1. Rekening Tujuan Penerimaan */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              {isEn ? "Destination Account" : "Rekening / Kas Tujuan Penerimaan"} *
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

          {/* 2. Kategori Pemasukan */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              {isEn ? "Income Category" : "Kategori Pemasukan"} *
            </Label>
            <Select
              value={selectedCategoryId}
              onValueChange={(val) => { if (val) setSelectedCategoryId(val); }}
            >
              <SelectTrigger className="text-xs">
                <SelectValue placeholder={isEn ? "Select category" : "Pilih kategori"}>
                  {(val) => {
                    const cat = incomeCategories.find((c) => c.id.toString() === String(val));
                    return cat ? cat.name : (isEn ? "Select category" : "Pilih kategori");
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {incomeCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()} className="text-xs">
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 3. Nominal Pemasukan */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              {isEn ? "Amount (IDR)" : "Nominal Pemasukan (Rp)"} *
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

          {/* 4. Deskripsi Pemasukan */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              {isEn ? "Description" : "Keterangan Pemasukan"} *
            </Label>
            <Input
              type="text"
              placeholder={isEn ? "e.g., Massage package payment" : "Contoh: Pelunasan paket spa / sewa lapangan"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs"
              required
            />
          </div>

          {/* 5. Nomor Referensi / Nota (Opsional) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              {isEn ? "Reference / Invoice No. (Optional)" : "No. Referensi / No. Invoice (Opsional)"}
            </Label>
            <Input
              type="text"
              placeholder="Contoh: INV-20261005-01 / REF-009"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="text-xs"
            />
          </div>

          {/* 6. Tanggal Transaksi */}
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
                <span>{isEn ? "Save Income" : "Simpan Pemasukan"}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
