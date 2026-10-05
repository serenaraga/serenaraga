"use client";

import * as React from "react";
import { useLocaleState, LinkBase, Translate } from "ra-core";
import { useNavigate } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, BreadcrumbPage } from "@/components/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Building2,
  Banknote,
  Coins,
  QrCode,
  Landmark,
  SlidersHorizontal,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Tag,
  ShieldCheck,
  FolderPlus,
  RefreshCw,
  Check,
  AlertCircle,
} from "lucide-react";
import { formatIDR, cn } from "@/lib/utils";
import {
  FinancialAccount,
  FinancialCategory,
  AccountType,
  CategoryType,
  PaymentMethodMapping,
  fetchFinancialAccounts,
  createFinancialAccount,
  updateFinancialAccount,
  deleteFinancialAccount,
  fetchFinancialCategories,
  createFinancialCategory,
  updateFinancialCategory,
  deleteFinancialCategory,
  fetchPaymentMethodMappings,
  savePaymentMethodMappings,
} from "@/lib/financial-ledger";
import { toast } from "sonner";
import { FinancialSettingsSkeleton } from "@/components/ui/skeleton";

export const FinancialSettingsPage: React.FC = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const navigate = useNavigate();

  // State
  const [accounts, setAccounts] = React.useState<FinancialAccount[]>([]);
  const [categories, setCategories] = React.useState<FinancialCategory[]>([]);
  const [paymentMappings, setPaymentMappings] = React.useState<PaymentMethodMapping>({
    cash_account_id: null,
    qris_account_id: null,
    bank_transfer_account_id: null,
  });
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isSavingMappings, setIsSavingMappings] = React.useState<boolean>(false);

  // Account Modal State
  const [isAccountModalOpen, setIsAccountModalOpen] = React.useState<boolean>(false);
  const [editingAccountId, setEditingAccountId] = React.useState<number | null>(null);
  const [accFormName, setAccFormName] = React.useState<string>("");
  const [accFormType, setAccFormType] = React.useState<AccountType>("bank");
  const [accFormNumber, setAccFormNumber] = React.useState<string>("");
  const [accFormHolder, setAccFormHolder] = React.useState<string>("");
  const [accFormBalance, setAccFormBalance] = React.useState<string>("0");
  const [accFormPayCash, setAccFormPayCash] = React.useState<boolean>(false);
  const [accFormPayQris, setAccFormPayQris] = React.useState<boolean>(false);
  const [accFormPayBank, setAccFormPayBank] = React.useState<boolean>(false);
  const [isSubmittingAccount, setIsSubmittingAccount] = React.useState<boolean>(false);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = React.useState<boolean>(false);
  const [editingCategoryId, setEditingCategoryId] = React.useState<number | null>(null);
  const [catFormName, setCatFormName] = React.useState<string>("");
  const [catFormType, setCatFormType] = React.useState<CategoryType>("expense");
  const [catFormDesc, setCatFormDesc] = React.useState<string>("");
  const [isSubmittingCategory, setIsSubmittingCategory] = React.useState<boolean>(false);

  // Delete Confirmation States
  const [accountToDelete, setAccountToDelete] = React.useState<FinancialAccount | null>(null);
  const [categoryToDelete, setCategoryToDelete] = React.useState<FinancialCategory | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = React.useState<boolean>(false);
  const [isDeletingCategory, setIsDeletingCategory] = React.useState<boolean>(false);

  // Fetch Data from Supabase
  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [accs, cats, mappings] = await Promise.all([
        fetchFinancialAccounts(),
        fetchFinancialCategories(),
        fetchPaymentMethodMappings(),
      ]);
      setAccounts(accs);
      setCategories(cats);
      setPaymentMappings(mappings);
    } catch (err: any) {
      toast.error(err?.message || (isEn ? "Failed to load settings data" : "Gagal memuat data pengaturan"));
    } finally {
      setIsLoading(false);
    }
  }, [isEn]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Save Payment Method Mappings
  const handleSaveMappings = async () => {
    setIsSavingMappings(true);
    try {
      await savePaymentMethodMappings(paymentMappings);
      toast.success(
        isEn
          ? "Payment method routing settings saved successfully!"
          : "Pengaturan pemetaan rekening pembayaran berhasil disimpan!"
      );
    } catch (err: any) {
      toast.error(err?.message || (isEn ? "Failed to save payment mappings" : "Gagal menyimpan pengaturan"));
    } finally {
      setIsSavingMappings(false);
    }
  };

  // Open Account Modal for Create
  const handleOpenCreateAccount = () => {
    setEditingAccountId(null);
    setAccFormName("");
    setAccFormType("bank");
    setAccFormNumber("");
    setAccFormHolder("");
    setAccFormBalance("0");
    setAccFormPayCash(false);
    setAccFormPayQris(false);
    setAccFormPayBank(false);
    setIsAccountModalOpen(true);
  };

  // Open Account Modal for Edit
  const handleOpenEditAccount = (acc: FinancialAccount) => {
    setEditingAccountId(acc.id);
    setAccFormName(acc.name);
    setAccFormType(acc.type);
    setAccFormNumber(acc.account_number || "");
    setAccFormHolder(acc.account_holder || "");
    setAccFormBalance(acc.initial_balance.toString());
    setAccFormPayCash(paymentMappings.cash_account_id === acc.id);
    setAccFormPayQris(paymentMappings.qris_account_id === acc.id);
    setAccFormPayBank(paymentMappings.bank_transfer_account_id === acc.id);
    setIsAccountModalOpen(true);
  };

  // Save Account to Supabase
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accFormName.trim()) {
      toast.error(isEn ? "Account name is required" : "Nama akun wajib diisi");
      return;
    }

    const balanceNum = parseInt(accFormBalance.replace(/\D/g, "") || "0", 10);
    setIsSubmittingAccount(true);

    try {
      let savedAcc: FinancialAccount;
      if (editingAccountId) {
        savedAcc = await updateFinancialAccount(editingAccountId, {
          name: accFormName,
          type: accFormType,
          account_number: accFormNumber,
          account_holder: accFormHolder,
          initial_balance: balanceNum,
        });
        toast.success(isEn ? "Account updated successfully" : "Rekening berhasil diperbarui");
      } else {
        savedAcc = await createFinancialAccount({
          name: accFormName,
          type: accFormType,
          account_number: accFormNumber,
          account_holder: accFormHolder,
          initial_balance: balanceNum,
        });
        toast.success(isEn ? "Account added successfully" : "Rekening baru berhasil ditambahkan");
      }

      // Update payment mappings if checkboxes were modified
      const updatedMappings = { ...paymentMappings };
      if (accFormPayCash) {
        updatedMappings.cash_account_id = savedAcc.id;
      } else if (paymentMappings.cash_account_id === savedAcc.id) {
        updatedMappings.cash_account_id = null;
      }

      if (accFormPayQris) {
        updatedMappings.qris_account_id = savedAcc.id;
      } else if (paymentMappings.qris_account_id === savedAcc.id) {
        updatedMappings.qris_account_id = null;
      }

      if (accFormPayBank) {
        updatedMappings.bank_transfer_account_id = savedAcc.id;
      } else if (paymentMappings.bank_transfer_account_id === savedAcc.id) {
        updatedMappings.bank_transfer_account_id = null;
      }

      setPaymentMappings(updatedMappings);
      await savePaymentMethodMappings(updatedMappings);

      setIsAccountModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || (isEn ? "Failed to save account" : "Gagal menyimpan rekening"));
    } finally {
      setIsSubmittingAccount(false);
    }
  };

  // Confirm Delete Account from Supabase
  const confirmDeleteAccount = async () => {
    if (!accountToDelete) return;
    setIsDeletingAccount(true);

    try {
      await deleteFinancialAccount(accountToDelete.id);
      toast.success(
        isEn
          ? `Account "${accountToDelete.name}" removed successfully`
          : `Rekening "${accountToDelete.name}" berhasil dihapus`
      );
      setAccountToDelete(null);
      await loadData();
    } catch (err: any) {
      toast.error(
        err?.message?.includes("foreign key") || err?.message?.includes("violates")
          ? isEn
            ? "Cannot delete account with existing transactions. Please delete or reassign its transactions first."
            : "Rekening tidak dapat dihapus karena masih memiliki riwayat transaksi di buku kas."
          : err?.message || (isEn ? "Failed to delete account" : "Gagal menghapus rekening")
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Open Category Modal
  const handleOpenCreateCategory = (type: CategoryType) => {
    setEditingCategoryId(null);
    setCatFormType(type);
    setCatFormName("");
    setCatFormDesc("");
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: FinancialCategory) => {
    setEditingCategoryId(cat.id);
    setCatFormType(cat.type);
    setCatFormName(cat.name);
    setCatFormDesc(cat.description || "");
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catFormName.trim()) {
      toast.error(isEn ? "Category name is required" : "Nama kategori wajib diisi");
      return;
    }

    setIsSubmittingCategory(true);
    try {
      if (editingCategoryId) {
        await updateFinancialCategory(editingCategoryId, {
          name: catFormName,
          type: catFormType,
          description: catFormDesc,
        });
        toast.success(isEn ? "Category updated" : "Kategori berhasil diperbarui");
      } else {
        await createFinancialCategory({
          name: catFormName,
          type: catFormType,
          description: catFormDesc,
        });
        toast.success(isEn ? "Category added" : "Kategori baru berhasil ditambahkan");
      }
      setIsCategoryModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || (isEn ? "Failed to save category" : "Gagal menyimpan kategori"));
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  // Confirm Delete Category from Supabase
  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setIsDeletingCategory(true);

    try {
      await deleteFinancialCategory(categoryToDelete.id);
      toast.success(
        isEn
          ? `Category "${categoryToDelete.name}" removed successfully`
          : `Kategori "${categoryToDelete.name}" berhasil dihapus`
      );
      setCategoryToDelete(null);
      await loadData();
    } catch (err: any) {
      toast.error(
        err?.message?.includes("foreign key") || err?.message?.includes("violates")
          ? isEn
            ? "Cannot delete category linked to active transactions."
            : "Kategori tidak dapat dihapus karena masih terhubung dengan transaksi."
          : err?.message || (isEn ? "Failed to delete category" : "Gagal menghapus kategori")
      );
    } finally {
      setIsDeletingCategory(false);
    }
  };

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case "cash":
        return <Coins className="w-4 h-4" />;
      case "bank":
        return <Building2 className="w-4 h-4" />;
      case "e_wallet":
        return <QrCode className="w-4 h-4" />;
    }
  };

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  if (isLoading) {
    return <FinancialSettingsSkeleton isEn={isEn} />;
  }

  return (
    <div className="space-y-4 pb-16">
      {/* 1. Official Breadcrumbs Hierarchy */}
      <Breadcrumb>
        <BreadcrumbItem>
          <LinkBase to="/">
            <Translate i18nKey="ra.page.dashboard">Home</Translate>
          </LinkBase>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <LinkBase to="/financial">
            {isEn ? "Financial" : "Buku Kas"}
          </LinkBase>
        </BreadcrumbItem>
        <BreadcrumbPage>
          {isEn ? "Settings" : "Pengaturan Rekening & Kategori"}
        </BreadcrumbPage>
      </Breadcrumb>

      {/* 2. Header with Back Button */}
      <div className="flex justify-between items-center flex-wrap gap-3 my-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {isEn ? "Cashbook & Account Settings" : "Pengaturan Rekening & Kategori Kas"}
          </h2>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/financial")}
          className="cursor-pointer text-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          <span>{isEn ? "Back to Ledger" : "Kembali ke Buku Kas"}</span>
        </Button>
      </div>

      {/* 3. Section 1: Pengaturan Integrasi & Rekening Tujuan Pembayaran (Booking & Invoice) */}
      <Card className="border border-border shadow-none bg-card">
        <CardHeader className="p-4 sm:p-5 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm sm:text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-foreground" />
                <span>{isEn ? "Automatic Payment Routing (Bookings & Invoices)" : "Pengaturan Rekening Tujuan Pembayaran"}</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                {isEn
                  ? "Choose which cash/bank account will automatically receive incoming money for each payment method from bookings & invoices."
                  : "Tentukan ke rekening kas mana uang masuk akan dicatat secara otomatis untuk setiap metode pembayaran (Cash, QRIS, Transfer Bank) dari booking & invoice."}
              </CardDescription>
            </div>

            <div>
              <Button
                type="button"
                size="sm"
                disabled={isSavingMappings}
                onClick={handleSaveMappings}
                className="text-xs cursor-pointer h-8 shrink-0"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                <span>{isSavingMappings ? (isEn ? "Saving..." : "Menyimpan...") : (isEn ? "Save Mapping" : "Simpan Pengaturan")}</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* CASH / Kas Tunai */}
            <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-muted text-foreground">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{isEn ? "Cash (CASH)" : "Kas Tunai (CASH)"}</p>
                      <p className="text-[11px] text-muted-foreground">{isEn ? "Direct cash / drawer" : "Pembayaran langsung / kasir"}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-normal">CASH</Badge>
                </div>

                <div className="space-y-1.5 pt-1">
                  <Label className="text-[11px] font-medium text-muted-foreground">{isEn ? "Destination Account" : "Rekening Tujuan Uang Masuk"}</Label>
                  <Select
                    value={paymentMappings.cash_account_id ? String(paymentMappings.cash_account_id) : "unassigned"}
                    onValueChange={(val) => setPaymentMappings((prev) => ({ ...prev, cash_account_id: val === "unassigned" ? null : Number(val) }))}
                  >
                    <SelectTrigger className="text-xs h-9 bg-background">
                      <SelectValue placeholder={isEn ? "Select account..." : "Belum diatur (Pilih rekening)..."}>
                        {(val) => {
                          if (!val || val === "unassigned") {
                            return isEn ? "Belum Diatur" : "Belum Diatur";
                          }
                          const acc = accounts.find((a) => String(a.id) === String(val));
                          return acc ? `${acc.name} (${acc.type === "cash" ? "Kas Tunai" : acc.type === "bank" ? "Bank" : "QRIS"})` : (isEn ? "Belum Diatur" : "Belum Diatur");
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned" className="text-xs text-muted-foreground italic">
                        {isEn ? "-- Belum Diatur (Pilih Rekening) --" : "-- Belum Diatur (Pilih Rekening) --"}
                      </SelectItem>
                      {accounts.filter((a) => a.is_active).map((acc) => (
                        <SelectItem key={acc.id} value={String(acc.id)} className="text-xs">
                          {acc.name} ({acc.type === "cash" ? "Kas Tunai" : acc.type === "bank" ? "Bank" : "QRIS"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Status Info */}
              <div className="pt-1">
                {paymentMappings.cash_account_id ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>{isEn ? "Linked to active account" : "Uang masuk dicatat ke rekening ini"}</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{isEn ? "Account not set. Cash income will not be recorded." : "Rekening belum diatur. Pemasukan CASH tidak masuk ke buku kas."}</span>
                  </div>
                )}
              </div>
            </div>

            {/* QRIS / E-Wallet */}
            <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-muted text-foreground">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">QRIS / E-Wallet</p>
                      <p className="text-[11px] text-muted-foreground">{isEn ? "GoPay, OVO, Dana, QRIS" : "GoPay, OVO, Dana, QRIS"}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-normal">QRIS</Badge>
                </div>

                <div className="space-y-1.5 pt-1">
                  <Label className="text-[11px] font-medium text-muted-foreground">{isEn ? "Destination Account" : "Rekening Tujuan Uang Masuk"}</Label>
                  <Select
                    value={paymentMappings.qris_account_id ? String(paymentMappings.qris_account_id) : "unassigned"}
                    onValueChange={(val) => setPaymentMappings((prev) => ({ ...prev, qris_account_id: val === "unassigned" ? null : Number(val) }))}
                  >
                    <SelectTrigger className="text-xs h-9 bg-background">
                      <SelectValue placeholder={isEn ? "Select account..." : "Belum diatur (Pilih rekening)..."}>
                        {(val) => {
                          if (!val || val === "unassigned") {
                            return isEn ? "Belum Diatur" : "Belum Diatur";
                          }
                          const acc = accounts.find((a) => String(a.id) === String(val));
                          return acc ? `${acc.name} (${acc.type === "cash" ? "Kas Tunai" : acc.type === "bank" ? "Bank" : "QRIS"})` : (isEn ? "Belum Diatur" : "Belum Diatur");
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned" className="text-xs text-muted-foreground italic">
                        {isEn ? "-- Belum Diatur (Pilih Rekening) --" : "-- Belum Diatur (Pilih Rekening) --"}
                      </SelectItem>
                      {accounts.filter((a) => a.is_active).map((acc) => (
                        <SelectItem key={acc.id} value={String(acc.id)} className="text-xs">
                          {acc.name} ({acc.type === "cash" ? "Kas Tunai" : acc.type === "bank" ? "Bank" : "QRIS"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Status Info */}
              <div className="pt-1">
                {paymentMappings.qris_account_id ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>{isEn ? "Linked to active account" : "Uang masuk dicatat ke rekening ini"}</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{isEn ? "Account not set. QRIS income will not be recorded." : "Rekening belum diatur. Pemasukan QRIS tidak masuk ke buku kas."}</span>
                  </div>
                )}
              </div>
            </div>

            {/* BANK TRANSFER */}
            <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-muted text-foreground">
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{isEn ? "Bank Transfer" : "Transfer Bank"}</p>
                      <p className="text-[11px] text-muted-foreground">{isEn ? "BCA, Mandiri, Seabank, etc." : "BCA, Mandiri, BRI, Seabank, dll."}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-normal">BANK TRANSFER</Badge>
                </div>

                <div className="space-y-1.5 pt-1">
                  <Label className="text-[11px] font-medium text-muted-foreground">{isEn ? "Destination Account" : "Rekening Tujuan Uang Masuk"}</Label>
                  <Select
                    value={paymentMappings.bank_transfer_account_id ? String(paymentMappings.bank_transfer_account_id) : "unassigned"}
                    onValueChange={(val) => setPaymentMappings((prev) => ({ ...prev, bank_transfer_account_id: val === "unassigned" ? null : Number(val) }))}
                  >
                    <SelectTrigger className="text-xs h-9 bg-background">
                      <SelectValue placeholder={isEn ? "Select account..." : "Belum diatur (Pilih rekening)..."}>
                        {(val) => {
                          if (!val || val === "unassigned") {
                            return isEn ? "Belum Diatur" : "Belum Diatur";
                          }
                          const acc = accounts.find((a) => String(a.id) === String(val));
                          return acc ? `${acc.name} (${acc.type === "cash" ? "Kas Tunai" : acc.type === "bank" ? "Bank" : "QRIS"})` : (isEn ? "Belum Diatur" : "Belum Diatur");
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned" className="text-xs text-muted-foreground italic">
                        {isEn ? "-- Belum Diatur (Pilih Rekening) --" : "-- Belum Diatur (Pilih Rekening) --"}
                      </SelectItem>
                      {accounts.filter((a) => a.is_active).map((acc) => (
                        <SelectItem key={acc.id} value={String(acc.id)} className="text-xs">
                          {acc.name} ({acc.type === "cash" ? "Kas Tunai" : acc.type === "bank" ? "Bank" : "QRIS"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Status Info */}
              <div className="pt-1">
                {paymentMappings.bank_transfer_account_id ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>{isEn ? "Linked to active account" : "Uang masuk dicatat ke rekening ini"}</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{isEn ? "Account not set. Transfer income will not be recorded." : "Rekening belum diatur. Pemasukan Transfer tidak masuk ke buku kas."}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Section 2: Daftar Akun Kas & Rekening Bank */}
      <Card className="border border-border shadow-none bg-card">
        <CardHeader className="p-4 sm:p-5 border-b border-border/60 flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm sm:text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <span>{isEn ? "Cash & Bank Accounts" : "Daftar Akun Kas & Rekening Bank"}</span>
            </CardTitle>
          </div>

          <Button
            type="button"
            onClick={handleOpenCreateAccount}
            className="cursor-pointer text-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            <span>{isEn ? "Add Account" : "Tambah Rekening"}</span>
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 hover:bg-muted/20">
                  <TableHead className="text-xs font-semibold">{isEn ? "Account Name" : "Nama Akun"}</TableHead>
                  <TableHead className="text-xs font-semibold">{isEn ? "Type & Routing" : "Tipe & Integrasi"}</TableHead>
                  <TableHead className="text-xs font-semibold">{isEn ? "Account Details" : "Detail Rekening"}</TableHead>
                  <TableHead className="text-xs font-semibold">{isEn ? "Initial Balance" : "Saldo Awal"}</TableHead>
                  <TableHead className="text-xs font-semibold">{isEn ? "Status" : "Status"}</TableHead>
                  <TableHead className="text-xs font-semibold text-right">{isEn ? "Action" : "Aksi"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((acc) => {
                  const isMappedCash = paymentMappings.cash_account_id === acc.id;
                  const isMappedQris = paymentMappings.qris_account_id === acc.id;
                  const isMappedBank = paymentMappings.bank_transfer_account_id === acc.id;

                  return (
                    <TableRow key={acc.id} className="hover:bg-muted/10">
                      <TableCell className="font-medium text-xs">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-muted text-muted-foreground shrink-0">
                            {getAccountIcon(acc.type)}
                          </div>
                          <div>
                            <span className="font-semibold text-foreground block">{acc.name}</span>
                            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                              {isMappedCash && (
                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-normal text-muted-foreground">
                                  CASH
                                </Badge>
                              )}
                              {isMappedQris && (
                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-normal text-muted-foreground">
                                  QRIS
                                </Badge>
                              )}
                              {isMappedBank && (
                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-normal text-muted-foreground">
                                  BANK TRANSFER
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-[10px] font-normal capitalize">
                          {acc.type === "cash" ? "Kas Tunai" : acc.type === "bank" ? "Rekening Bank" : "QRIS / E-Wallet"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {acc.account_number ? (
                          <div>
                            <span className="text-foreground block">{acc.account_number}</span>
                            {acc.account_holder && <span className="text-[11px] block">a.n. {acc.account_holder}</span>}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/60">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-foreground">
                        {formatIDR(acc.initial_balance)}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge
                          variant="secondary"
                          className={acc.is_active ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : ""}
                        >
                          {acc.is_active ? (isEn ? "Active" : "Aktif") : (isEn ? "Inactive" : "Nonaktif")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditAccount(acc)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setAccountToDelete(acc)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 5. Section 3: Master Kategori Keuangan (Tabs: Pengeluaran & Pemasukan) */}
      <Card className="border border-border shadow-none bg-card">
        <CardHeader className="p-4 sm:p-5 border-b border-border/60">
          <CardTitle className="text-sm sm:text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            <span>{isEn ? "Transaction Categories" : "Master Kategori Buku Kas"}</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          <Tabs defaultValue="expense" className="w-full">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <TabsList className="bg-muted/50 p-1">
                <TabsTrigger value="expense" className="text-xs">
                  {isEn ? "Expense Categories" : "Kategori Pengeluaran"} ({expenseCategories.length})
                </TabsTrigger>
                <TabsTrigger value="income" className="text-xs">
                  {isEn ? "Income Categories" : "Kategori Pemasukan"} ({incomeCategories.length})
                </TabsTrigger>
              </TabsList>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenCreateCategory("expense")}
                className="cursor-pointer text-xs"
              >
                <FolderPlus className="w-3.5 h-3.5 mr-1.5" />
                <span>{isEn ? "Add Category" : "Tambah Kategori"}</span>
              </Button>
            </div>

            {/* Expense Tab Content */}
            <TabsContent value="expense" className="mt-0 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {expenseCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-3 rounded-lg border border-border bg-card/60 hover:bg-muted/20 transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{cat.name}</p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEditCategory(cat)}
                        className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setCategoryToDelete(cat)}
                        className="h-6 w-6 text-muted-foreground hover:text-destructive cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Income Tab Content */}
            <TabsContent value="income" className="mt-0 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {incomeCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-3 rounded-lg border border-border bg-card/60 hover:bg-muted/20 transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{cat.name}</p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEditCategory(cat)}
                        className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setCategoryToDelete(cat)}
                        className="h-6 w-6 text-muted-foreground hover:text-destructive cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 6. Account Create / Edit Dialog */}
      <Dialog open={isAccountModalOpen} onOpenChange={setIsAccountModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[90dvh] flex flex-col p-0 overflow-hidden border-border shadow-lg">
          <DialogHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold tracking-tight">
                  {editingAccountId
                    ? isEn
                      ? "Edit Account"
                      : "Edit Rekening Kas"
                    : isEn
                    ? "Add New Account"
                    : "Tambah Rekening Baru"}
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSaveAccount} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Tipe Akun */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">{isEn ? "Account Type" : "Tipe Akun Kas"} *</Label>
              <Select value={accFormType} onValueChange={(val: any) => { if (val) setAccFormType(val); }}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder={isEn ? "Select account type" : "Pilih tipe rekening"}>
                    {(val) => {
                      if (val === "cash") return isEn ? "Cash Register (Drawer)" : "Kas Tunai Kasir";
                      if (val === "bank") return isEn ? "Bank Account" : "Rekening Bank";
                      if (val === "e_wallet") return isEn ? "QRIS / E-Wallet" : "QRIS / E-Wallet";
                      return isEn ? "Select account type" : "Pilih tipe rekening";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash" className="text-xs">{isEn ? "Cash Register (Drawer)" : "Kas Tunai Kasir"}</SelectItem>
                  <SelectItem value="bank" className="text-xs">{isEn ? "Bank Account" : "Rekening Bank"}</SelectItem>
                  <SelectItem value="e_wallet" className="text-xs">{isEn ? "QRIS / E-Wallet" : "QRIS / E-Wallet"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Nama Akun */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">{isEn ? "Account Name" : "Nama Akun"} *</Label>
              <Input
                type="text"
                placeholder={isEn ? "e.g., BCA Operasional or Kasir Lantai 1" : "Contoh: BCA Operasional atau Kasir Lantai 1"}
                value={accFormName}
                onChange={(e) => setAccFormName(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            {/* Nomor Rekening (jika bank) */}
            {accFormType === "bank" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">{isEn ? "Account Number" : "Nomor Rekening"}</Label>
                  <Input
                    type="text"
                    placeholder="Contoh: 1234567890"
                    value={accFormNumber}
                    onChange={(e) => setAccFormNumber(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">{isEn ? "Account Holder Name" : "Atas Nama Rekening"}</Label>
                  <Input
                    type="text"
                    placeholder="Contoh: PT Serena Raga Sejahtera"
                    value={accFormHolder}
                    onChange={(e) => setAccFormHolder(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </>
            )}

            {/* Saldo Awal */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">{isEn ? "Initial Balance (IDR)" : "Saldo Awal (Rp)"}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                  Rp
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={accFormBalance ? Number(accFormBalance.replace(/\D/g, "")).toLocaleString("id-ID") : "0"}
                  onChange={(e) => setAccFormBalance(e.target.value)}
                  className="pl-9 text-xs font-semibold"
                />
              </div>
            </div>

            {/* Hubungkan Metode Pembayaran (Booking & Invoice) */}
            <div className="pt-2 border-t border-border space-y-2">
              <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-foreground" />
                <span>{isEn ? "Route Payment Methods to this Account:" : "Hubungkan Sebagai Rekening Pembayaran Masuk:"}</span>
              </Label>
              <p className="text-[11px] text-muted-foreground">
                {isEn
                  ? "Uang masuk dari metode yang dipilih akan otomatis dicatat ke rekening ini."
                  : "Uang masuk dari metode pembayaran yang dipilih akan otomatis masuk ke rekening ini saat booking / invoice dibayar."}
              </p>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAccFormPayCash(!accFormPayCash)}
                  className={cn(
                    "flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer",
                    accFormPayCash
                      ? "border-foreground/40 bg-muted text-foreground font-semibold"
                      : "border-border bg-background hover:bg-muted/40 text-muted-foreground"
                  )}
                >
                  <Banknote className="w-4 h-4 mb-1 text-foreground" />
                  <span>CASH</span>
                  <span className="text-[10px] text-muted-foreground">{accFormPayCash ? "✓ Aktif" : "Nonaktif"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAccFormPayQris(!accFormPayQris)}
                  className={cn(
                    "flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer",
                    accFormPayQris
                      ? "border-foreground/40 bg-muted text-foreground font-semibold"
                      : "border-border bg-background hover:bg-muted/40 text-muted-foreground"
                  )}
                >
                  <QrCode className="w-4 h-4 mb-1 text-foreground" />
                  <span>QRIS</span>
                  <span className="text-[10px] text-muted-foreground">{accFormPayQris ? "✓ Aktif" : "Nonaktif"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAccFormPayBank(!accFormPayBank)}
                  className={cn(
                    "flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer",
                    accFormPayBank
                      ? "border-foreground/40 bg-muted text-foreground font-semibold"
                      : "border-border bg-background hover:bg-muted/40 text-muted-foreground"
                  )}
                >
                  <Landmark className="w-4 h-4 mb-1 text-foreground" />
                  <span>TRANSFER</span>
                  <span className="text-[10px] text-muted-foreground">{accFormPayBank ? "✓ Aktif" : "Nonaktif"}</span>
                </button>
              </div>
            </div>
          </form>

          <DialogFooter className="p-4 sm:p-5 border-t border-border bg-muted/10 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAccountModalOpen(false)}
              className="cursor-pointer"
            >
              {isEn ? "Cancel" : "Batal"}
            </Button>
            <Button
              type="button"
              onClick={handleSaveAccount}
              className="cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              <span>{isEn ? "Save Account" : "Simpan Rekening"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. Category Create / Edit Dialog */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[90dvh] flex flex-col p-0 overflow-hidden border-border shadow-lg">
          <DialogHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Tag className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold tracking-tight">
                  {editingCategoryId
                    ? isEn
                      ? "Edit Category"
                      : "Edit Kategori"
                    : isEn
                    ? "Add New Category"
                    : "Tambah Kategori Baru"}
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSaveCategory} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Tipe Kategori */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">{isEn ? "Category Type" : "Tipe Kategori"} *</Label>
              <Select value={catFormType} onValueChange={(val: any) => { if (val) setCatFormType(val); }}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder={isEn ? "Select category type" : "Pilih jenis kategori"}>
                    {(val) => {
                      if (val === "expense") return isEn ? "Expense (Outflow)" : "Pengeluaran (Kas Keluar)";
                      if (val === "income") return isEn ? "Income (Inflow)" : "Pemasukan (Kas Masuk)";
                      return isEn ? "Select category type" : "Pilih jenis kategori";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense" className="text-xs">{isEn ? "Expense (Outflow)" : "Pengeluaran (Kas Keluar)"}</SelectItem>
                  <SelectItem value="income" className="text-xs">{isEn ? "Income (Inflow)" : "Pemasukan (Kas Masuk)"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Nama Kategori */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">{isEn ? "Category Name" : "Nama Kategori"} *</Label>
              <Input
                type="text"
                placeholder={isEn ? "e.g., Spa oils & supplies" : "Contoh: Bahan Spa & Scrub"}
                value={catFormName}
                onChange={(e) => setCatFormName(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            {/* Deskripsi */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">{isEn ? "Description (Optional)" : "Keterangan (Opsional)"}</Label>
              <Input
                type="text"
                placeholder={isEn ? "Brief description" : "Catatan peruntukan kategori"}
                value={catFormDesc}
                onChange={(e) => setCatFormDesc(e.target.value)}
                className="text-xs"
              />
            </div>
          </form>

          <DialogFooter className="p-4 sm:p-5 border-t border-border bg-muted/10 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCategoryModalOpen(false)}
              className="cursor-pointer"
            >
              {isEn ? "Cancel" : "Batal"}
            </Button>
            <Button
              type="button"
              onClick={handleSaveCategory}
              className="cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              <span>{isEn ? "Save Category" : "Simpan Kategori"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 7. Delete Account Confirmation Modal */}
      <AlertDialog
        open={!!accountToDelete}
        onOpenChange={(open) => {
          if (!open) setAccountToDelete(null);
        }}
      >
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isEn ? "Delete Account" : "Hapus Rekening / Kas"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isEn ? (
                <>
                  Are you sure you want to delete account{" "}
                  <span className="font-semibold text-foreground">
                    {accountToDelete?.name}
                  </span>
                  ? This account will be removed from your cashbook.
                </>
              ) : (
                <>
                  Apakah Anda yakin ingin menghapus rekening/kas{" "}
                  <span className="font-semibold text-foreground">
                    {accountToDelete?.name}
                  </span>
                  ? Rekening ini akan dihapus dari daftar akun buku kas.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAccountToDelete(null)}
              className="h-8 text-xs font-medium cursor-pointer"
            >
              {isEn ? "Cancel" : "Batal"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeletingAccount}
              onClick={confirmDeleteAccount}
              className="h-8 text-xs font-medium cursor-pointer"
            >
              {isDeletingAccount
                ? isEn
                  ? "Deleting..."
                  : "Menghapus..."
                : isEn
                ? "Yes, Delete"
                : "Ya, Hapus Rekening"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 8. Delete Category Confirmation Modal */}
      <AlertDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => {
          if (!open) setCategoryToDelete(null);
        }}
      >
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isEn ? "Delete Category" : "Hapus Kategori Buku Kas"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isEn ? (
                <>
                  Are you sure you want to delete category{" "}
                  <span className="font-semibold text-foreground">
                    {categoryToDelete?.name}
                  </span>
                  ?
                </>
              ) : (
                <>
                  Apakah Anda yakin ingin menghapus kategori{" "}
                  <span className="font-semibold text-foreground">
                    {categoryToDelete?.name}
                  </span>
                  ?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCategoryToDelete(null)}
              className="h-8 text-xs font-medium cursor-pointer"
            >
              {isEn ? "Cancel" : "Batal"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeletingCategory}
              onClick={confirmDeleteCategory}
              className="h-8 text-xs font-medium cursor-pointer"
            >
              {isDeletingCategory
                ? isEn
                  ? "Deleting..."
                  : "Menghapus..."
                : isEn
                ? "Yes, Delete"
                : "Ya, Hapus Kategori"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
