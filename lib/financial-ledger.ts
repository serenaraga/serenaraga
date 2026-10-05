import { supabase } from "./supabase";

export type AccountType = "cash" | "bank" | "e_wallet";
export type TransactionType = "expense" | "income" | "transfer";
export type CategoryType = "expense" | "income";

export interface FinancialAccount {
  id: number;
  name: string;
  type: AccountType;
  account_number: string | null;
  account_holder: string | null;
  initial_balance: number;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at?: string;
}

export interface FinancialCategory {
  id: number;
  name: string;
  type: CategoryType;
  description: string | null;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
}

export interface FinancialTransaction {
  id: number;
  transaction_number: string;
  type: TransactionType;
  account_id: number;
  to_account_id: number | null;
  category_id: number | null;
  category_name_snapshot: string | null;
  amount: number;
  transaction_date: string;
  description: string;
  reference_number: string | null;
  receipt_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at?: string;
  // Joined relation objects
  account?: FinancialAccount | null;
  to_account?: FinancialAccount | null;
  category?: FinancialCategory | null;
}

export interface FinancialLedgerSummary {
  totalBalance: number;
  totalCashBalance: number;
  totalBankBalance: number;
  totalEwalletBalance: number;
  totalIncomeMonth: number;
  totalExpenseMonth: number;
}

export interface PaymentMethodMapping {
  cash_account_id: number | null;
  qris_account_id: number | null;
  bank_transfer_account_id: number | null;
}

const PAYMENT_MAPPINGS_STORAGE_KEY = "serenaraga_financial_payment_mappings";

/**
 * Normalizes payment method text to standard labels
 */
export function getPaymentMethodLabel(method?: string | null): string {
  if (!method) return "-";
  const m = method.toLowerCase().trim();
  if (m === "qris" || m === "e_wallet" || m === "ewallet") return "QRIS";
  if (m === "cash" || m === "tunai") return "CASH";
  if (m === "bank_transfer" || m === "transfer" || m === "bank") return "BANK TRANSFER";
  return m.replace(/_/g, " ").toUpperCase();
}

/**
 * Load payment method to financial account mappings (from Supabase brand_settings or localStorage)
 */
export async function fetchPaymentMethodMappings(): Promise<PaymentMethodMapping> {
  const defaultMapping: PaymentMethodMapping = {
    cash_account_id: null,
    qris_account_id: null,
    bank_transfer_account_id: null,
  };

  // 1. Check localStorage first
  let cachedMapping: PaymentMethodMapping | null = null;
  try {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(PAYMENT_MAPPINGS_STORAGE_KEY);
      if (stored) {
        cachedMapping = JSON.parse(stored);
      }
    }
  } catch (e) {
    console.warn("Error reading payment mapping from localStorage:", e);
  }

  // 2. Query Supabase brand_settings for remote persistence
  try {
    const { data, error } = await supabase
      .from("brand_settings")
      .select("financial_account_mappings")
      .eq("id", 1)
      .maybeSingle();

    if (!error && data?.financial_account_mappings) {
      const dbMapping = data.financial_account_mappings as PaymentMethodMapping;
      const merged = { ...defaultMapping, ...cachedMapping, ...dbMapping };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(PAYMENT_MAPPINGS_STORAGE_KEY, JSON.stringify(merged));
        } catch (_) {}
      }
      return merged;
    }
  } catch (e) {
    console.warn("Could not query brand_settings for payment mappings:", e);
  }

  return cachedMapping ? { ...defaultMapping, ...cachedMapping } : defaultMapping;
}

/**
 * Save payment method to financial account mappings (to Supabase brand_settings & localStorage)
 */
