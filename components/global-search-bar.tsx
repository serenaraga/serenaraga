"use client";

import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLocaleState } from "ra-core";
import {
  Search,
  X,
  ReceiptText,
  Users,
  CalendarCheck,
  Sparkles,
  UserCheck,
  Star,
  Package,
  Wallet,
  UserCog,
  ChevronDown,
  Command as CommandIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ResourceConfig {
  key: string;
  nameId: string;
  nameEn: string;
  placeholderId: string;
  placeholderEn: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const RESOURCE_CONFIGS: ResourceConfig[] = [
  {
    key: "invoices",
    nameId: "Nota & Invoice",
    nameEn: "Invoices",
    placeholderId: "Cari no invoice, pelanggan, paket, status...",
    placeholderEn: "Search invoice #, customer, service, status...",
    path: "/invoices",
    icon: ReceiptText,
  },
  {
    key: "customers",
    nameId: "Pelanggan",
    nameEn: "Customers",
    placeholderId: "Cari nama pelanggan, no WA, email, alamat...",
    placeholderEn: "Search customer name, WhatsApp, email, address...",
    path: "/customers",
    icon: Users,
  },
  {
    key: "bookings",
    nameId: "Jadwal Booking",
    nameEn: "Bookings",
    placeholderId: "Cari alamat, status, permintaan booking...",
    placeholderEn: "Search address, status, booking notes...",
    path: "/bookings",
    icon: CalendarCheck,
  },
  {
    key: "services",
    nameId: "Layanan & Spa",
    nameEn: "Services",
    placeholderId: "Cari treatment massage, kategori, harga...",
    placeholderEn: "Search service name, category, price...",
    path: "/services",
    icon: Sparkles,
  },
  {
    key: "therapists",
    nameId: "Terapis",
    nameEn: "Therapists",
    placeholderId: "Cari nama terapis, no WA, keahlian...",
    placeholderEn: "Search therapist name, WhatsApp, skills...",
    path: "/therapists",
    icon: UserCheck,
  },
  {
    key: "reviews",
    nameId: "Ulasan Pelanggan",
    nameEn: "Reviews",
    placeholderId: "Cari ulasan pelanggan, rating, komentar...",
    placeholderEn: "Search customer reviews, rating, comments...",
    path: "/reviews",
    icon: Star,
  },
  {
    key: "consumables",
    nameId: "Bahan & Inventaris",
    nameEn: "Consumables",
    placeholderId: "Cari minyak pijat, linen, stok bahan...",
    placeholderEn: "Search oils, massage supplies, unit...",
    path: "/consumables",
    icon: Package,
  },
  {
    key: "payouts",
    nameId: "Bagi Hasil",
    nameEn: "Payouts",
    placeholderId: "Cari nomor payout, nama terapis, bank...",
    placeholderEn: "Search payout number, therapist, bank...",
    path: "/payouts",
    icon: Wallet,
  },
  {
    key: "users",
    nameId: "Pengguna & Admin",
    nameEn: "Users",
    placeholderId: "Cari nama admin, username, role akun...",
    placeholderEn: "Search admin users, username, role...",
    path: "/users",
    icon: UserCog,
  },
];

const CONFIG_MAP = new Map(RESOURCE_CONFIGS.map((c) => [c.key, c]));

export function GlobalSearchBar({ className }: { className?: string }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  const inputRef = React.useRef<HTMLInputElement>(null);

  // Extract current active resource from pathname (e.g. /invoices -> "invoices")
  const pathSegment = location.pathname.split("/").filter(Boolean)[0] || "";
  const activeResourceConfig = CONFIG_MAP.get(pathSegment);

  // Determine selected scope (defaults to active page resource, or "invoices" if on dashboard/settings)
  const [overrideResource, setOverrideResource] = React.useState<string | null>(null);

  // If path changed and no manual override matches, sync back to current page
  React.useEffect(() => {
    setOverrideResource(null);
  }, [location.pathname]);

  const currentConfig = overrideResource
    ? CONFIG_MAP.get(overrideResource) || activeResourceConfig
    : activeResourceConfig;

  // Extract current "q" filter from URL search params
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

  // Local state for instant typing responsiveness
  const [searchValue, setSearchValue] = React.useState(currentUrlQuery);

  // Sync local state whenever URL query changes (e.g. page navigation or external clear)
  React.useEffect(() => {
    setSearchValue(currentUrlQuery);
  }, [currentUrlQuery]);

  // Debounce query update to URL
  React.useEffect(() => {
    const targetResourceKey = currentConfig?.key || pathSegment || "invoices";
    const isCurrentPage = pathSegment === targetResourceKey;

    const timer = setTimeout(() => {
      // Only auto-sync URL if on the current list page
      if (isCurrentPage && searchValue !== currentUrlQuery) {
        const searchParams = new URLSearchParams(location.search);
        let filterObj: Record<string, any> = {};

        try {
          const filterStr = searchParams.get("filter");
          if (filterStr) filterObj = JSON.parse(filterStr);
        } catch (e) {
          filterObj = {};
        }

        if (searchValue.trim() !== "") {
          filterObj.q = searchValue.trim();
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
  }, [searchValue, currentUrlQuery, location.pathname, location.search, currentConfig, pathSegment, navigate]);

  // Handle Enter key for cross-page search navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const targetResource = currentConfig?.key || "invoices";
      const targetPath = currentConfig?.path || `/${targetResource}`;
      const trimmed = searchValue.trim();

      const searchParams = new URLSearchParams();
      if (trimmed) {
        searchParams.set("filter", JSON.stringify({ q: trimmed }));
      }
      searchParams.set("page", "1");

      navigate(`${targetPath}?${searchParams.toString()}`);
    } else if (e.key === "Escape") {
      handleClear();
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    setSearchValue("");
    if (activeResourceConfig && pathSegment === activeResourceConfig.key) {
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
    }
  };

  const handleSelectResource = (resourceKey: string) => {
    const selected = CONFIG_MAP.get(resourceKey);
    if (!selected) return;

    setOverrideResource(resourceKey);

    // If there is an active search query, navigate directly to that page
    if (searchValue.trim()) {
      const searchParams = new URLSearchParams();
      searchParams.set("filter", JSON.stringify({ q: searchValue.trim() }));
      searchParams.set("page", "1");
      navigate(`${selected.path}?${searchParams.toString()}`);
    } else {
      navigate(selected.path);
    }
  };

  // Keyboard shortcut listener (⌘K / Ctrl+K)
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const ActiveIcon = currentConfig?.icon || Search;
  const activeName = isEn
    ? currentConfig?.nameEn || "All Resources"
    : currentConfig?.nameId || "Semua Halaman";
  const placeholderText = currentConfig
    ? isEn
      ? currentConfig.placeholderEn
      : currentConfig.placeholderId
    : isEn
    ? "Search anything in Serena Raga..."
    : "Cari data di Serena Raga...";

  const isDashboard = !pathSegment || pathSegment === "" || pathSegment === "admin" || !activeResourceConfig;

  return (
    <div
      className={cn(
        "relative flex items-center w-full transition-all duration-200",
        className
      )}
    >
      <div
        className={cn(
          "group flex items-center w-full h-9 rounded-lg border border-border/70 bg-muted/30 hover:bg-muted/50 focus-within:bg-background focus-within:border-foreground/40 focus-within:ring-1 focus-within:ring-ring transition-all duration-150 shadow-none px-2 gap-1.5"
        )}
      >
        {/* Resource Scope: Dropdown only on Dashboard, clean search icon on all other pages */}
        {isDashboard ? (
          <>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger className="inline-flex items-center h-6 px-1.5 sm:px-2 gap-1 text-[11px] font-medium text-foreground hover:bg-muted rounded-md shrink-0 focus-visible:ring-0 focus-visible:outline-none transition-colors select-none cursor-pointer">
                <ActiveIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="hidden sm:inline-block max-w-[100px] truncate">
                  {activeName}
                </span>
                <ChevronDown className="w-3 h-3 text-muted-foreground/70 shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 p-1 text-xs shadow-md">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2 py-1">
                  {isEn ? "Target Search Page" : "Pilih Halaman Pencarian"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {RESOURCE_CONFIGS.map((item) => {
                  const ItemIcon = item.icon;
                  const isSelected = currentConfig?.key === item.key;
                  return (
                    <DropdownMenuItem
                      key={item.key}
                      onClick={() => handleSelectResource(item.key)}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 text-xs rounded-md cursor-pointer",
                        isSelected && "bg-accent font-medium text-accent-foreground"
                      )}
                    >
                      <ItemIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="flex-1 truncate">{isEn ? item.nameEn : item.nameId}</span>
                      {isSelected && (
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                          {isEn ? "Active" : "Aktif"}
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="h-4 w-[1px] bg-border/80 shrink-0" />
          </>
        ) : (
          <Search className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0 ml-1" />
        )}

        {/* Search Input Field */}
        <div className="relative flex-1 flex items-center min-w-0">
          <Input
            ref={inputRef}
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholderText}
            className="h-7 border-0 bg-transparent px-1 text-xs text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none w-full"
          />
        </div>

        {/* Clear Button or ⌘K Shortcut Hint */}
        {searchValue ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-5 w-5 p-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
            title={isEn ? "Clear search" : "Hapus pencarian"}
          >
            <X className="w-3 h-3" />
          </Button>
        ) : (
          <kbd
            onClick={() => inputRef.current?.focus()}
            className="hidden md:inline-flex items-center gap-0.5 pointer-events-auto cursor-pointer select-none rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[9px] font-medium text-muted-foreground hover:text-foreground shadow-none shrink-0"
            title={isEn ? "Press Ctrl+K to search" : "Tekan Ctrl+K untuk mencari"}
          >
            <CommandIcon className="w-2.5 h-2.5" />K
          </kbd>
        )}
      </div>
    </div>
  );
}
