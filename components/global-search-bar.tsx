"use client";

import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLocaleState } from "ra-core";
import {
  Search,
  ReceiptText,
  Users,
  CalendarCheck,
  Sparkles,
  UserCheck,
  Package,
  SlidersHorizontal,
  PlusCircle,
  Command as CommandIcon,
  Loader2,
  ChevronRight,
  ArrowUpDown,
  CornerDownLeft,
  X,
  Wallet,
  Star,
  UserCog,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface PageConfig {
  key: string;
  nameId: string;
  nameEn: string;
  placeholderId: string;
  placeholderEn: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PAGE_CONFIGS: Record<string, PageConfig> = {
  bookings: {
    key: "bookings",
    nameId: "Jadwal Booking",
    nameEn: "Bookings",
    placeholderId: "Cari booking (nama pelanggan, alamat, status, ID)...",
    placeholderEn: "Search bookings (customer, address, status, ID)...",
    icon: CalendarCheck,
  },
  customers: {
    key: "customers",
    nameId: "Data Pelanggan",
    nameEn: "Customers",
    placeholderId: "Cari pelanggan (nama, no WhatsApp, email, kota)...",
    placeholderEn: "Search customers (name, WhatsApp, email, city)...",
    icon: Users,
  },
  invoices: {
    key: "invoices",
    nameId: "Nota & Invoice",
    nameEn: "Invoices",
    placeholderId: "Cari invoice (no invoice, pelanggan, paket, status)...",
    placeholderEn: "Search invoices (invoice #, customer, service, status)...",
    icon: ReceiptText,
  },
  therapists: {
    key: "therapists",
    nameId: "Tim Terapis",
    nameEn: "Therapists",
    placeholderId: "Cari terapis (nama, no HP, spesialisasi, bank)...",
    placeholderEn: "Search therapists (name, phone, skills, bank)...",
    icon: UserCheck,
  },
  services: {
    key: "services",
    nameId: "Katalog Layanan",
    nameEn: "Services",
    placeholderId: "Cari layanan (nama treatment, kategori, harga)...",
    placeholderEn: "Search services (treatment, category, price)...",
    icon: Sparkles,
  },
  consumables: {
    key: "consumables",
    nameId: "Bahan & Inventaris (BHP)",
    nameEn: "Consumables",
    placeholderId: "Cari bahan & BHP (nama minyak, kategori, stok)...",
    placeholderEn: "Search consumables (oil name, category, unit)...",
    icon: Package,
  },
  payouts: {
    key: "payouts",
    nameId: "Bagi Hasil",
    nameEn: "Payouts",
    placeholderId: "Cari payout (nomor payout, nama terapis)...",
    placeholderEn: "Search payouts (payout #, therapist name)...",
    icon: Wallet,
  },
  reviews: {
    key: "reviews",
    nameId: "Ulasan Pelanggan",
    nameEn: "Reviews",
    placeholderId: "Cari ulasan (nama pelanggan, komentar)...",
    placeholderEn: "Search reviews (customer name, comments)...",
    icon: Star,
  },
  users: {
    key: "users",
    nameId: "Admin & Pengguna",
    nameEn: "Users",
    placeholderId: "Cari admin (nama, username, role)...",
    placeholderEn: "Search users (name, username, role)...",
    icon: UserCog,
  },
  settings: {
    key: "settings",
    nameId: "Pengaturan Brand",
    nameEn: "Settings",
    placeholderId: "Cari pengaturan...",
    placeholderEn: "Search settings...",
    icon: SlidersHorizontal,
  },
};

interface SearchResultItem {
  id: number | string;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "outline" | "destructive";
  path: string;
  category: "bookings" | "customers" | "invoices" | "therapists" | "services" | "consumables";
  icon: React.ComponentType<{ className?: string }>;
}

export function GlobalSearchBar({ className }: { className?: string }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  const localInputRef = React.useRef<HTMLInputElement>(null);

  // Extract current active resource from pathname (e.g. /invoices -> "invoices")
  const pathSegment = location.pathname.split("/").filter(Boolean)[0] || "";
  const isDashboard = !pathSegment || pathSegment === "" || pathSegment === "admin";
  const activePageConfig = PAGE_CONFIGS[pathSegment];

  // ---------------------------------------------------------------------------
  // STATE FOR SPOTLIGHT SEARCH (Only on Dashboard)
  // ---------------------------------------------------------------------------
  const [spotlightOpen, setSpotlightOpen] = React.useState(false);
  const [spotlightQuery, setSpotlightQuery] = React.useState("");
  const [spotlightLoading, setSpotlightLoading] = React.useState(false);
  const [spotlightResults, setSpotlightResults] = React.useState<{
    bookings: SearchResultItem[];
    customers: SearchResultItem[];
    invoices: SearchResultItem[];
    therapists: SearchResultItem[];
    services: SearchResultItem[];
    consumables: SearchResultItem[];
  }>({
    bookings: [],
    customers: [],
    invoices: [],
    therapists: [],
    services: [],
    consumables: [],
  });

  // ---------------------------------------------------------------------------
  // STATE FOR IN-PAGE LOCAL SEARCH (On Specific Module Pages)
  // ---------------------------------------------------------------------------
  const currentUrlQuery = React.useMemo(() => {
    try {
      const searchParams = new URLSearchParams(location.search);
      const filterStr = searchParams.get("filter");
      if (filterStr) {
        const parsed = JSON.parse(filterStr);
        return typeof parsed.q === "string" ? parsed.q : "";
      }
    } catch (e) {
      // ignore JSON parse error
    }
    return "";
  }, [location.search]);

  const [localSearchValue, setLocalSearchValue] = React.useState(currentUrlQuery);

  React.useEffect(() => {
    setLocalSearchValue(currentUrlQuery);
  }, [currentUrlQuery]);

  // Debounce in-page local search
  React.useEffect(() => {
    if (isDashboard) return;

    const timer = setTimeout(() => {
      if (localSearchValue !== currentUrlQuery) {
        const searchParams = new URLSearchParams(location.search);
        let filterObj: Record<string, any> = {};

        try {
          const filterStr = searchParams.get("filter");
          if (filterStr) filterObj = JSON.parse(filterStr);
        } catch (e) {
          filterObj = {};
        }

        if (localSearchValue.trim() !== "") {
          filterObj.q = localSearchValue.trim();
        } else {
          delete filterObj.q;
        }

        if (Object.keys(filterObj).length > 0) {
          searchParams.set("filter", JSON.stringify(filterObj));
        } else {
          searchParams.delete("filter");
        }
        searchParams.set("page", "1");

        navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [localSearchValue, currentUrlQuery, location.pathname, location.search, isDashboard, navigate]);

  // Global Keyboard Shortcut (⌘K / Ctrl+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isDashboard) {
          setSpotlightOpen((prev) => !prev);
        } else {
          localInputRef.current?.focus();
          localInputRef.current?.select();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDashboard]);

  // Multi-table search for Spotlight
  React.useEffect(() => {
    if (!isDashboard) return;
    const trimmed = spotlightQuery.trim();
    if (!trimmed) {
      setSpotlightResults({
        bookings: [],
        customers: [],
        invoices: [],
        therapists: [],
        services: [],
        consumables: [],
      });
      setSpotlightLoading(false);
      return;
    }

    setSpotlightLoading(true);
    const timer = setTimeout(async () => {
      try {
        const cleanDigits = trimmed.replace(/[^0-9]/g, "");
        const numId = cleanDigits ? parseInt(cleanDigits, 10) : null;

        const [custRes, therRes, servRes, invRes, consumRes] = await Promise.all([
          supabase
            .from("customers")
            .select("id, full_name, phone, address, city_area")
            .or(`full_name.ilike.%${trimmed}%,phone.ilike.%${trimmed}%,address.ilike.%${trimmed}%,city_area.ilike.%${trimmed}%`)
            .limit(5),

          supabase
            .from("therapists")
            .select("id, name, phone, specialties, status, commission_rate")
            .or(`name.ilike.%${trimmed}%,phone.ilike.%${trimmed}%,specialties.ilike.%${trimmed}%`)
            .limit(5),

          supabase
            .from("services")
            .select("id, name, category, price, duration_minutes")
            .or(`name.ilike.%${trimmed}%,category.ilike.%${trimmed}%`)
            .limit(5),

          supabase
            .from("invoices")
            .select("id, invoice_number, customer_name, service_name, total_amount, payment_status")
            .or(`invoice_number.ilike.%${trimmed}%,customer_name.ilike.%${trimmed}%,service_name.ilike.%${trimmed}%,payment_status.ilike.%${trimmed}%`)
            .limit(5),

          supabase
            .from("consumables")
            .select("id, name, category, unit, stock_quantity")
            .or(`name.ilike.%${trimmed}%,category.ilike.%${trimmed}%`)
            .limit(5),
        ]);

        const matchedCustIds = (custRes.data || []).map((c) => c.id);
        const bookingOrParts: string[] = [
          `service_address.ilike.%${trimmed}%`,
          `status.ilike.%${trimmed}%`,
          `payment_method.ilike.%${trimmed}%`,
          `payment_status.ilike.%${trimmed}%`,
        ];

        if (matchedCustIds.length > 0) {
          bookingOrParts.push(`customer_id.in.(${matchedCustIds.join(",")})`);
        }
        if (numId && !isNaN(numId)) {
          bookingOrParts.push(`id.eq.${numId}`);
        }

        const bookRes = await supabase
          .from("bookings")
          .select("id, customer_id, booking_date, booking_time, total_price, status, service_address")
          .or(bookingOrParts.join(","))
          .limit(5);

        const mappedBookings: SearchResultItem[] = (bookRes.data || []).map((b) => ({
          id: b.id,
          title: `Booking #${b.id} • ${b.booking_date} (${b.booking_time})`,
          subtitle: `${b.service_address || "Alamat tercatat"} • Rp ${Number(b.total_price || 0).toLocaleString("id-ID")}`,
          badge: b.status,
          badgeVariant: b.status === "completed" ? "secondary" : "outline",
          path: `/bookings/${b.id}/show`,
          category: "bookings",
          icon: CalendarCheck,
        }));

        const mappedCustomers: SearchResultItem[] = (custRes.data || []).map((c) => ({
          id: c.id,
          title: c.full_name,
          subtitle: `${c.phone} • ${c.city_area || c.address || "Jakarta"}`,
          path: `/customers/${c.id}/show`,
          category: "customers",
          icon: Users,
        }));

        const mappedInvoices: SearchResultItem[] = (invRes.data || []).map((inv) => ({
          id: inv.id,
          title: `${inv.invoice_number} • ${inv.customer_name}`,
          subtitle: `${inv.service_name} • Rp ${Number(inv.total_amount || 0).toLocaleString("id-ID")}`,
          badge: inv.payment_status,
          badgeVariant: inv.payment_status === "paid" ? "secondary" : "destructive",
          path: `/invoices/${inv.id}/show`,
          category: "invoices",
          icon: ReceiptText,
        }));

        const mappedTherapists: SearchResultItem[] = (therRes.data || []).map((t) => ({
          id: t.id,
          title: `${t.name} (${t.commission_rate || 70}%)`,
          subtitle: `${t.phone} • ${t.specialties || "Pijat Tradisional"}`,
          badge: t.status,
          badgeVariant: "outline",
          path: `/therapists/${t.id}/show`,
          category: "therapists",
          icon: UserCheck,
        }));

        const mappedServices: SearchResultItem[] = (servRes.data || []).map((s) => ({
          id: s.id,
          title: s.name,
          subtitle: `${s.category} • ${s.duration_minutes} mnt • Rp ${Number(s.price || 0).toLocaleString("id-ID")}`,
          path: `/services/${s.id}/show`,
          category: "services",
          icon: Sparkles,
        }));

        const mappedConsumables: SearchResultItem[] = (consumRes.data || []).map((cs) => ({
          id: cs.id,
          title: cs.name,
          subtitle: `${cs.category} • Stok: ${cs.stock_quantity} ${cs.unit}`,
          path: `/consumables/${cs.id}/show`,
          category: "consumables",
          icon: Package,
        }));

        setSpotlightResults({
          bookings: mappedBookings,
          customers: mappedCustomers,
          invoices: mappedInvoices,
          therapists: mappedTherapists,
          services: mappedServices,
          consumables: mappedConsumables,
        });
      } catch (err) {
        console.error("Spotlight search error:", err);
      } finally {
        setSpotlightLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [spotlightQuery, isDashboard]);

  const handleClearLocal = () => {
    setLocalSearchValue("");
    const searchParams = new URLSearchParams(location.search);
    try {
      const filterStr = searchParams.get("filter");
      if (filterStr) {
        const filterObj = JSON.parse(filterStr);
        delete filterObj.q;
        if (Object.keys(filterObj).length > 0) {
          searchParams.set("filter", JSON.stringify(filterObj));
        } else {
          searchParams.delete("filter");
        }
        searchParams.set("page", "1");
        navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
      }
    } catch (e) {
      searchParams.delete("filter");
      navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
    }
  };

  const handleSelectSpotlightAction = (path: string) => {
    setSpotlightOpen(false);
    setSpotlightQuery("");
    navigate(path);
  };

  const totalSpotlightCount =
    spotlightResults.bookings.length +
    spotlightResults.customers.length +
    spotlightResults.invoices.length +
    spotlightResults.therapists.length +
    spotlightResults.services.length +
    spotlightResults.consumables.length;

  const PageIcon = activePageConfig?.icon || Search;
  const localPlaceholder = activePageConfig
    ? isEn
      ? activePageConfig.placeholderEn
      : activePageConfig.placeholderId
    : isEn
    ? "Search on this page..."
    : "Cari di halaman ini...";

  return (
    <div className={cn("relative flex items-center w-full transition-all duration-200", className)}>
      {isDashboard ? (
        /* =========================================================================
           1. DASHBOARD MODE: Spotlight Search Trigger & Omni Command Palette
           ========================================================================= */
        <>
          <button
            type="button"
            onClick={() => setSpotlightOpen(true)}
            className="group flex items-center justify-between w-full h-8 px-2.5 rounded-lg border border-border/70 bg-muted/30 hover:bg-muted/60 hover:border-foreground/20 focus-visible:ring-1 focus-visible:ring-ring text-left transition-all duration-150 cursor-pointer shadow-none"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Search className="w-3.5 h-3.5 text-muted-foreground/70 group-hover:text-foreground transition-colors shrink-0" />
              <span className="text-xs text-muted-foreground/80 group-hover:text-foreground font-normal truncate">
                {isEn ? "Search anything in Serena Raga..." : "Cari booking, pelanggan, invoice, terapis..."}
              </span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[9px] font-medium text-muted-foreground group-hover:text-foreground shadow-none shrink-0 select-none">
              <CommandIcon className="w-2.5 h-2.5" />K
            </kbd>
          </button>

          <CommandDialog
            open={spotlightOpen}
            onOpenChange={setSpotlightOpen}
            shouldFilter={false}
            title={isEn ? "Global Search & Quick Actions" : "Pencarian Global & Tindakan Cepat"}
            description={isEn ? "Search across all Serena Raga data or run quick actions" : "Cari seluruh data Serena Raga atau jalankan aksi cepat"}
            className="max-w-xl border-border bg-popover shadow-2xl rounded-xl overflow-hidden p-0"
            overlayClassName="bg-black/35 backdrop-blur-[2px]"
          >
            <CommandInput
              placeholder={isEn ? "Type customer name, invoice #, booking ID, phone..." : "Ketik nama pelanggan, no invoice, booking ID, no HP..."}
              value={spotlightQuery}
              onValueChange={setSpotlightQuery}
              className="text-xs sm:text-sm h-11"
            />

            <CommandList className="max-h-[380px] p-2 overflow-y-auto">
              {spotlightLoading && (
                <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin text-[#8b5e3c] dark:text-[#d49b6a]" />
                  <span>{isEn ? "Searching database..." : "Mencari seluruh database..."}</span>
                </div>
              )}

              {!spotlightLoading && spotlightQuery.trim() !== "" && totalSpotlightCount === 0 && (
                <CommandEmpty className="py-8 text-center text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">
                    {isEn ? `No results found for "${spotlightQuery}"` : `Tidak ada hasil untuk "${spotlightQuery}"`}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {isEn ? "Try searching by customer name, phone number, invoice number, or booking ID." : "Coba cari berdasarkan nama pelanggan, no WhatsApp, nomor invoice, atau ID booking."}
                  </p>
                </CommandEmpty>
              )}

              {!spotlightLoading && spotlightQuery.trim() === "" && (
                <>
                  <CommandGroup heading={isEn ? "Quick Actions" : "Tindakan Cepat"}>
                    <CommandItem
                      onSelect={() => handleSelectSpotlightAction("/bookings/create")}
                      className="flex items-center justify-between px-3 py-2 cursor-pointer rounded-lg text-xs hover:bg-muted/60"
                    >
                      <div className="flex items-center gap-2.5">
                        <PlusCircle className="w-4 h-4 text-[#8b5e3c] dark:text-[#d49b6a] shrink-0" />
                        <span className="font-medium text-foreground">{isEn ? "New Booking Schedule" : "Buat Jadwal Booking Baru"}</span>
                      </div>
                      <CommandShortcut className="text-[10px] text-muted-foreground font-mono">B</CommandShortcut>
                    </CommandItem>
                    <CommandItem
                      onSelect={() => handleSelectSpotlightAction("/customers/create")}
                      className="flex items-center justify-between px-3 py-2 cursor-pointer rounded-lg text-xs hover:bg-muted/60"
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-foreground">{isEn ? "Register New Customer" : "Tambah Data Pelanggan Baru"}</span>
                      </div>
                      <CommandShortcut className="text-[10px] text-muted-foreground font-mono">C</CommandShortcut>
                    </CommandItem>
                    <CommandItem
                      onSelect={() => handleSelectSpotlightAction("/invoices/create")}
                      className="flex items-center justify-between px-3 py-2 cursor-pointer rounded-lg text-xs hover:bg-muted/60"
                    >
                      <div className="flex items-center gap-2.5">
                        <ReceiptText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-foreground">{isEn ? "Create Invoice / Receipt" : "Buat Nota / Invoice Baru"}</span>
                      </div>
                      <CommandShortcut className="text-[10px] text-muted-foreground font-mono">I</CommandShortcut>
                    </CommandItem>
                    <CommandItem
                      onSelect={() => handleSelectSpotlightAction("/consumables/create")}
                      className="flex items-center justify-between px-3 py-2 cursor-pointer rounded-lg text-xs hover:bg-muted/60"
                    >
                      <div className="flex items-center gap-2.5">
                        <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-foreground">{isEn ? "Add Consumable / Oil Inventory" : "Tambah Stok Bahan / Minyak (BHP)"}</span>
                      </div>
                    </CommandItem>
                  </CommandGroup>

                  <CommandSeparator className="my-1.5" />

                  <CommandGroup heading={isEn ? "Navigation" : "Navigasi Menu"}>
                    <CommandItem
                      onSelect={() => handleSelectSpotlightAction("/")}
                      className="flex items-center gap-2.5 px-3 py-2 cursor-pointer rounded-lg text-xs"
                    >
                      <Sparkles className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-foreground">{isEn ? "Main Dashboard & Analytics" : "Dashboard Utama & Analisis"}</span>
                    </CommandItem>
                    <CommandItem
                      onSelect={() => handleSelectSpotlightAction("/bookings")}
                      className="flex items-center gap-2.5 px-3 py-2 cursor-pointer rounded-lg text-xs"
                    >
                      <CalendarCheck className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-foreground">{isEn ? "Bookings Schedule & Orders" : "Jadwal Booking & Riwayat Pesanan"}</span>
                    </CommandItem>
                    <CommandItem
                      onSelect={() => handleSelectSpotlightAction("/invoices")}
                      className="flex items-center gap-2.5 px-3 py-2 cursor-pointer rounded-lg text-xs"
                    >
                      <ReceiptText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-foreground">{isEn ? "Invoices & Payment Receipts" : "Daftar Nota & Bukti Pembayaran"}</span>
                    </CommandItem>
                    <CommandItem
                      onSelect={() => handleSelectSpotlightAction("/customers")}
                      className="flex items-center gap-2.5 px-3 py-2 cursor-pointer rounded-lg text-xs"
                    >
                      <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-foreground">{isEn ? "Customers Directory" : "Database Kontak Pelanggan"}</span>
                    </CommandItem>
                    <CommandItem
                      onSelect={() => handleSelectSpotlightAction("/therapists")}
                      className="flex items-center gap-2.5 px-3 py-2 cursor-pointer rounded-lg text-xs"
                    >
                      <UserCheck className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-foreground">{isEn ? "Therapists Team & Commissions" : "Daftar Terapis & Komisi"}</span>
                    </CommandItem>
                    <CommandItem
                      onSelect={() => handleSelectSpotlightAction("/services")}
                      className="flex items-center gap-2.5 px-3 py-2 cursor-pointer rounded-lg text-xs"
                    >
                      <Sparkles className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-foreground">{isEn ? "Services Catalog & Spa Menu" : "Katalog Layanan & Spa"}</span>
                    </CommandItem>
                    <CommandItem
                      onSelect={() => handleSelectSpotlightAction("/consumables")}
                      className="flex items-center gap-2.5 px-3 py-2 cursor-pointer rounded-lg text-xs"
                    >
                      <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-foreground">{isEn ? "Consumables & Supplies (BHP)" : "Bahan & Inventaris (BHP)"}</span>
                    </CommandItem>
                    <CommandItem
                      onSelect={() => handleSelectSpotlightAction("/settings")}
                      className="flex items-center gap-2.5 px-3 py-2 cursor-pointer rounded-lg text-xs"
                    >
                      <SlidersHorizontal className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-foreground">{isEn ? "Brand & WhatsApp Settings" : "Pengaturan Brand & WhatsApp"}</span>
                    </CommandItem>
                  </CommandGroup>
                </>
              )}

              {!spotlightLoading && spotlightQuery.trim() !== "" && (
                <>
                  {spotlightResults.bookings.length > 0 && (
                    <CommandGroup heading={isEn ? `Bookings (${spotlightResults.bookings.length})` : `Jadwal Booking (${spotlightResults.bookings.length})`}>
                      {spotlightResults.bookings.map((item) => (
                        <CommandItem
                          key={`book-${item.id}`}
                          onSelect={() => handleSelectSpotlightAction(item.path)}
                          className="flex items-center justify-between gap-2 px-3 py-2 cursor-pointer rounded-lg text-xs hover:bg-muted/60"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <CalendarCheck className="w-4 h-4 text-[#8b5e3c] dark:text-[#d49b6a] shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{item.title}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                            </div>
                          </div>
                          {item.badge && (
                            <Badge variant={item.badgeVariant || "outline"} className="text-[10px] px-2 py-0.5 capitalize shrink-0 font-normal">
                              {item.badge}
                            </Badge>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {spotlightResults.customers.length > 0 && (
                    <CommandGroup heading={isEn ? `Customers (${spotlightResults.customers.length})` : `Pelanggan (${spotlightResults.customers.length})`}>
                      {spotlightResults.customers.map((item) => (
                        <CommandItem
                          key={`cust-${item.id}`}
                          onSelect={() => handleSelectSpotlightAction(item.path)}
                          className="flex items-center justify-between gap-2 px-3 py-2 cursor-pointer rounded-lg text-xs hover:bg-muted/60"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{item.title}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {spotlightResults.invoices.length > 0 && (
                    <CommandGroup heading={isEn ? `Invoices (${spotlightResults.invoices.length})` : `Nota & Invoice (${spotlightResults.invoices.length})`}>
                      {spotlightResults.invoices.map((item) => (
                        <CommandItem
                          key={`inv-${item.id}`}
                          onSelect={() => handleSelectSpotlightAction(item.path)}
                          className="flex items-center justify-between gap-2 px-3 py-2 cursor-pointer rounded-lg text-xs hover:bg-muted/60"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <ReceiptText className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{item.title}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                            </div>
                          </div>
                          {item.badge && (
                            <Badge variant={item.badgeVariant || "outline"} className="text-[10px] px-2 py-0.5 uppercase shrink-0 font-normal">
                              {item.badge}
                            </Badge>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {spotlightResults.therapists.length > 0 && (
                    <CommandGroup heading={isEn ? `Therapists (${spotlightResults.therapists.length})` : `Terapis (${spotlightResults.therapists.length})`}>
                      {spotlightResults.therapists.map((item) => (
                        <CommandItem
                          key={`ther-${item.id}`}
                          onSelect={() => handleSelectSpotlightAction(item.path)}
                          className="flex items-center justify-between gap-2 px-3 py-2 cursor-pointer rounded-lg text-xs hover:bg-muted/60"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <UserCheck className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{item.title}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                            </div>
                          </div>
                          {item.badge && (
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5 capitalize shrink-0 font-normal">
                              {item.badge}
                            </Badge>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {spotlightResults.services.length > 0 && (
                    <CommandGroup heading={isEn ? `Services (${spotlightResults.services.length})` : `Layanan & Spa (${spotlightResults.services.length})`}>
                      {spotlightResults.services.map((item) => (
                        <CommandItem
                          key={`serv-${item.id}`}
                          onSelect={() => handleSelectSpotlightAction(item.path)}
                          className="flex items-center justify-between gap-2 px-3 py-2 cursor-pointer rounded-lg text-xs hover:bg-muted/60"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Sparkles className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{item.title}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {spotlightResults.consumables.length > 0 && (
                    <CommandGroup heading={isEn ? `Consumables (${spotlightResults.consumables.length})` : `Bahan & BHP (${spotlightResults.consumables.length})`}>
                      {spotlightResults.consumables.map((item) => (
                        <CommandItem
                          key={`consum-${item.id}`}
                          onSelect={() => handleSelectSpotlightAction(item.path)}
                          className="flex items-center justify-between gap-2 px-3 py-2 cursor-pointer rounded-lg text-xs hover:bg-muted/60"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{item.title}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>

            <div className="flex items-center justify-between px-3 py-2 border-t border-border/60 bg-muted/20 text-[11px] text-muted-foreground select-none">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <ArrowUpDown className="w-3 h-3 text-muted-foreground/70" />
                  <span>{isEn ? "navigate" : "pilih"}</span>
                </span>
                <span className="flex items-center gap-1">
                  <CornerDownLeft className="w-3 h-3 text-muted-foreground/70" />
                  <span>{isEn ? "open" : "buka"}</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="font-mono bg-background border border-border px-1 py-0.5 rounded text-[9px]">ESC</kbd>
                  <span>{isEn ? "close" : "tutup"}</span>
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground/70 hidden sm:inline">
                Serena Raga Spotlight
              </span>
            </div>
          </CommandDialog>
        </>
      ) : (
        /* =========================================================================
           2. SPECIFIC PAGE MODE: In-Page Local Table Filter (No Modal Popup)
           ========================================================================= */
        <div className="group flex items-center w-full h-8 px-2 rounded-lg border border-border/70 bg-muted/30 hover:bg-muted/50 focus-within:bg-background focus-within:border-foreground/30 focus-within:ring-1 focus-within:ring-ring transition-all duration-150 shadow-none gap-1.5">
          <PageIcon className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0 ml-0.5" />
          <div className="relative flex-1 flex items-center min-w-0">
            <Input
              ref={localInputRef}
              type="text"
              value={localSearchValue}
              onChange={(e) => setLocalSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  handleClearLocal();
                  localInputRef.current?.blur();
                }
              }}
              placeholder={localPlaceholder}
              className="h-7 border-0 bg-transparent px-1 text-xs text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none w-full"
            />
          </div>
          {localSearchValue ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearLocal}
              className="h-5 w-5 p-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
              title={isEn ? "Clear search" : "Hapus pencarian"}
            >
              <X className="w-3 h-3" />
            </Button>
          ) : (
            <kbd
              onClick={() => localInputRef.current?.focus()}
              className="hidden md:inline-flex items-center gap-0.5 pointer-events-auto cursor-pointer select-none rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[9px] font-medium text-muted-foreground hover:text-foreground shadow-none shrink-0"
              title={isEn ? "Press Ctrl+K to search" : "Tekan Ctrl+K untuk mencari"}
            >
              <CommandIcon className="w-2.5 h-2.5" />K
            </kbd>
          )}
        </div>
      )}
    </div>
  );
}