export async function savePaymentMethodMappings(
  mappings: PaymentMethodMapping
): Promise<PaymentMethodMapping> {
  // 1. Save to localStorage
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(PAYMENT_MAPPINGS_STORAGE_KEY, JSON.stringify(mappings));
    } catch (e) {
      console.warn("Failed saving to localStorage:", e);
    }
  }

  // 2. Save to Supabase brand_settings
  try {
    await supabase
      .from("brand_settings")
      .update({
        financial_account_mappings: mappings,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
  } catch (e) {
    console.warn("Could not persist mappings to brand_settings table:", e);
  }

  return mappings;
}

/**
 * Resolves the target financial account for a given payment method.
 * Returns null if no account is configured for the payment method.
 */
export function resolveTargetAccount(
  method: string | null | undefined,
  accounts: FinancialAccount[],
  mappings: PaymentMethodMapping
): FinancialAccount | null {
  if (!method) return null;
  const m = method.toLowerCase().trim();
  let targetId: number | null = null;

  if (m === "cash" || m === "tunai") {
    targetId = mappings.cash_account_id;
  } else if (m === "qris" || m === "e_wallet" || m === "ewallet") {
    targetId = mappings.qris_account_id;
  } else if (m === "bank_transfer" || m === "transfer" || m === "bank") {
    targetId = mappings.bank_transfer_account_id;
  }

  // If a specific mapped account exists and is active, return it
  if (targetId) {
    const found = accounts.find((a) => Number(a.id) === Number(targetId) && a.is_active);
    if (found) return found;
  }

  // If not configured / unassigned, return null
  return null;
}

/**
 * Generate transaction reference number: TXN-YYYYMMDD-XXXX
 */
export function generateTransactionNumber(): string {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `TXN-${yyyy}${mm}${dd}-${randomSuffix}`;
}

// =========================================================
// ACCOUNTS CRUD
// =========================================================

export async function fetchFinancialAccounts(): Promise<FinancialAccount[]> {
  const { data, error } = await supabase
    .from("financial_accounts")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Error fetching financial accounts:", error);
    throw new Error(error.message);
  }
  return data || [];
}

