"use client";

import * as React from "react";
import { useLocaleState, LinkBase, Translate } from "ra-core";
import { useNavigate } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, BreadcrumbPage } from "@/components/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeftIcon,
  ChevronRightIcon,
  Search,
  Download,
  Building2,
  Coins,
  QrCode,
  Settings as SettingsIcon,
  ImageIcon,
  ExternalLink,
  MoreHorizontal,
  Trash2,
  Receipt,
  CheckCircle2,
} from "lucide-react";
import { formatIDR, cn } from "@/lib/utils";
import { format, isToday, subDays, startOfMonth, isAfter } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  FinancialAccount,
  FinancialCategory,
  FinancialTransaction,
  fetchFinancialAccounts,
  fetchFinancialCategories,
  fetchFinancialTransactions,
  deleteFinancialTransaction,
} from "@/lib/financial-ledger";
import { ExpenseDialog } from "./expense-dialog";
import { IncomeDialog } from "./income-dialog";
import { TransferDialog } from "./transfer-dialog";
import { toast } from "sonner";
import { FinancialLedgerSkeleton } from "@/components/ui/skeleton";

export const FinancialLedgerPage: React.FC = () => {
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const navigate = useNavigate();

  // Data States
  const [accounts, setAccounts] = React.useState<FinancialAccount[]>([]);
  const [categories, setCategories] = React.useState<FinancialCategory[]>([]);
  const [transactions, setTransactions] = React.useState<FinancialTransaction[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  // Dialog states
  const [isExpenseOpen, setIsExpenseOpen] = React.useState<boolean>(false);
  const [isIncomeOpen, setIsIncomeOpen] = React.useState<boolean>(false);
  const [isTransferOpen, setIsTransferOpen] = React.useState<boolean>(false);

  // Receipt preview modal
  const [previewReceiptUrl, setPreviewReceiptUrl] = React.useState<string | null>(null);

  // Delete transaction state
  const [transactionToDelete, setTransactionToDelete] = React.useState<FinancialTransaction | null>(null);
  const [isDeleting, setIsDeleting] = React.useState<boolean>(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [selectedType, setSelectedType] = React.useState<string>("all");
  const [selectedTime, setSelectedTime] = React.useState<string>("this_month");
  const [selectedAccountId, setSelectedAccountId] = React.useState<string>("all");

  // Selection state
  const [selectedIds, setSelectedIds] = React.useState<number[]>([]);

  // Sorting state
  const [sortField, setSortField] = React.useState<string>("transaction_date");
  const [sortOrder, setSortOrder] = React.useState<"ASC" | "DESC">("DESC");

  // Pagination state (Standard 5, 10, 25, 50 rows per page matching Invoices)
  const [page, setPage] = React.useState<number>(1);
  const [perPage, setPerPage] = React.useState<number>(10);

  // Reset page when filter changes
  React.useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [searchQuery, selectedType, selectedTime, selectedAccountId]);

  // Load all financial data from Supabase
  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [accs, cats, txs] = await Promise.all([
        fetchFinancialAccounts(),
        fetchFinancialCategories(),
        fetchFinancialTransactions(),
      ]);
      setAccounts(accs);
      setCategories(cats);
      setTransactions(txs);
    } catch (err: any) {
      toast.error(err?.message || (isEn ? "Failed to load ledger data" : "Gagal memuat data buku kas"));
    } finally {
      setIsLoading(false);
    }
  }, [isEn]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate Realtime Balances per Account
  const accountBalances = React.useMemo(() => {
    const balancesMap: Record<number, number> = {};

    accounts.forEach((acc) => {
      balancesMap[acc.id] = Number(acc.initial_balance || 0);
    });

    transactions.forEach((tx) => {
      const amt = Number(tx.amount || 0);
      if (tx.type === "income" && balancesMap[tx.account_id] !== undefined) {
        balancesMap[tx.account_id] += amt;
      } else if (tx.type === "expense" && balancesMap[tx.account_id] !== undefined) {
        balancesMap[tx.account_id] -= amt;
      } else if (tx.type === "transfer") {
        if (balancesMap[tx.account_id] !== undefined) {
          balancesMap[tx.account_id] -= amt;
        }
        if (tx.to_account_id && balancesMap[tx.to_account_id] !== undefined) {
          balancesMap[tx.to_account_id] += amt;
        }
      }
    });

    return balancesMap;
  }, [accounts, transactions]);

  // Calculate Total Combined Balance
  const totalCombinedBalance = React.useMemo(() => {
    return Object.values(accountBalances).reduce((acc, curr) => acc + curr, 0);
  }, [accountBalances]);

  // Filter & Sort Transactions
  const filteredAndSortedTransactions = React.useMemo(() => {
    const filtered = transactions.filter((tx) => {
      // 1. Type filter
      if (selectedType !== "all" && tx.type !== selectedType) {
        return false;
      }

      // 2. Account filter
      if (selectedAccountId !== "all") {
        const accId = Number(selectedAccountId);
        if (tx.account_id !== accId && tx.to_account_id !== accId) {
          return false;
        }
      }

      // 3. Time filter
      if (selectedTime !== "all") {
        const txDate = new Date(tx.transaction_date);
        const now = new Date();

        if (selectedTime === "today") {
          if (!isToday(txDate)) return false;
        } else if (selectedTime === "7_days") {
          const sevenDaysAgo = subDays(now, 7);
          if (!isAfter(txDate, sevenDaysAgo)) return false;
        } else if (selectedTime === "this_month") {
          const firstDayOfMonth = startOfMonth(now);
          if (!isAfter(txDate, subDays(firstDayOfMonth, 1))) return false;
        }
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchNum = tx.transaction_number.toLowerCase().includes(query);
        const matchDesc = (tx.description || "").toLowerCase().includes(query);
        const matchRef = tx.reference_number ? tx.reference_number.toLowerCase().includes(query) : false;
        const matchCat = tx.category_name_snapshot
          ? tx.category_name_snapshot.toLowerCase().includes(query)
          : tx.category?.name
          ? tx.category.name.toLowerCase().includes(query)
          : false;
        const matchAcc = tx.account?.name ? tx.account.name.toLowerCase().includes(query) : false;
        const matchToAcc = tx.to_account?.name ? tx.to_account.name.toLowerCase().includes(query) : false;

        if (!matchNum && !matchDesc && !matchRef && !matchCat && !matchAcc && !matchToAcc) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    return filtered.sort((a, b) => {
      let aVal: any = a[sortField as keyof FinancialTransaction];
      let bVal: any = b[sortField as keyof FinancialTransaction];

      if (sortField === "amount") {
        aVal = Number(a.amount || 0);
        bVal = Number(b.amount || 0);
      } else if (sortField === "transaction_date") {
        aVal = new Date(a.transaction_date).getTime();
        bVal = new Date(b.transaction_date).getTime();
      } else {
        aVal = (aVal || "").toString().toLowerCase();
        bVal = (bVal || "").toString().toLowerCase();
      }

      if (aVal < bVal) return sortOrder === "ASC" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "ASC" ? 1 : -1;
      return 0;
    });
  }, [transactions, selectedType, selectedTime, selectedAccountId, searchQuery, sortField, sortOrder]);

  // Pagination calculation
  const total = filteredAndSortedTransactions.length;
  const count = Math.max(1, Math.ceil(total / perPage));
  const pageStart = total === 0 ? 0 : (page - 1) * perPage + 1;
  const pageEnd = Math.min(page * perPage, total);
  const hasPreviousPage = page > 1;
  const hasNextPage = page < count;

  const paginatedTransactions = React.useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredAndSortedTransactions.slice(start, start + perPage);
  }, [filteredAndSortedTransactions, page, perPage]);

  // Selection handlers
  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedTransactions.map((tx) => tx.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Sort handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortField(field);
      setSortOrder("DESC");
    }
  };

  // Delete transaction handler
  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    setIsDeleting(true);
    try {
      await deleteFinancialTransaction(transactionToDelete.id);
      toast.success(
        isEn
          ? `Transaction #${transactionToDelete.transaction_number} deleted successfully`
          : `Transaksi #${transactionToDelete.transaction_number} berhasil dihapus`
      );
      setTransactionToDelete(null);
      loadData();
    } catch (err: any) {
      toast.error(err?.message || (isEn ? "Failed to delete transaction" : "Gagal menghapus transaksi"));
    } finally {
      setIsDeleting(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredAndSortedTransactions.length === 0) {
      toast.info(isEn ? "No transactions to export" : "Tidak ada transaksi untuk diekspor");
      return;
    }

    const headers = [
      "No Transaksi",
      "Tanggal",
      "Tipe",
      "Akun Asal",
      "Akun Tujuan",
      "Kategori",
      "Keterangan",
      "Nominal (Rp)",
      "No Referensi",
    ];
    const rows = filteredAndSortedTransactions.map((tx) => [
      tx.transaction_number,
      tx.transaction_date,
      tx.type.toUpperCase(),
      tx.account?.name || "-",
      tx.to_account?.name || "-",
      tx.category_name_snapshot || tx.category?.name || "-",
      `"${(tx.description || "").replace(/"/g, '""')}"`,
      tx.amount,
      tx.reference_number || "-",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Buku_Kas_Serena_Raga_${format(new Date(), "yyyyMMdd_HHmm")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(isEn ? "Transactions exported to CSV" : "Laporan buku kas berhasil diekspor");
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case "cash":
        return <Coins className="w-3.5 h-3.5" />;
      case "bank":
        return <Building2 className="w-3.5 h-3.5" />;
      case "e_wallet":
        return <QrCode className="w-3.5 h-3.5" />;
      default:
        return <Wallet className="w-3.5 h-3.5" />;
    }
  };

  // Pagination page generation matching ListPagination
  const boundaryCount = 1;
  const siblingCount = 1;
  const range = (start: number, end: number) => {
    const length = end - start + 1;
    return Array.from({ length }, (_, i) => start + i);
  };
  const startPages = range(1, Math.min(boundaryCount, count));
  const endPages = range(Math.max(count - boundaryCount + 1, boundaryCount + 1), count);
  const siblingsStart = Math.max(
    Math.min(page - siblingCount, count - boundaryCount - siblingCount * 2 - 1),
    boundaryCount + 2
  );
  const siblingsEnd = Math.min(
    Math.max(page + siblingCount, boundaryCount + siblingCount * 2 + 2),
    count - boundaryCount - 1
  );
  const siblingPages = range(siblingsStart, siblingsEnd);

  if (isLoading) {
    return <FinancialLedgerSkeleton isEn={isEn} />;
  }

  const isAllSelected =
    paginatedTransactions.length > 0 &&
    paginatedTransactions.every((tx) => selectedIds.includes(tx.id));

  return (
    <div className="space-y-4 pb-16">
      {/* 1. Portal Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbItem>
          <LinkBase to="/">
            <Translate i18nKey="ra.page.dashboard">Home</Translate>
          </LinkBase>
        </BreadcrumbItem>
        <BreadcrumbPage>
          {isEn ? "Financial" : "Buku Kas"}
        </BreadcrumbPage>
      </Breadcrumb>

      {/* 2. Standard Admin Page Header */}
      <div className="flex justify-between items-center flex-wrap gap-3 my-1">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {isEn ? "Financial Ledger" : "Buku Kas"}
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsTransferOpen(true)}
            className="cursor-pointer h-8 text-xs font-medium"
          >
            <ArrowLeftRight className="h-3.5 w-3.5 mr-1" />
            <span>{isEn ? "Transfer" : "Transfer Kas"}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsIncomeOpen(true)}
            className="cursor-pointer h-8 text-xs font-medium"
          >
            <TrendingUp className="h-3.5 w-3.5 mr-1" />
            <span>{isEn ? "Income" : "Pemasukan"}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsExpenseOpen(true)}
            className="cursor-pointer h-8 text-xs font-medium"
          >
            <TrendingDown className="h-3.5 w-3.5 mr-1" />
            <span>{isEn ? "Expense" : "Pengeluaran"}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate("/financial/settings")}
            className="cursor-pointer h-8 text-xs font-medium"
          >
            <SettingsIcon className="h-3.5 w-3.5 mr-1" />
            <span>{isEn ? "Settings" : "Pengaturan"}</span>
          </Button>
        </div>
      </div>

      {/* 3. Account Balance Cards Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
        {/* Total Combined Balance */}
        <Card className="border border-border/70 shadow-none bg-card hover:border-border transition-colors">
          <CardContent className="p-2 sm:p-2.5 flex items-center justify-between gap-1.5">
            <div className="min-w-0">
              <span className="text-[10px] text-muted-foreground block font-medium truncate leading-tight">
                {isEn ? "Total All Accounts" : "Total Semua Saldo"}
              </span>
              <span className="text-xs sm:text-sm font-bold text-foreground tracking-tight truncate block mt-0.5 leading-none">
                {formatIDR(totalCombinedBalance)}
              </span>
            </div>
            <div className="h-6 w-6 rounded-md bg-muted text-muted-foreground flex items-center justify-center shrink-0">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Accounts from Supabase */}
        {accounts
          .filter((a) => a.is_active)
          .map((acc) => {
            const currentBal =
              accountBalances[acc.id] !== undefined
                ? accountBalances[acc.id]
                : Number(acc.initial_balance || 0);
            return (
              <Card
                key={acc.id}
                className="border border-border/70 shadow-none bg-card hover:border-border transition-colors"
              >
                <CardContent className="p-2 sm:p-2.5 flex items-center justify-between gap-1.5">
                  <div className="min-w-0">
                    <span className="text-[10px] text-muted-foreground block font-medium truncate uppercase tracking-tight leading-tight">
                      {acc.name}
                    </span>
                    <span
                      className={cn(
                        "text-xs sm:text-sm font-bold tracking-tight truncate block mt-0.5 leading-none",
                        currentBal < 0
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-foreground"
                      )}
                    >
                      {formatIDR(currentBal)}
                    </span>
                  </div>
                  <div className="h-6 w-6 rounded-md bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                    {getAccountIcon(acc.type)}
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* 4. Filter and Search Bar (Flat, matching standard admin list pages) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={
              isEn
                ? "Search entries(transaction #, description, category)..."
                : "Cari transaksi (no. transaksi, deskripsi, kategori)..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-background"
          />
        </div>

        {/* Filter dropdowns & Export button */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Account Filter */}
          <Select
            value={selectedAccountId}
            onValueChange={(val) => setSelectedAccountId(val || "all")}
          >
            <SelectTrigger className="h-8 text-xs w-full sm:w-32 bg-background">
              <SelectValue placeholder={isEn ? "All Accounts" : "Semua Akun"}>
                {(val) => {
                  if (val === "all") return isEn ? "All Accounts" : "Semua Akun";
                  const found = accounts.find((a) => a.id.toString() === val);
                  return found ? found.name : isEn ? "All Accounts" : "Semua Akun";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                {isEn ? "All Accounts" : "Semua Akun"}
              </SelectItem>
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id.toString()} className="text-xs">
                  {acc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Type Filter */}
          <Select
            value={selectedType}
            onValueChange={(val) => setSelectedType(val || "all")}
          >
            <SelectTrigger className="h-8 text-xs w-full sm:w-32 bg-background">
              <SelectValue placeholder={isEn ? "All Types" : "Semua Tipe"}>
                {(val) => {
                  if (val === "income") return isEn ? "Income" : "Pemasukan";
                  if (val === "expense") return isEn ? "Expense" : "Pengeluaran";
                  if (val === "transfer") return isEn ? "Transfer" : "Transfer Kas";
                  return isEn ? "All Types" : "Semua Tipe";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                {isEn ? "All Types" : "Semua Tipe"}
              </SelectItem>
              <SelectItem value="income" className="text-xs">
                {isEn ? "Income" : "Pemasukan"}
              </SelectItem>
              <SelectItem value="expense" className="text-xs">
                {isEn ? "Expense" : "Pengeluaran"}
              </SelectItem>
              <SelectItem value="transfer" className="text-xs">
                {isEn ? "Transfer" : "Transfer Kas"}
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range Filter */}
          <Select
            value={selectedTime}
            onValueChange={(val) => setSelectedTime(val || "this_month")}
          >
            <SelectTrigger className="h-8 text-xs w-full sm:w-32 bg-background">
              <SelectValue placeholder={isEn ? "This Month" : "Bulan Ini"}>
                {(val) => {
                  if (val === "today") return isEn ? "Today" : "Hari Ini";
                  if (val === "7_days") return isEn ? "Last 7 Days" : "7 Hari Terakhir";
                  if (val === "all") return isEn ? "All Time" : "Semua Waktu";
                  return isEn ? "This Month" : "Bulan Ini";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month" className="text-xs">
                {isEn ? "This Month" : "Bulan Ini"}
              </SelectItem>
              <SelectItem value="today" className="text-xs">
                {isEn ? "Today" : "Hari Ini"}
              </SelectItem>
              <SelectItem value="7_days" className="text-xs">
                {isEn ? "Last 7 Days" : "7 Hari Terakhir"}
              </SelectItem>
              <SelectItem value="all" className="text-xs">
                {isEn ? "All Time" : "Semua Waktu"}
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Export CSV Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="cursor-pointer h-8 text-xs font-medium"
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            <span>{isEn ? "Export" : "Ekspor"}</span>
          </Button>
        </div>
      </div>

      {/* 5. Seamless Full-Width Data Table (Exact standard matching Invoices page) */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-none">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {/* Checkbox Column */}
              <TableHead className="w-8 px-3">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleToggleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>

              {/* Transaction Number */}
              <TableHead className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                <button
                  type="button"
                  className="flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors"
                  onClick={() => handleSort("transaction_number")}
                >
                  <span>{isEn ? "Transaction #" : "No. Transaksi"}</span>
                  <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                </button>
              </TableHead>

              {/* Date */}
              <TableHead className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                <button
                  type="button"
                  className="flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors"
                  onClick={() => handleSort("transaction_date")}
                >
                  <span>{isEn ? "Date" : "Tanggal"}</span>
                  <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                </button>
              </TableHead>

              {/* Type */}
              <TableHead className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                <button
                  type="button"
                  className="flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors"
                  onClick={() => handleSort("type")}
                >
                  <span>{isEn ? "Type" : "Tipe"}</span>
                  <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                </button>
              </TableHead>

              {/* Account / Flow */}
              <TableHead className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                {isEn ? "Account / Flow" : "Akun / Mutasi"}
              </TableHead>

              {/* Category */}
              <TableHead className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                {isEn ? "Category" : "Kategori"}
              </TableHead>

              {/* Description */}
              <TableHead className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                {isEn ? "Description" : "Keterangan"}
              </TableHead>

              {/* Amount */}
              <TableHead className="text-xs font-medium text-muted-foreground text-right whitespace-nowrap">
                <button
                  type="button"
                  className="flex items-center justify-end gap-1.5 ml-auto hover:text-foreground cursor-pointer transition-colors"
                  onClick={() => handleSort("amount")}
                >
                  <span>{isEn ? "Total Amount" : "Nominal"}</span>
                  <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                </button>
              </TableHead>

              {/* Receipt */}
              <TableHead className="text-xs font-medium text-muted-foreground text-center whitespace-nowrap">
                {isEn ? "Receipt" : "Nota"}
              </TableHead>

              {/* Actions */}
              <TableHead className="text-xs font-medium text-muted-foreground text-right whitespace-nowrap w-16">
                {isEn ? "Actions" : "Aksi"}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedTransactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="h-44 text-center p-6 text-xs text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="h-10 w-10 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground/60 mb-2">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <p className="font-semibold text-foreground text-sm">
                      {isEn ? "No journal entries recorded yet" : "Belum ada catatan mutasi transaksi"}
                    </p>
                    <p className="text-xs text-muted-foreground max-w-sm mt-0.5">
                      {isEn
                        ? "Click 'Expense' or 'Income' to record operational cashflow."
                        : "Klik 'Pengeluaran' atau 'Pemasukan' untuk mencatat arus kas operasional."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedTransactions.map((tx) => {
                const isIncome = tx.type === "income";
                const isExpense = tx.type === "expense";
                const isTransfer = tx.type === "transfer";
                const isSelected = selectedIds.includes(tx.id);

                return (
                  <TableRow
                    key={tx.id}
                    data-state={isSelected && "selected"}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    {/* Row Checkbox */}
                    <TableCell className="w-8 px-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleSelectRow(tx.id)}
                        aria-label={`Select ${tx.transaction_number}`}
                      />
                    </TableCell>

                    {/* Transaction # */}
                    <TableCell className="text-xs font-semibold text-foreground font-mono whitespace-nowrap">
                      {tx.transaction_number}
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {tx.transaction_date
                        ? format(new Date(tx.transaction_date), "yyyy-MM-dd")
                        : "-"}
                    </TableCell>

                    {/* Type Badge */}
                    <TableCell className="text-xs whitespace-nowrap">
                      {isIncome && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{isEn ? "Income" : "Pemasukan"}</span>
                        </span>
                      )}
                      {isExpense && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                          <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                          <span>{isEn ? "Expense" : "Pengeluaran"}</span>
                        </span>
                      )}
                      {isTransfer && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                          <ArrowLeftRight className="w-3.5 h-3.5 text-blue-500" />
                          <span>{isEn ? "Transfer" : "Transfer Kas"}</span>
                        </span>
                      )}
                    </TableCell>

                    {/* Account / Flow */}
                    <TableCell className="text-xs whitespace-nowrap">
                      {isTransfer ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-medium text-foreground">
                            {tx.account?.name || "Kas Asal"}
                          </span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="font-medium text-foreground">
                            {tx.to_account?.name || "Kas Tujuan"}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-muted-foreground">
                            {getAccountIcon(tx.account?.type || "cash")}
                          </span>
                          <span className="font-medium text-foreground">
                            {tx.account?.name || "-"}
                          </span>
                        </div>
                      )}
                    </TableCell>

                    {/* Category */}
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {tx.category_name_snapshot || tx.category?.name || "—"}
                    </TableCell>

                    {/* Description */}
                    <TableCell className="text-xs text-foreground max-w-xs truncate">
                      <span>{tx.description || "—"}</span>
                      {tx.reference_number && (
                        <span className="text-[10px] text-muted-foreground block truncate">
                          Ref: {tx.reference_number}
                        </span>
                      )}
                    </TableCell>

                    {/* Amount */}
                    <TableCell className="text-xs font-semibold text-right whitespace-nowrap">
                      <span
                        className={
                          isIncome
                            ? "text-emerald-600 dark:text-emerald-400"
                            : isExpense
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-foreground"
                        }
                      >
                        {isIncome
                          ? `+ ${formatIDR(tx.amount)}`
                          : isExpense
                          ? `- ${formatIDR(tx.amount)}`
                          : formatIDR(tx.amount)}
                      </span>
                    </TableCell>

                    {/* Receipt */}
                    <TableCell className="text-xs text-center whitespace-nowrap">
                      {tx.receipt_url ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setPreviewReceiptUrl(tx.receipt_url)}
                          className="h-7 w-7 text-primary hover:text-primary/80 cursor-pointer"
                          title={isEn ? "View Receipt" : "Lihat Nota"}
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </TableCell>

                    {/* Actions Menu */}
                    <TableCell className="text-xs text-right whitespace-nowrap">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md cursor-pointer"
                            />
                          }
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 z-50">
                          {tx.receipt_url && (
                            <DropdownMenuItem
                              onClick={() => setPreviewReceiptUrl(tx.receipt_url)}
                              className="cursor-pointer gap-2 text-xs"
                            >
                              <ImageIcon className="h-3.5 w-3.5 text-primary" />
                              <span>{isEn ? "View Receipt" : "Lihat Nota"}</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              toast.info(
                                `${tx.transaction_number} - ${tx.description} (${formatIDR(tx.amount)})`
                              );
                            }}
                            className="cursor-pointer gap-2 text-xs"
                          >
                            <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{isEn ? "Quick Details" : "Detail Singkat"}</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setTransactionToDelete(tx)}
                            className="cursor-pointer gap-2 text-xs text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>{isEn ? "Delete Entry" : "Hapus Transaksi"}</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* 6. Standard List Pagination (Exact visual match with Invoices page) */}
      <div className="flex items-center justify-end space-x-2 gap-3 text-xs pt-1">
        {/* Rows per page selector */}
        <div className="hidden md:flex items-center space-x-1.5">
          <p className="text-xs text-muted-foreground font-normal whitespace-nowrap">
            {isEn ? "Rows per page:" : "Baris per halaman:"}
          </p>
          <Select
            value={perPage.toString()}
            onValueChange={(value) => {
              if (value) {
                setPerPage(Number(value));
                setPage(1);
              }
            }}
          >
            <SelectTrigger
              size="sm"
              className="h-7 w-[4.5rem] gap-1 px-2.5 rounded-md text-xs border-border bg-background shadow-none"
            >
              <SelectValue placeholder={perPage} />
            </SelectTrigger>
            <SelectContent side="top" className="min-w-[4.5rem] p-1">
              <SelectGroup>
                {[5, 10, 25, 50, 100].map((pageSize) => (
                  <SelectItem
                    key={pageSize}
                    value={`${pageSize}`}
                    className="text-xs py-1 pl-2.5 pr-7"
                  >
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Range Info */}
        <div className="text-xs text-muted-foreground font-normal whitespace-nowrap">
          {isEn
            ? `${total === 0 ? 0 : pageStart}–${pageEnd} of ${total}`
            : `${total === 0 ? 0 : pageStart}–${pageEnd} dari ${total}`}
        </div>

        {/* Numbered Pagination */}
        <Pagination className="w-auto mx-0">
          <PaginationContent className="gap-0.5">
            {/* Prev Button */}
            <PaginationItem>
              {hasPreviousPage ? (
                <PaginationLink
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.max(1, p - 1));
                  }}
                  className="h-7 w-7 p-0 flex items-center justify-center rounded-md cursor-pointer"
                  aria-label="Previous page"
                >
                  <ChevronLeftIcon className="w-3.5 h-3.5" />
                </PaginationLink>
              ) : (
                <span className="inline-flex items-center justify-center size-7 text-muted-foreground/40 select-none">
                  <ChevronLeftIcon className="w-3.5 h-3.5" />
                </span>
              )}
            </PaginationItem>

            {/* Start Pages */}
            {startPages.map((pageNumber) => (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(pageNumber);
                  }}
                  isActive={pageNumber === page}
                  className="h-7 min-w-7 px-1.5 text-xs rounded-md cursor-pointer"
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            ))}

            {/* Ellipsis before siblings */}
            {siblingsStart > boundaryCount + 2 ? (
              <PaginationItem>
                <PaginationEllipsis className="size-7 [&_svg]:size-3" />
              </PaginationItem>
            ) : boundaryCount + 1 < count - boundaryCount ? (
              <PaginationItem>
                <PaginationLink
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(boundaryCount + 1);
                  }}
                  isActive={boundaryCount + 1 === page}
                  className="h-7 min-w-7 px-1.5 text-xs rounded-md cursor-pointer"
                >
                  {boundaryCount + 1}
                </PaginationLink>
              </PaginationItem>
            ) : null}

            {/* Sibling Pages */}
            {siblingPages.map((pageNumber) => (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(pageNumber);
                  }}
                  isActive={pageNumber === page}
                  className="h-7 min-w-7 px-1.5 text-xs rounded-md cursor-pointer"
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            ))}

            {/* Ellipsis after siblings */}
            {siblingsEnd < count - boundaryCount - 1 ? (
              <PaginationItem>
                <PaginationEllipsis className="size-7 [&_svg]:size-3" />
              </PaginationItem>
            ) : count - boundaryCount > boundaryCount ? (
              <PaginationItem>
                <PaginationLink
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(count - boundaryCount);
                  }}
                  isActive={count - boundaryCount === page}
                  className="h-7 min-w-7 px-1.5 text-xs rounded-md cursor-pointer"
                >
                  {count - boundaryCount}
                </PaginationLink>
              </PaginationItem>
            ) : null}

            {/* End Pages */}
            {endPages.map((pageNumber) => (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(pageNumber);
                  }}
                  isActive={pageNumber === page}
                  className="h-7 min-w-7 px-1.5 text-xs rounded-md cursor-pointer"
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            ))}

            {/* Next Button */}
            <PaginationItem>
              {hasNextPage ? (
                <PaginationLink
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.min(count, p + 1));
                  }}
                  className="h-7 w-7 p-0 flex items-center justify-center rounded-md cursor-pointer"
                  aria-label="Next page"
                >
                  <ChevronRightIcon className="w-3.5 h-3.5" />
                </PaginationLink>
              ) : (
                <span className="inline-flex items-center justify-center size-7 text-muted-foreground/40 select-none">
                  <ChevronRightIcon className="w-3.5 h-3.5" />
                </span>
              )}
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* 7. Modals / Dialogs for Fast In-Context Cash Ledger Operations */}
      <ExpenseDialog
        open={isExpenseOpen}
        onOpenChange={setIsExpenseOpen}
        accounts={accounts}
        categories={categories}
        onSuccess={loadData}
        isEn={isEn}
      />

      <IncomeDialog
        open={isIncomeOpen}
        onOpenChange={setIsIncomeOpen}
        accounts={accounts}
        categories={categories}
        onSuccess={loadData}
        isEn={isEn}
      />

      <TransferDialog
        open={isTransferOpen}
        onOpenChange={setIsTransferOpen}
        accounts={accounts}
        onSuccess={loadData}
        isEn={isEn}
      />

      {/* 8. Receipt Photo Lightbox Modal */}
      <Dialog
        open={!!previewReceiptUrl}
        onOpenChange={(open) => {
          if (!open) setPreviewReceiptUrl(null);
        }}
      >
        <DialogContent className="w-[95vw] sm:max-w-lg p-0 overflow-hidden border-border bg-background">
          <DialogHeader className="p-4 border-b border-border bg-muted/20 flex flex-row items-center justify-between">
            <DialogTitle className="text-sm font-semibold">
              {isEn ? "Receipt Photo" : "Bukti Nota / Struk Transaksi"}
            </DialogTitle>
            {previewReceiptUrl && (
              <a
                href={previewReceiptUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary flex items-center gap-1 hover:underline mr-4"
              >
                <span>{isEn ? "Open full image" : "Buka ukuran penuh"}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </DialogHeader>
          <div className="p-4 flex items-center justify-center max-h-[75vh] overflow-auto bg-muted/10">
            {previewReceiptUrl && (
              <img
                src={previewReceiptUrl}
                alt="Receipt Preview"
                className="max-h-[65vh] w-auto object-contain rounded-lg border border-border shadow-sm"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 9. Delete Confirmation Modal */}
      <AlertDialog
        open={!!transactionToDelete}
        onOpenChange={(open) => {
          if (!open) setTransactionToDelete(null);
        }}
      >
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isEn ? "Delete Transaction Entry" : "Hapus Catatan Transaksi"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isEn ? (
                <>
                  Are you sure you want to delete transaction{" "}
                  <span className="font-semibold text-foreground">
                    #{transactionToDelete?.transaction_number}
                  </span>{" "}
                  ({transactionToDelete?.description}) of{" "}
                  <span className="font-semibold text-foreground">
                    {formatIDR(transactionToDelete?.amount || 0)}
                  </span>
                  ? This will remove the record from ledger calculations.
                </>
              ) : (
                <>
                  Apakah Anda yakin ingin menghapus catatan transaksi{" "}
                  <span className="font-semibold text-foreground">
                    #{transactionToDelete?.transaction_number}
                  </span>{" "}
                  ({transactionToDelete?.description}) sebesar{" "}
                  <span className="font-semibold text-foreground">
                    {formatIDR(transactionToDelete?.amount || 0)}
                  </span>
                  ? Tindakan ini akan memperbarui saldo buku kas Anda.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setTransactionToDelete(null)}
              className="h-8 text-xs font-medium cursor-pointer"
            >
              {isEn ? "Cancel" : "Batal"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDeleteTransaction}
              className="h-8 text-xs font-medium cursor-pointer"
            >
              {isDeleting
                ? isEn
                  ? "Deleting..."
                  : "Menghapus..."
                : isEn
                ? "Yes, Delete"
                : "Ya, Hapus Transaksi"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
