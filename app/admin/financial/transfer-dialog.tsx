"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  ArrowLeftRight,
  ArrowRight,
  Calendar as CalendarIcon,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { formatIDR, cn } from "@/lib/utils";
import {
  FinancialAccount,
  createFinancialTransaction,
} from "@/lib/financial-ledger";
import { toast } from "sonner";

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: FinancialAccount[];
  onSuccess?: () => void;
  isEn?: boolean;
}

export const TransferDialog: React.FC<TransferDialogProps> = ({
  open,
  onOpenChange,
  accounts,
  onSuccess,
  isEn = false,
}) => {
  const activeAccounts = React.useMemo(
    () => accounts.filter((a) => a.is_active),
    [accounts]
  );

  const [fromAccountId, setFromAccountId] = React.useState<string>("");
  const [toAccountId, setToAccountId] = React.useState<string>("");
  const [rawAmount, setRawAmount] = React.useState<string>("");
  const [description, setDescription] = React.useState<string>("");
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [calendarOpen, setCalendarOpen] = React.useState<boolean>(false);

  // Reset form when opened
  React.useEffect(() => {
    if (open) {
      if (activeAccounts.length >= 2) {
        setFromAccountId(activeAccounts[0].id.toString());
        setToAccountId(activeAccounts[1].id.toString());
      } else if (activeAccounts.length === 1) {
        setFromAccountId(activeAccounts[0].id.toString());
        setToAccountId("");
      }
      setRawAmount("");
      setDescription("");
      setSelectedDate(new Date());
      setIsSubmitting(false);
    }
  }, [open, activeAccounts]);

  // Handle Amount Formatting
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setRawAmount(val);
  };

  const parsedAmount = parseInt(rawAmount || "0", 10);

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fromAccountId || !toAccountId) {
      toast.error(
        isEn
          ? "Please select both source and destination accounts"
          : "Pilih rekening asal dan rekening tujuan"
      );
      return;
    }

    if (fromAccountId === toAccountId) {
      toast.error(
        isEn
          ? "Source and destination accounts cannot be the same"
          : "Rekening sumber dan rekening tujuan tidak boleh sama"
      );
      return;
    }

    if (!parsedAmount || parsedAmount <= 0) {
      toast.error(isEn ? "Please enter a valid amount" : "Nominal transfer wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      const fromAcc = activeAccounts.find((a) => a.id.toString() === fromAccountId);
      const toAcc = activeAccounts.find((a) => a.id.toString() === toAccountId);
      const desc = description.trim() || `Transfer dari ${fromAcc?.name || "Kas"} ke ${toAcc?.name || "Rekening"}`;
      const formattedDate = format(selectedDate, "yyyy-MM-dd");

      await createFinancialTransaction({
        type: "transfer",
        account_id: parseInt(fromAccountId, 10),
        to_account_id: parseInt(toAccountId, 10),
        amount: parsedAmount,
        transaction_date: formattedDate,
        description: desc,
      });

      toast.success(
        isEn
          ? `Transfer ${formatIDR(parsedAmount)} completed successfully!`
          : `Transfer ${formatIDR(parsedAmount)} berhasil dicatat!`
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.message || (isEn ? "Failed to record transfer" : "Gagal mencatat transfer"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fromAccObj = activeAccounts.find((a) => a.id.toString() === fromAccountId);
  const toAccObj = activeAccounts.find((a) => a.id.toString() === toAccountId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md max-h-[90dvh] flex flex-col p-0 overflow-hidden border-border shadow-lg">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ArrowLeftRight className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold tracking-tight">
                {isEn ? "Transfer Between Accounts" : "Transfer Antar Kas"}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Account Transfer Flow Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            {/* Dari Rekening */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                {isEn ? "From (Source)" : "Dari Rekening / Kas"} *
              </Label>
              <Select
                value={fromAccountId}
                onValueChange={(val) => { if (val) setFromAccountId(val); }}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder={isEn ? "Select source" : "Pilih kas asal"}>
                    {(val) => {
                      const acc = activeAccounts.find((a) => a.id.toString() === String(val));
                      return acc ? `${acc.name}${acc.account_number ? ` • ${acc.account_number}` : ""}` : (isEn ? "Select source" : "Pilih kas asal");
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

            {/* Ke Rekening */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                {isEn ? "To (Destination)" : "Ke Rekening / Kas"} *
              </Label>
              <Select
                value={toAccountId}
                onValueChange={(val) => { if (val) setToAccountId(val); }}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder={isEn ? "Select destination" : "Pilih kas tujuan"}>
                    {(val) => {
                      const acc = activeAccounts.find((a) => a.id.toString() === String(val));
                      return acc ? `${acc.name}${acc.account_number ? ` • ${acc.account_number}` : ""}` : (isEn ? "Select destination" : "Pilih kas tujuan");
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {activeAccounts.map((acc) => (
                    <SelectItem
                      key={acc.id}
                      value={acc.id.toString()}
                      className="text-xs"
                      disabled={acc.id.toString() === fromAccountId}
                    >
                      {acc.name}
                      {acc.account_number ? ` • ${acc.account_number}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Transfer Visual Route indicator */}
          <div className="rounded-lg bg-muted/40 p-2.5 flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium truncate max-w-[40%] text-foreground">
              {fromAccObj?.name || (isEn ? "Source Account" : "Kas Asal")}
            </span>
            <div className="flex items-center gap-1 text-primary">
              <span className="text-[11px] font-semibold">{formatIDR(parsedAmount || 0)}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
            <span className="font-medium truncate max-w-[40%] text-foreground text-right">
              {toAccObj?.name || (isEn ? "Destination" : "Kas Tujuan")}
            </span>
          </div>

          {/* Nominal Transfer */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              {isEn ? "Transfer Amount (IDR)" : "Nominal Transfer (Rp)"} *
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

          {/* Keterangan */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              {isEn ? "Description (Optional)" : "Keterangan / Catatan (Opsional)"}
            </Label>
            <Input
              type="text"
              placeholder={isEn ? "e.g., Cash deposit to bank" : "Contoh: Setor uang tunai kasir ke rekening operasional"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs"
            />
          </div>

          {/* Tanggal Transaksi */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              {isEn ? "Date" : "Tanggal Transfer"}
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
                <span>{isEn ? "Processing..." : "Memproses..."}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                <span>{isEn ? "Confirm Transfer" : "Konfirmasi Transfer"}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