export async function createFinancialAccount(payload: {
  name: string;
  type: AccountType;
  account_number?: string;
  account_holder?: string;
  initial_balance?: number;
}): Promise<FinancialAccount> {
  const { data, error } = await supabase
    .from("financial_accounts")
    .insert([
      {
        name: payload.name.trim(),
        type: payload.type,
        account_number: payload.account_number?.trim() || null,
        account_holder: payload.account_holder?.trim() || null,
        initial_balance: payload.initial_balance || 0,
        is_active: true,
        is_default: false,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateFinancialAccount(
  id: number,
  payload: {
    name: string;
    type: AccountType;
    account_number?: string;
    account_holder?: string;
    initial_balance?: number;
    is_active?: boolean;
  }
): Promise<FinancialAccount> {
  const { data, error } = await supabase
    .from("financial_accounts")
    .update({
      name: payload.name.trim(),
      type: payload.type,
      account_number: payload.account_number?.trim() || null,
      account_holder: payload.account_holder?.trim() || null,
      initial_balance: payload.initial_balance !== undefined ? payload.initial_balance : 0,
      ...(payload.is_active !== undefined ? { is_active: payload.is_active } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteFinancialAccount(id: number): Promise<void> {
  const { error } = await supabase.from("financial_accounts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// =========================================================
// CATEGORIES CRUD
// =========================================================

export async function fetchFinancialCategories(): Promise<FinancialCategory[]> {
  const { data, error } = await supabase
    .from("financial_categories")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error);
    throw new Error(error.message);
  }
  return data || [];
}

export async function createFinancialCategory(payload: {
  name: string;
  type: CategoryType;
  description?: string;
}): Promise<FinancialCategory> {
  const { data, error } = await supabase
    .from("financial_categories")
    .insert([
      {
        name: payload.name.trim(),
        type: payload.type,
        description: payload.description?.trim() || null,
        is_active: true,
        is_default: false,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateFinancialCategory(
  id: number,
  payload: {
    name: string;
    type: CategoryType;
    description?: string;
  }
): Promise<FinancialCategory> {
  const { data, error } = await supabase
    .from("financial_categories")
    .update({
      name: payload.name.trim(),
      type: payload.type,
      description: payload.description?.trim() || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteFinancialCategory(id: number): Promise<void> {
  const { error } = await supabase.from("financial_categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// =========================================================
// TRANSACTIONS CRUD & BALANCES
// =========================================================

export async function fetchFinancialTransactions(): Promise<FinancialTransaction[]> {
  const { data, error } = await supabase
    .from("financial_transactions")
    .select(`
      *,
      account:financial_accounts!financial_transactions_account_id_fkey(*),
      to_account:financial_accounts!financial_transactions_to_account_id_fkey(*),
      category:financial_categories!financial_transactions_category_id_fkey(*)
    `)
    .order("transaction_date", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    console.error("Error fetching transactions:", error);
    throw new Error(error.message);
  }
  return data || [];
}

export async function createFinancialTransaction(payload: {
  type: TransactionType;
  account_id: number;
  to_account_id?: number | null;
  category_id?: number | null;
  category_name_snapshot?: string | null;
  amount: number;
  transaction_date: string;
  description: string;
  reference_number?: string | null;
  receipt_url?: string | null;
  notes?: string | null;
}): Promise<FinancialTransaction> {
  const transactionNumber = generateTransactionNumber();

  const { data, error } = await supabase
    .from("financial_transactions")
    .insert([
      {
        transaction_number: transactionNumber,
        type: payload.type,
        account_id: payload.account_id,
        to_account_id: payload.to_account_id || null,
        category_id: payload.category_id || null,
        category_name_snapshot: payload.category_name_snapshot || null,
        amount: payload.amount,
        transaction_date: payload.transaction_date,
        description: payload.description.trim(),
        reference_number: payload.reference_number?.trim() || null,
        receipt_url: payload.receipt_url || null,
        notes: payload.notes?.trim() || null,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Upload receipt image to Supabase Storage 'financial-receipts' bucket
 */
export async function uploadReceiptFile(file: File): Promise<string> {
  const fileExt = file.name.split(".").pop() || "jpg";
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `receipts/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("financial-receipts")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload nota gagal: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from("financial-receipts")
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

export async function deleteFinancialTransaction(id: number): Promise<void> {
  const { error } = await supabase.from("financial_transactions").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteFinancialTransactionByReference(ref: string): Promise<void> {
  if (!ref) return;
  const { error } = await supabase
    .from("financial_transactions")
    .delete()
    .eq("reference_number", ref.trim());
  if (error) {
    console.warn("Could not delete financial transaction by reference:", error);
  }
}

/**
 * Automatically synchronize an invoice payment into financial_transactions
 */
export async function syncInvoicePaymentToFinancialLedger(invoice: {
  invoice_number: string;
  customer_name?: string;
  service_name?: string;
  total_amount: number;
  payment_method?: string;
  payment_status?: string;
  booking_date?: string;
  booking_id?: number | null;
}): Promise<{ status: "synced" | "removed" | "skipped"; transactionId?: number }> {
  const isPaid = (invoice.payment_status || "").toLowerCase() === "paid";
  const ref = invoice.invoice_number?.trim();
  if (!ref) return { status: "skipped" };

  // 1. Check if a transaction for this invoice already exists
  const { data: existingTxns, error: fetchErr } = await supabase
    .from("financial_transactions")
    .select("id, transaction_number, amount, account_id, transaction_date")
    .eq("reference_number", ref);

  if (fetchErr) {
    console.error("Failed to check existing financial transaction:", fetchErr);
  }

  const existingTxn = existingTxns && existingTxns.length > 0 ? existingTxns[0] : null;

  // If unpaid / refunded, remove existing transaction if present
  if (!isPaid) {
    if (existingTxn) {
      await supabase.from("financial_transactions").delete().eq("id", existingTxn.id);
      return { status: "removed" };
    }
    return { status: "skipped" };
  }

  // 2. Fetch active accounts, categories, and payment method mappings
  const [accounts, categories, mappings] = await Promise.all([
    fetchFinancialAccounts(),
    fetchFinancialCategories(),
    fetchPaymentMethodMappings(),
  ]);

  const targetAccount = resolveTargetAccount(invoice.payment_method, accounts, mappings);
  if (!targetAccount) {
    console.warn("No active financial account available to record invoice payment.");
    return { status: "skipped" };
  }

  // Find or determine income category
  let targetCategory = categories.find(
    (c) => c.type === "income" && (c.name.toLowerCase().includes("booking") || c.name.toLowerCase().includes("layanan"))
  );
  if (!targetCategory) {
    targetCategory = categories.find((c) => c.type === "income");
  }

  const amount = Math.max(0, Number(invoice.total_amount || 0));
  const txnDate = invoice.booking_date || new Date().toISOString().split("T")[0];
  const methodLabel = getPaymentMethodLabel(invoice.payment_method);
  const custName = invoice.customer_name || "Pelanggan";
  const srvName = invoice.service_name ? ` (${invoice.service_name})` : "";
  const desc = `Pemasukan Nota #${ref} - ${custName}${srvName}`;
  const notes = `Metode: ${methodLabel} | Rekening: ${targetAccount.name}${
    invoice.booking_id ? ` | Booking ID: #${invoice.booking_id}` : ""
  }`;

  if (existingTxn) {
    // Update existing transaction
    const { data: updatedTxn, error: updateErr } = await supabase
      .from("financial_transactions")
      .update({
        account_id: targetAccount.id,
        category_id: targetCategory?.id || null,
        category_name_snapshot: targetCategory?.name || "Pemasukan Layanan & Booking",
        amount: amount,
        transaction_date: txnDate,
        description: desc,
        notes: notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingTxn.id)
      .select("id")
      .single();

    if (updateErr) console.error("Error updating transaction:", updateErr);
    return { status: "synced", transactionId: updatedTxn?.id || existingTxn.id };
  } else {
    // Insert new transaction
    const { data: newTxn, error: insertErr } = await supabase
      .from("financial_transactions")
      .insert([
        {
          transaction_number: generateTransactionNumber(),
          type: "income",
          account_id: targetAccount.id,
          to_account_id: null,
          category_id: targetCategory?.id || null,
          category_name_snapshot: targetCategory?.name || "Pemasukan Layanan & Booking",
          amount: amount,
          transaction_date: txnDate,
          description: desc,
          reference_number: ref,
          receipt_url: null,
          notes: notes,
        },
      ])
      .select("id")
      .single();

    if (insertErr) console.error("Error inserting transaction:", insertErr);
    return { status: "synced", transactionId: newTxn?.id };
  }
}

/**
 * Batch synchronize all paid invoices from database to financial ledger
 */
export async function syncAllPaidInvoicesToLedger(): Promise<{
  totalPaidInvoices: number;
  syncedCount: number;
}> {
  const { data: paidInvoices, error } = await supabase
    .from("invoices")
    .select("id, invoice_number, customer_name, service_name, total_amount, payment_method, payment_status, booking_date, booking_id")
    .eq("payment_status", "paid");

  if (error || !paidInvoices) {
    throw new Error(error?.message || "Failed to fetch paid invoices");
  }

  let count = 0;
  for (const inv of paidInvoices) {
    try {
      const res = await syncInvoicePaymentToFinancialLedger(inv);
      if (res.status === "synced") count++;
    } catch (e) {
      console.warn(`Failed syncing invoice #${inv.invoice_number}:`, e);
    }
  }

  return {
    totalPaidInvoices: paidInvoices.length,
    syncedCount: count,
  };
}
